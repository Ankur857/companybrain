import { db } from '../database/db.js';
import { ConnectorFactory } from '../connectors/ConnectorFactory.js';
import { AuditService } from '../services/audit/auditService.js';
import crypto from 'crypto';

export class ConnectorController {
  /**
   * Helper to sanitize connector object for React frontend (ZERO secrets/tokens)
   */
  static sanitizeConnector(connector, account = null) {
    if (!connector) return null;
    const sanitized = {
      id: connector.id,
      tenant_id: connector.tenant_id,
      type: connector.type,
      name: connector.name,
      status: connector.status,
      is_development_mode: Boolean(connector.is_development_mode),
      document_count: connector.document_count || 0,
      sync_status: connector.sync_status || 'IDLE',
      last_sync_at: connector.last_sync_at,
      created_at: connector.created_at,
      updated_at: connector.updated_at,
      account: account
        ? {
            id: account.id,
            email: account.account_email,
            name: account.account_name,
            providerAccountId: account.provider_account_id,
            connectedAt: account.created_at,
          }
        : null,
    };
    return sanitized;
  }

  /**
   * GET /api/connectors
   */
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: connectors } = await db.from('connectors').select('*').eq('tenant_id', tenantId);
      const { data: accounts } = await db.from('connector_accounts').select('*').eq('tenant_id', tenantId);

      const accountMap = Object.fromEntries((accounts || []).map((acc) => [acc.connector_id, acc]));

      const sanitized = (connectors || []).map((c) =>
        ConnectorController.sanitizeConnector(c, accountMap[c.id])
      );

      return res.json({ success: true, connectors: sanitized });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/types
   */
  static async getTypes(req, res) {
    try {
      const types = ConnectorFactory.getSupportedTypes();
      return res.json({ success: true, types });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: connector } = await db.from('connectors').select('*').eq('id', id).single();
      if (!connector) {
        return res.status(404).json({ success: false, error: 'Connector not found.' });
      }

      if (connector.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Access forbidden: Tenant isolation boundary.' });
      }

      const { data: account } = await db.from('connector_accounts').select('*').eq('connector_id', id).single();

      return res.json({
        success: true,
        connector: ConnectorController.sanitizeConnector(connector, account),
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/oauth/:provider/authorize
   * Generate live OAuth authorization URL
   */
  static async getOAuthUrl(req, res) {
    try {
      const { provider } = req.params;
      let { clientId, clientSecret, tenantId: msTenantId } = req.query;
      if (clientId === 'undefined' || !clientId) clientId = undefined;
      if (clientSecret === 'undefined' || !clientSecret) clientSecret = undefined;
      if (msTenantId === 'undefined' || !msTenantId) msTenantId = undefined;

      const userTenantId = req.user.tenant_id;

      const statePayload = {
        tenantId: userTenantId,
        userId: req.user.id,
        provider,
        timestamp: Date.now(),
      };
      const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

      const baseUrl = (process.env.APP_URL && process.env.APP_URL.trim())
        ? process.env.APP_URL.replace(/\/+$/, '')
        : `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
      const redirectUri = `${baseUrl}/api/connectors/oauth/${provider}/callback`;

      const adapter = ConnectorFactory.create(
        provider,
        { clientId, clientSecret, tenantId: msTenantId },
        null,
        false
      );

      const authUrl = adapter.getAuthorizationUrl(state, redirectUri);
      return res.json({ success: true, authUrl, redirectUri });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/oauth/:provider/callback
   * Exchange OAuth code, persist account & tokens securely server-side, redirect to frontend
   */
  static async handleOAuthCallback(req, res) {
    try {
      const { provider } = req.params;
      const { code, state, error, error_description } = req.query;

      if (error) {
        return res.redirect(`/connectors?error=${encodeURIComponent(error_description || error)}`);
      }

      if (!code || !state) {
        return res.redirect('/connectors?error=Missing+OAuth+code+or+state');
      }

      let stateObj;
      try {
        stateObj = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
      } catch (err) {
        return res.redirect('/connectors?error=Invalid+OAuth+state+parameter');
      }

      const { tenantId, userId } = stateObj;
      const baseUrl = (process.env.APP_URL && process.env.APP_URL.trim())
        ? process.env.APP_URL.replace(/\/+$/, '')
        : `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
      const redirectUri = `${baseUrl}/api/connectors/oauth/${provider}/callback`;

      const adapter = ConnectorFactory.create(provider, {}, null, false);
      const authResult = await adapter.handleOAuthCallback(code, redirectUri);

      // Check for existing connector of this type for this tenant or create a new one
      const { data: existingConnectors } = await db.from('connectors').select('*').eq('tenant_id', tenantId).eq('type', provider);

      let connectorId;
      const defaultName = provider === 'google_drive' ? 'Google Drive' : 'Microsoft SharePoint';

      if (existingConnectors && existingConnectors.length > 0) {
        connectorId = existingConnectors[0].id;
        await db.from('connectors').update({
          status: 'CONNECTED',
          is_development_mode: false,
          sync_status: 'IDLE',
          updated_at: new Date().toISOString(),
        }).eq('id', connectorId);
      } else {
        connectorId = crypto.randomUUID();
        await db.from('connectors').insert({
          id: connectorId,
          tenant_id: tenantId,
          type: provider,
          name: defaultName,
          status: 'CONNECTED',
          is_development_mode: false,
          created_by: userId,
          configuration: {},
          last_sync_at: null,
          sync_status: 'IDLE',
          document_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Upsert connector_accounts with secure tokens stored strictly on backend
      const { data: existingAccount } = await db.from('connector_accounts').select('*').eq('connector_id', connectorId).single();

      if (existingAccount) {
        await db.from('connector_accounts').update({
          provider_account_id: authResult.providerAccountId,
          account_email: authResult.accountEmail,
          account_name: authResult.accountName,
          credential_reference: authResult.credentials,
          metadata: { picture: authResult.picture },
          updated_at: new Date().toISOString(),
        }).eq('id', existingAccount.id);
      } else {
        await db.from('connector_accounts').insert({
          id: crypto.randomUUID(),
          connector_id: connectorId,
          tenant_id: tenantId,
          provider_account_id: authResult.providerAccountId,
          account_email: authResult.accountEmail,
          account_name: authResult.accountName,
          credential_reference: authResult.credentials,
          metadata: { picture: authResult.picture },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Audit Log: CONNECTOR_CONNECTED
      const { data: user } = await db.from('users').select('name').eq('id', userId).single();
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: userId,
        user_name: user?.name || 'Administrator',
        action: 'CONNECTOR_CONNECTED',
        resource_type: 'CONNECTOR',
        resource_id: defaultName,
        decision: 'SUCCESS',
        reason: `Authenticated real account [${authResult.accountEmail}] for ${defaultName}.`,
        metadata: { connectorId, provider, accountEmail: authResult.accountEmail },
      });

      return res.redirect(`/connectors?connected=${provider}&account=${encodeURIComponent(authResult.accountEmail)}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      return res.redirect(`/connectors?error=${encodeURIComponent(err.message)}`);
    }
  }

  /**
   * POST /api/connectors/supabase/connect
   * Connect real Supabase project
   */
  static async connectSupabase(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { projectUrl, apiKey, name = 'Supabase' } = req.body;

      if (!projectUrl || !apiKey) {
        return res.status(400).json({ success: false, error: 'Project URL and API Key are required.' });
      }

      // Verify connection against live Supabase project
      const adapter = ConnectorFactory.create('supabase', { projectUrl, apiKey }, null, false);
      const testResult = await adapter.testConnection();

      // Check existing connector
      const { data: existing } = await db.from('connectors').select('*').eq('tenant_id', tenantId).eq('type', 'supabase');

      let connectorId;
      if (existing && existing.length > 0) {
        connectorId = existing[0].id;
        await db.from('connectors').update({
          name,
          status: 'CONNECTED',
          is_development_mode: false,
          sync_status: 'IDLE',
          updated_at: new Date().toISOString(),
        }).eq('id', connectorId);
      } else {
        connectorId = crypto.randomUUID();
        await db.from('connectors').insert({
          id: connectorId,
          tenant_id: tenantId,
          type: 'supabase',
          name,
          status: 'CONNECTED',
          is_development_mode: false,
          created_by: req.user.id,
          configuration: {},
          last_sync_at: null,
          sync_status: 'IDLE',
          document_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Store credentials server-side only in connector_accounts
      const { data: existingAccount } = await db.from('connector_accounts').select('*').eq('connector_id', connectorId).single();

      if (existingAccount) {
        await db.from('connector_accounts').update({
          account_email: projectUrl,
          account_name: 'Supabase Project',
          credential_reference: { projectUrl, apiKey },
          updated_at: new Date().toISOString(),
        }).eq('id', existingAccount.id);
      } else {
        await db.from('connector_accounts').insert({
          id: crypto.randomUUID(),
          connector_id: connectorId,
          tenant_id: tenantId,
          account_email: projectUrl,
          account_name: 'Supabase Project',
          credential_reference: { projectUrl, apiKey },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_CONNECTED',
        resource_type: 'CONNECTOR',
        resource_id: name,
        decision: 'SUCCESS',
        reason: `Connected live Supabase project [${projectUrl}] (${testResult.tablesFound} tables found).`,
        metadata: { connectorId, projectUrl },
      });

      return res.status(201).json({
        success: true,
        message: `Connected to Supabase project! Found ${testResult.tablesFound} tables.`,
        connectorId,
        testResult,
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/supabase/upload
   * Admin-only manual document/file upload to Supabase knowledge storage
   */
  static async uploadSupabaseDocument(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const {
        title,
        content,
        fileName,
        department,
        project,
        projectId,
        project_id,
        classification,
        required_groups,
        allowed_user_ids,
        fileType,
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Document title and content are required.' });
      }

      const docId = crypto.randomUUID();
      const newDoc = {
        id: docId,
        tenant_id: tenantId,
        title: title.trim(),
        content: content.trim(),
        department: department || 'General',
        project: project || 'Enterprise Knowledge',
        classification: classification || 'INTERNAL',
        source_type: 'supabase',
        source_url: `supabase://storage/documents/${fileName || title}`,
        owner: req.user.email,
        version: '1.0',
        required_groups: Array.isArray(required_groups) ? required_groups : [],
        is_demo: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          fileName: fileName || `${title}.txt`,
          fileType: fileType || 'text/plain',
          uploadedBy: req.user.name,
          uploadedByEmail: req.user.email,
          uploadedAt: new Date().toISOString(),
          allowed_user_ids: Array.isArray(allowed_user_ids) ? allowed_user_ids : [],
          storageProvider: 'Supabase Knowledge Storage',
        },
      };

      await db.from('documents').insert(newDoc);

      // Auto-link document to target project, user projects, or active tenant projects
      try {
        const { data: tenantProjects } = await db.from('projects').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE');
        const cleanProj = (project || '').trim().toLowerCase();
        let targetProject = (tenantProjects || []).find(
          (p) => p.id === project || p.name.toLowerCase() === cleanProj || (p.code && p.code.toLowerCase() === cleanProj)
        );
        if (!targetProject && (tenantProjects || []).length > 0) {
          targetProject = tenantProjects[0];
        }

        const projectIdsToLink = new Set();
        const explicitId = projectId || project_id;
        if (explicitId) projectIdsToLink.add(explicitId);
        if (targetProject) projectIdsToLink.add(targetProject.id);

        if (Array.isArray(allowed_user_ids) && allowed_user_ids.length > 0) {
          const { data: memberships } = await db
            .from('project_members')
            .select('project_id')
            .in('user_id', allowed_user_ids);
          (memberships || []).forEach((m) => projectIdsToLink.add(m.project_id));
        }

        for (const pId of projectIdsToLink) {
          const { data: existingPk } = await db
            .from('project_knowledge')
            .select('*')
            .eq('project_id', pId)
            .eq('document_id', newDoc.id)
            .single();

          if (!existingPk) {
            await db.from('project_knowledge').insert({
              id: crypto.randomUUID(),
              project_id: pId,
              document_id: newDoc.id,
              created_at: new Date().toISOString(),
            });
          }
        }
      } catch (linkErr) {
        console.error('Failed to auto-link document to project_knowledge:', linkErr);
      }

      // Audit event
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'KNOWLEDGE_SELECTED',
        resource_type: 'DOCUMENT',
        resource_id: newDoc.title,
        decision: 'SUCCESS',
        reason: `Administrator manually uploaded document [${newDoc.title}] to Supabase Knowledge Storage.`,
        metadata: {
          classification: newDoc.classification,
          required_groups: newDoc.required_groups,
          allowed_user_ids: newDoc.metadata.allowed_user_ids,
        },
      });

      return res.status(201).json({
        success: true,
        message: `Uploaded "${newDoc.title}" to Supabase Knowledge Storage successfully.`,
        document: newDoc,
      });
    } catch (err) {
      console.error('Supabase upload error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/supabase/upload-folder
   * Admin only: Bulk upload an entire directory/folder of files into Supabase Knowledge Storage
   */
  static async uploadSupabaseFolder(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const {
        folderName,
        files = [],
        department = 'General',
        project = 'Enterprise Knowledge',
        projectId,
        project_id,
        classification = 'INTERNAL',
        required_groups = [],
        allowed_user_ids = []
      } = req.body;

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files provided in folder upload payload.' });
      }

      const cleanFolderName = (folderName || 'Uploaded Folder').trim();
      const insertedDocs = [];

      for (const file of files) {
        const docId = crypto.randomUUID();
        const title = file.relativePath
          ? `[${cleanFolderName}] ${file.relativePath}`
          : `[${cleanFolderName}] ${file.fileName || file.title || 'Untitled Document'}`;

        const newDoc = {
          id: docId,
          tenant_id: tenantId,
          title,
          content: file.content || `[Document: ${file.fileName || title}]`,
          department: department || 'General',
          project: project || cleanFolderName,
          classification: classification || 'INTERNAL',
          source_type: 'supabase',
          source_url: `supabase://storage/folders/${cleanFolderName}/${file.relativePath || file.fileName || docId}`,
          owner: req.user.email,
          version: '1.0',
          required_groups: Array.isArray(required_groups) ? required_groups : [],
          is_demo: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            folderName: cleanFolderName,
            fileName: file.fileName || file.title,
            relativePath: file.relativePath || file.fileName,
            fileType: file.fileType || 'text/plain',
            sizeBytes: file.sizeBytes || (file.content ? file.content.length : 0),
            uploadedBy: req.user.name,
            uploadedByEmail: req.user.email,
            uploadedAt: new Date().toISOString(),
            allowed_user_ids: Array.isArray(allowed_user_ids) ? allowed_user_ids : [],
            storageProvider: 'Supabase Knowledge Storage (Folder Ingestion)',
          },
        };

        await db.from('documents').insert(newDoc);
        insertedDocs.push(newDoc);
      }

      // Auto-link folder documents to target project, user projects, or active tenant projects
      try {
        const { data: tenantProjects } = await db.from('projects').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE');
        const targetProjectStr = (project || cleanFolderName || '').trim().toLowerCase();
        let targetProject = (tenantProjects || []).find(
          (p) => p.id === project || p.name.toLowerCase() === targetProjectStr || (p.code && p.code.toLowerCase() === targetProjectStr)
        );
        if (!targetProject && (tenantProjects || []).length > 0) {
          targetProject = tenantProjects[0];
        }

        const projectIdsToLink = new Set();
        const explicitId = projectId || project_id;
        if (explicitId) projectIdsToLink.add(explicitId);
        if (targetProject) projectIdsToLink.add(targetProject.id);

        if (Array.isArray(allowed_user_ids) && allowed_user_ids.length > 0) {
          const { data: memberships } = await db
            .from('project_members')
            .select('project_id')
            .in('user_id', allowed_user_ids);
          (memberships || []).forEach((m) => projectIdsToLink.add(m.project_id));
        }

        for (const doc of insertedDocs) {
          for (const pId of projectIdsToLink) {
            const { data: existingPk } = await db
              .from('project_knowledge')
              .select('*')
              .eq('project_id', pId)
              .eq('document_id', doc.id)
              .single();

            if (!existingPk) {
              await db.from('project_knowledge').insert({
                id: crypto.randomUUID(),
                project_id: pId,
                document_id: doc.id,
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      } catch (linkErr) {
        console.error('Failed to auto-link folder documents to project_knowledge:', linkErr);
      }

      // Log structured audit event
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'KNOWLEDGE_SELECTED',
        resource_type: 'FOLDER',
        resource_id: cleanFolderName,
        decision: 'SUCCESS',
        reason: `Administrator uploaded folder [${cleanFolderName}] containing ${insertedDocs.length} document(s) into Supabase Knowledge Storage.`,
        metadata: {
          folderName: cleanFolderName,
          fileCount: insertedDocs.length,
          classification,
          required_groups,
          allowed_user_ids,
        },
      });

      return res.status(201).json({
        success: true,
        message: `Successfully uploaded folder "${cleanFolderName}" with ${insertedDocs.length} document(s) to Supabase Knowledge Storage.`,
        count: insertedDocs.length,
        folderName: cleanFolderName,
        documents: insertedDocs,
      });
    } catch (err) {
      console.error('Supabase folder upload error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/development/connect
   * Explicit test connection mode clearly labeled DEVELOPMENT MODE
   */
  static async connectDevelopment(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { type, name } = req.body;

      if (!['google_drive', 'supabase'].includes(type)) {
        return res.status(400).json({ success: false, error: 'Invalid connector type.' });
      }

      const connectorId = crypto.randomUUID();
      const connectorName = name || `${type.replace('_', ' ').toUpperCase()} (DEV MODE)`;

      await db.from('connectors').insert({
        id: connectorId,
        tenant_id: tenantId,
        type,
        name: connectorName,
        status: 'CONNECTED',
        is_development_mode: true,
        created_by: req.user.id,
        configuration: {},
        last_sync_at: null,
        sync_status: 'IDLE',
        document_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await db.from('connector_accounts').insert({
        id: crypto.randomUUID(),
        connector_id: connectorId,
        tenant_id: tenantId,
        account_email: 'dev-admin@companybrain.local',
        account_name: 'Local Developer Account',
        credential_reference: { isDevelopmentMode: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_CONNECTED',
        resource_type: 'CONNECTOR',
        resource_id: connectorName,
        decision: 'SUCCESS',
        reason: `Administrator initialized connector in explicit DEVELOPMENT MODE.`,
        metadata: { connectorId, isDevelopmentMode: true },
      });

      return res.status(201).json({
        success: true,
        connector: { id: connectorId, name: connectorName, type, is_development_mode: true },
        message: `Connected in DEVELOPMENT MODE.`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/:id/browse
   * Dynamically queries the real provider API for actual files, folders, and tables
   */
  static async browse(req, res) {
    try {
      const { id } = req.params;
      let { folderId, search } = req.query;
      if (folderId === 'undefined' || !folderId) folderId = 'root';
      if (search === 'undefined' || !search) search = '';
      const tenantId = req.user.tenant_id;

      const { data: connector } = await db.from('connectors').select('*').eq('id', id).single();
      if (!connector) {
        return res.status(404).json({ success: false, error: 'Connector not found.' });
      }

      if (connector.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Access forbidden: Tenant isolation boundary.' });
      }

      if (connector.status === 'DISCONNECTED') {
        return res.status(400).json({ success: false, error: 'Connector is disconnected.' });
      }

      const { data: account } = await db.from('connector_accounts').select('*').eq('connector_id', id).single();

      const adapter = ConnectorFactory.create(
        connector.type,
        connector.configuration,
        account,
        connector.is_development_mode
      );

      const items = await adapter.listItems(folderId, search);

      // Load already selected items in CompanyBrain for this connector
      const { data: selectedRecords } = await db.from('connector_items').select('*').eq('connector_id', id).eq('tenant_id', tenantId);
      const selectedMap = Object.fromEntries((selectedRecords || []).map((r) => [r.external_id, r]));

      // Merge selection status and CompanyBrain access rules
      const enrichedItems = items.map((item) => {
        const existing = selectedMap[item.external_id];
        return {
          ...item,
          connector_id: id,
          is_selected: Boolean(existing?.is_selected),
          companybrain_item_id: existing?.id || null,
        };
      });

      return res.json({
        success: true,
        connector: ConnectorController.sanitizeConnector(connector, account),
        currentFolderId: folderId || 'root',
        items: enrichedItems,
      });
    } catch (err) {
      console.error('Browse error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/select
   * Explicitly select files/folders/tables to add to CompanyBrain knowledge
   */
  static async selectKnowledge(req, res) {
    try {
      const { id } = req.params;
      const { items = [] } = req.body;
      const tenantId = req.user.tenant_id;

      const { data: connector } = await db.from('connectors').select('*').eq('id', id).single();
      if (!connector) return res.status(404).json({ success: false, error: 'Connector not found.' });

      if (connector.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Access forbidden: Tenant isolation boundary.' });
      }

      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'Items array is required.' });
      }

      // Upsert selected items into connector_items table
      const processed = [];
      for (const item of items) {
        const { data: existing } = await db.from('connector_items').select('id').eq('connector_id', id).eq('external_id', item.external_id).single();

        if (existing) {
          await db.from('connector_items').update({
            name: item.name,
            path: item.path,
            is_selected: item.is_selected !== false,
            mime_type: item.mime_type || '',
            source_url: item.source_url || '',
            metadata: item.metadata || {},
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id);
          processed.push(existing.id);
        } else {
          const newId = crypto.randomUUID();
          await db.from('connector_items').insert({
            id: newId,
            connector_id: id,
            tenant_id: tenantId,
            external_id: item.external_id,
            parent_id: item.parent_id || null,
            item_type: item.item_type || 'file',
            name: item.name,
            path: item.path,
            source_type: connector.type,
            mime_type: item.mime_type || '',
            source_url: item.source_url || '',
            metadata: item.metadata || {},
            is_selected: true,
            sync_status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          processed.push(newId);
        }
      }

      // Update connector selected document_count
      const { data: selectedCountRes } = await db.from('connector_items').select('id').eq('connector_id', id).eq('is_selected', true);
      const selectedCount = selectedCountRes ? selectedCountRes.length : processed.length;

      await db.from('connectors').update({
        document_count: selectedCount,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'KNOWLEDGE_SELECTED',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'SUCCESS',
        reason: `Admin selected ${items.length} file(s)/folder(s) for CompanyBrain knowledge inclusion.`,
        metadata: { connectorId: id, selectedCount },
      });

      return res.json({
        success: true,
        selectedCount,
        message: `${items.length} item(s) selected for CompanyBrain.`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/:id/items/:itemId/access
   */
  static async getItemAccess(req, res) {
    try {
      const { id, itemId } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: item } = await db.from('connector_items').select('*').eq('id', itemId).eq('tenant_id', tenantId).single();
      if (!item) return res.status(404).json({ success: false, error: 'Item not found.' });

      const { data: users } = await db.from('users').select('id, name, email, department').eq('tenant_id', tenantId);
      const { data: groups } = await db.from('groups').select('id, name, description').eq('tenant_id', tenantId);
      const { data: directRules } = await db.from('connector_access_rules').select('*').eq('connector_item_id', itemId).eq('tenant_id', tenantId);

      // Check ancestor folder inheritance
      const { data: allItems } = await db.from('connector_items').select('*').eq('connector_id', id).eq('tenant_id', tenantId);
      const itemByExtId = Object.fromEntries((allItems || []).map((it) => [it.external_id, it]));
      const { data: allRules } = await db.from('connector_access_rules').select('*').eq('tenant_id', tenantId);

      const inherited = [];
      let parentExt = item.parent_id;
      while (parentExt) {
        const parent = itemByExtId[parentExt];
        if (!parent) break;

        const pRules = (allRules || []).filter((r) => r.connector_item_id === parent.id);
        if (pRules.length > 0) {
          inherited.push({
            folderId: parent.id,
            folderName: parent.name,
            folderPath: parent.path,
            rules: pRules,
          });
        }
        parentExt = parent.parent_id;
      }

      return res.json({
        success: true,
        item,
        directRules: directRules || [],
        inherited,
        availableUsers: users || [],
        availableGroups: groups || [],
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/items/:itemId/access
   */
  static async saveItemAccess(req, res) {
    try {
      const { id, itemId } = req.params;
      const tenantId = req.user.tenant_id;
      const { userIds = [], groupIds = [] } = req.body;

      const { data: item } = await db.from('connector_items').select('*').eq('id', itemId).eq('tenant_id', tenantId).single();
      if (!item) return res.status(404).json({ success: false, error: 'Item not found.' });

      // Existing direct rules
      const { data: existingRules } = await db.from('connector_access_rules').select('*').eq('connector_item_id', itemId).eq('tenant_id', tenantId);

      await db.from('connector_access_rules').delete().eq('connector_item_id', itemId);

      const newRules = [];
      for (const uId of userIds) {
        newRules.push({
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          connector_item_id: itemId,
          subject_type: 'USER',
          subject_id: uId,
          permission: 'READ',
          created_by: req.user.id,
          created_at: new Date().toISOString(),
        });
      }

      for (const gId of groupIds) {
        newRules.push({
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          connector_item_id: itemId,
          subject_type: 'GROUP',
          subject_id: gId,
          permission: 'READ',
          created_by: req.user.id,
          created_at: new Date().toISOString(),
        });
      }

      if (newRules.length > 0) {
        await db.from('connector_access_rules').insert(newRules);
      }

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'ACCESS_GRANTED',
        resource_type: 'CONNECTOR_ITEM',
        resource_id: item.name,
        decision: 'SUCCESS',
        reason: `Assigned access rules to [${item.name}]: ${userIds.length} user(s), ${groupIds.length} group(s).`,
        metadata: { itemId, userIds, groupIds },
      });

      return res.json({ success: true, message: `Access rules saved for ${item.name}.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/sync
   * Ingest only explicitly selected real files/data
   */
  static async sync(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: connector } = await db.from('connectors').select('*').eq('id', id).single();
      if (!connector) return res.status(404).json({ success: false, error: 'Connector not found.' });

      if (connector.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Access forbidden: Tenant isolation boundary.' });
      }

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_SYNC_STARTED',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'INFO',
        reason: `Initiated knowledge sync for [${connector.name}].`,
        metadata: { connectorId: id },
      });

      await db.from('connectors').update({
        status: 'SYNCING',
        sync_status: 'SYNCING',
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      const { data: account } = await db.from('connector_accounts').select('*').eq('connector_id', id).single();
      const adapter = ConnectorFactory.create(
        connector.type,
        connector.configuration,
        account,
        connector.is_development_mode
      );

      // Selected items only
      const { data: selectedItems } = await db.from('connector_items').select('*').eq('connector_id', id).eq('tenant_id', tenantId).eq('is_selected', true);

      const { data: allRules } = await db.from('connector_access_rules').select('*').eq('tenant_id', tenantId);
      const { data: allItems } = await db.from('connector_items').select('*').eq('connector_id', id).eq('tenant_id', tenantId);
      const itemByExtId = Object.fromEntries((allItems || []).map((it) => [it.external_id, it]));

      let indexedCount = 0;

      for (const item of (selectedItems || [])) {
        // Resolve permissions (direct + folder inherited)
        const directRules = (allRules || []).filter((r) => r.connector_item_id === item.id);
        const groupIds = new Set(directRules.filter((r) => r.subject_type === 'GROUP').map((r) => r.subject_id));
        const userIds = new Set(directRules.filter((r) => r.subject_type === 'USER').map((r) => r.subject_id));

        let parentExt = item.parent_id;
        while (parentExt) {
          const parent = itemByExtId[parentExt];
          if (!parent) break;

          const pRules = (allRules || []).filter((r) => r.connector_item_id === parent.id);
          for (const pr of pRules) {
            if (pr.subject_type === 'GROUP') groupIds.add(pr.subject_id);
            if (pr.subject_type === 'USER') userIds.add(pr.subject_id);
          }
          parentExt = parent.parent_id;
        }

        // Fetch actual content from the real source
        let realContent = '';
        try {
          realContent = await adapter.downloadItem(item.external_id, item.metadata || {});
        } catch (fetchErr) {
          console.warn(`Content fetch warning for [${item.name}]:`, fetchErr.message);
          realContent = `Knowledge item: ${item.name} (${item.path})\nSource: ${connector.name}`;
        }

        const docExternalId = `conn-${connector.type}-${item.external_id}`;
        const { data: existingDoc } = await db.from('documents').select('id').eq('tenant_id', tenantId).eq('external_id', docExternalId).single();

        let docId = existingDoc?.id;
        if (docId) {
          await db.from('documents').update({
            title: item.name,
            content: realContent,
            source_type: connector.type,
            source_url: item.source_url || item.path,
            required_groups: Array.from(groupIds),
            metadata: {
              ...item.metadata,
              allowed_user_ids: Array.from(userIds),
              connector_id: id,
              connector_item_id: item.id,
              last_synced: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          }).eq('id', docId);
        } else {
          docId = crypto.randomUUID();
          await db.from('documents').insert({
            id: docId,
            tenant_id: tenantId,
            connector_id: id,
            external_id: docExternalId,
            title: item.name,
            content: realContent,
            source_type: connector.type,
            source_url: item.source_url || item.path,
            department: item.metadata?.department || 'Engineering',
            project: item.metadata?.project || 'Core',
            classification: item.metadata?.classification || 'INTERNAL',
            owner: req.user.email,
            version: '1.0',
            required_groups: Array.from(groupIds),
            metadata: {
              ...item.metadata,
              allowed_user_ids: Array.from(userIds),
              connector_id: id,
              connector_item_id: item.id,
              last_synced: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        for (const grpId of groupIds) {
          await db.from('document_permissions').insert({
            id: crypto.randomUUID(),
            document_id: docId,
            group_id: grpId,
            access_type: 'READ',
            created_at: new Date().toISOString(),
          });
        }

        await db.from('connector_items').update({
          sync_status: 'SYNCED',
          updated_at: new Date().toISOString(),
        }).eq('id', item.id);

        indexedCount++;
      }

      const syncTime = new Date().toISOString();
      await db.from('connectors').update({
        status: 'CONNECTED',
        sync_status: 'SYNCED',
        last_sync_at: syncTime,
        document_count: indexedCount,
        updated_at: syncTime,
      }).eq('id', id);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_SYNC_COMPLETED',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'SUCCESS',
        reason: `Successfully synchronized ${indexedCount} real knowledge items from [${connector.name}].`,
        metadata: { connectorId: id, indexedCount },
      });

      return res.json({
        success: true,
        indexedCount,
        last_sync_at: syncTime,
        message: `Synchronized ${indexedCount} real knowledge items into CompanyBrain.`,
      });
    } catch (err) {
      console.error('Sync error:', err);
      const { id } = req.params;
      await db.from('connectors').update({ status: 'ERROR', sync_status: 'ERROR' }).eq('id', id);

      await AuditService.logEvent({
        tenant_id: req.user.tenant_id,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_SYNC_FAILED',
        resource_type: 'CONNECTOR',
        resource_id: id,
        decision: 'FAILED',
        reason: `Sync failed: ${err.message}`,
      });

      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/disconnect
   */
  static async disconnect(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: connector } = await db.from('connectors').select('*').eq('id', id).single();
      if (!connector) return res.status(404).json({ success: false, error: 'Connector not found.' });

      if (connector.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Access forbidden: Tenant isolation boundary.' });
      }

      const { data: account } = await db.from('connector_accounts').select('*').eq('connector_id', id).single();
      if (account) {
        const adapter = ConnectorFactory.create(connector.type, connector.configuration, account);
        await adapter.disconnect();
        await db.from('connector_accounts').delete().eq('id', account.id);
      }

      await db.from('connectors').update({
        status: 'DISCONNECTED',
        sync_status: 'IDLE',
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_DISCONNECTED',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'SUCCESS',
        reason: `Administrator disconnected real account connection for [${connector.name}].`,
        metadata: { connectorId: id, provider: connector.type },
      });

      return res.json({ success: true, message: `${connector.name} disconnected successfully.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/connectors/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: connector } = await db.from('connectors').select('*').eq('id', id).single();
      if (!connector) return res.status(404).json({ success: false, error: 'Connector not found.' });

      if (connector.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Access forbidden: Tenant isolation boundary.' });
      }

      await db.from('connector_accounts').delete().eq('connector_id', id);
      await db.from('connector_items').delete().eq('connector_id', id);
      await db.from('connectors').delete().eq('id', id);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_DISCONNECTED',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'SUCCESS',
        reason: `Removed connector [${connector.name}].`,
      });

      return res.json({ success: true, message: 'Connector deleted.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/test
   */
  static async test(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: connector } = await db.from('connectors').select('*').eq('id', id).single();
      if (!connector) return res.status(404).json({ success: false, error: 'Connector not found.' });

      if (connector.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Access forbidden.' });
      }

      const { data: account } = await db.from('connector_accounts').select('*').eq('connector_id', id).single();
      const adapter = ConnectorFactory.create(connector.type, connector.configuration, account, connector.is_development_mode);

      const testResult = await adapter.testConnection();
      return res.json({ success: true, connector: connector.name, testResult });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
