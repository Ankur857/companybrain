import { db } from '../database/db.js';
import { ConnectorFactory } from '../connectors/ConnectorFactory.js';
import { AuditService } from '../services/audit/auditService.js';
import crypto from 'crypto';

export class ConnectorController {
  /**
   * Helper to strip sensitive credentials before sending to React client
   */
  static sanitizeConnector(connector) {
    if (!connector) return null;
    const sanitized = { ...connector };
    if (sanitized.configuration) {
      const conf = { ...sanitized.configuration };
      delete conf.apiKey;
      delete conf.serviceAccountKey;
      delete conf.clientSecret;
      delete conf.password;
      sanitized.configuration = conf;
    }
    return sanitized;
  }

  /**
   * GET /api/connectors
   * Retrieve all connectors for authenticated tenant
   */
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: connectors } = await db.from('connectors').select('*').eq('tenant_id', tenantId);

      const sanitized = (connectors || []).map(ConnectorController.sanitizeConnector);
      return res.json({ success: true, connectors: sanitized });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/types
   * Returns supported connectors: Google Drive, SharePoint, Supabase
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

      return res.json({ success: true, connector: ConnectorController.sanitizeConnector(connector) });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors
   * Connect data source (Google Drive, SharePoint, Supabase)
   */
  static async create(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { type, name, configuration = {}, isDemo = false } = req.body;

      if (!type || !name) {
        return res.status(400).json({ success: false, error: 'Type and name are required.' });
      }

      const supported = ['google_drive', 'sharepoint', 'supabase'];
      if (!supported.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported connector type. Allowed: ${supported.join(', ')}`,
        });
      }

      // Check if real credentials exist or if demo mode applies
      const hasLiveCreds = Boolean(
        configuration.serviceAccountKey ||
        configuration.accessToken ||
        (configuration.clientId && configuration.clientSecret) ||
        (configuration.projectUrl && configuration.apiKey)
      );

      const effectiveIsDemo = Boolean(isDemo || !hasLiveCreds);

      // Verify connection via connector adapter
      const adapter = ConnectorFactory.create(type, configuration, effectiveIsDemo);
      const connResult = await adapter.connect();

      const connectorId = crypto.randomUUID();
      const newConnector = {
        id: connectorId,
        tenant_id: tenantId,
        type,
        name,
        status: 'CONNECTED',
        is_demo: effectiveIsDemo,
        created_by: req.user.id,
        configuration: configuration || {},
        last_sync_at: null,
        sync_status: 'IDLE',
        document_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.from('connectors').insert(newConnector);

      // Discovers and populates repository items into connector_items table
      const discoveredItems = await adapter.listItems('ALL');
      const itemRows = discoveredItems.map((item) => ({
        id: crypto.randomUUID(),
        connector_id: connectorId,
        tenant_id: tenantId,
        external_id: item.external_id,
        parent_id: item.parent_id,
        item_type: item.item_type,
        name: item.name,
        path: item.path,
        source_type: item.source_type,
        mime_type: item.mime_type || '',
        metadata: { ...item.metadata, content: item.content || '' },
        is_selected: false,
        sync_status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      if (itemRows.length > 0) {
        await db.from('connector_items').insert(itemRows);
      }

      // Audit Log: CONNECTOR_CONNECTED
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_CONNECTED',
        resource_type: 'CONNECTOR',
        resource_id: name,
        decision: 'SUCCESS',
        reason: `Administrator connected [${name}] (${type})${effectiveIsDemo ? ' in Demo mode' : ''}.`,
        metadata: { connectorId, type, isDemo: effectiveIsDemo, discoveredItems: itemRows.length },
      });

      return res.status(201).json({
        success: true,
        connector: ConnectorController.sanitizeConnector(newConnector),
        message: connResult.message,
        isDemo: effectiveIsDemo,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/test
   * Test connection
   */
  static async test(req, res) {
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

      const adapter = ConnectorFactory.create(connector.type, connector.configuration, connector.is_demo);
      const testResult = await adapter.testConnection();

      return res.json({
        success: true,
        connector: connector.name,
        testResult,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/disconnect
   * Disconnect connector
   */
  static async disconnect(req, res) {
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

      await db.from('connectors').update({
        status: 'DISCONNECTED',
        sync_status: 'IDLE',
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      // Audit Log: CONNECTOR_DISCONNECTED
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_DISCONNECTED',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'SUCCESS',
        reason: `Administrator disconnected [${connector.name}].`,
        metadata: { connectorId: id, type: connector.type },
      });

      return res.json({ success: true, message: 'Connector disconnected successfully.' });
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
      if (!connector) {
        return res.status(404).json({ success: false, error: 'Connector not found.' });
      }

      if (connector.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Access forbidden: Tenant isolation boundary.' });
      }

      // Remove items and access rules
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
        reason: `Connector [${connector.name}] was deleted.`,
        metadata: { connectorId: id },
      });

      return res.json({ success: true, message: 'Connector removed successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/:id/items
   * Browse hierarchical source items with selection status and access rules
   */
  static async getItems(req, res) {
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

      // Fetch items from database
      let { data: items } = await db.from('connector_items').select('*').eq('connector_id', id).eq('tenant_id', tenantId);

      // Auto-populate if none exist yet
      if (!items || items.length === 0) {
        const adapter = ConnectorFactory.create(connector.type, connector.configuration, connector.is_demo);
        const discovered = await adapter.listItems('ALL');
        const rows = discovered.map((item) => ({
          id: crypto.randomUUID(),
          connector_id: id,
          tenant_id: tenantId,
          external_id: item.external_id,
          parent_id: item.parent_id,
          item_type: item.item_type,
          name: item.name,
          path: item.path,
          source_type: item.source_type,
          mime_type: item.mime_type || '',
          metadata: { ...item.metadata, content: item.content || '' },
          is_selected: false,
          sync_status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          await db.from('connector_items').insert(rows);
          items = rows;
        }
      }

      // Load tenant users, groups, and access rules to enrich items
      const { data: allUsers } = await db.from('users').select('id, name, email').eq('tenant_id', tenantId);
      const { data: allGroups } = await db.from('groups').select('id, name').eq('tenant_id', tenantId);
      const { data: allRules } = await db.from('connector_access_rules').select('*').eq('tenant_id', tenantId);

      const userMap = Object.fromEntries((allUsers || []).map((u) => [u.id, u.name]));
      const groupMap = Object.fromEntries((allGroups || []).map((g) => [g.id, g.name]));

      // Create item map by external_id
      const itemByExtId = {};
      const itemById = {};
      for (const it of (items || [])) {
        itemByExtId[it.external_id] = it;
        itemById[it.id] = it;
      }

      // Helper to compute inherited rules walking up ancestor chain
      const resolveItemAccess = (item) => {
        const directRules = (allRules || []).filter((r) => r.connector_item_id === item.id);
        const directUsers = directRules.filter((r) => r.subject_type === 'USER').map((r) => ({ id: r.subject_id, name: userMap[r.subject_id] || 'Unknown User' }));
        const directGroups = directRules.filter((r) => r.subject_type === 'GROUP').map((r) => ({ id: r.subject_id, name: groupMap[r.subject_id] || 'Unknown Group' }));

        const inherited = [];
        let currParentExt = item.parent_id;
        while (currParentExt) {
          const parentItem = itemByExtId[currParentExt];
          if (!parentItem) break;

          const parentRules = (allRules || []).filter((r) => r.connector_item_id === parentItem.id);
          const pGroups = parentRules.filter((r) => r.subject_type === 'GROUP').map((r) => ({ id: r.subject_id, name: groupMap[r.subject_id] || 'Unknown Group' }));
          const pUsers = parentRules.filter((r) => r.subject_type === 'USER').map((r) => ({ id: r.subject_id, name: userMap[r.subject_id] || 'Unknown User' }));

          if (pGroups.length > 0 || pUsers.length > 0) {
            inherited.push({
              folderName: parentItem.name,
              folderPath: parentItem.path,
              groups: pGroups,
              users: pUsers,
            });
          }

          currParentExt = parentItem.parent_id;
        }

        return { directUsers, directGroups, inherited };
      };

      const enrichedItems = (items || []).map((item) => {
        const { directUsers, directGroups, inherited } = resolveItemAccess(item);
        return {
          ...item,
          access: {
            directUsers,
            directGroups,
            inherited,
          },
        };
      });

      return res.json({
        success: true,
        connector: ConnectorController.sanitizeConnector(connector),
        items: enrichedItems,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/:id/items/:itemId
   */
  static async getItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: item } = await db.from('connector_items').select('*').eq('id', itemId).eq('connector_id', id).eq('tenant_id', tenantId).single();
      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found.' });
      }

      return res.json({ success: true, item });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/select
   * Select or deselect files/folders/tables to add to CompanyBrain
   */
  static async selectItems(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;
      const { itemIds = [], isSelected = true } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ success: false, error: 'itemIds array is required.' });
      }

      // Fetch all items for this connector to support cascading selection for folders
      const { data: allItems } = await db.from('connector_items').select('*').eq('connector_id', id).eq('tenant_id', tenantId);

      const targetIds = new Set(itemIds);

      // Cascade selection down to children of selected folders
      const expandChildren = (parentExtId) => {
        for (const item of (allItems || [])) {
          if (item.parent_id === parentExtId) {
            targetIds.add(item.id);
            if (item.item_type === 'folder' || item.item_type === 'schema') {
              expandChildren(item.external_id);
            }
          }
        }
      };

      for (const item of (allItems || [])) {
        if (targetIds.has(item.id) && (item.item_type === 'folder' || item.item_type === 'schema')) {
          expandChildren(item.external_id);
        }
      }

      const affectedIds = Array.from(targetIds);
      for (const itemId of affectedIds) {
        await db.from('connector_items').update({
          is_selected: Boolean(isSelected),
          updated_at: new Date().toISOString(),
        }).eq('id', itemId);
      }

      return res.json({
        success: true,
        affectedCount: affectedIds.length,
        message: `${affectedIds.length} item(s) ${isSelected ? 'added to' : 'removed from'} CompanyBrain knowledge selection.`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/connectors/:id/items/:itemId/access
   * Retrieve direct and inherited access rules, plus tenant user and group options
   */
  static async getItemAccess(req, res) {
    try {
      const { id, itemId } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: item } = await db.from('connector_items').select('*').eq('id', itemId).eq('tenant_id', tenantId).single();
      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found.' });
      }

      // Available users and groups for this tenant
      const { data: users } = await db.from('users').select('id, name, email, department').eq('tenant_id', tenantId);
      const { data: groups } = await db.from('groups').select('id, name, description').eq('tenant_id', tenantId);

      // Direct access rules
      const { data: directRules } = await db.from('connector_access_rules').select('*').eq('connector_item_id', itemId).eq('tenant_id', tenantId);

      // Ancestor items for folder inheritance
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
   * Save user and group level access rules for item with folder inheritance
   */
  static async saveItemAccess(req, res) {
    try {
      const { id, itemId } = req.params;
      const tenantId = req.user.tenant_id;
      const { userIds = [], groupIds = [] } = req.body;

      const { data: item } = await db.from('connector_items').select('*').eq('id', itemId).eq('tenant_id', tenantId).single();
      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found.' });
      }

      // Existing direct rules
      const { data: existingRules } = await db.from('connector_access_rules').select('*').eq('connector_item_id', itemId).eq('tenant_id', tenantId);

      const existingUserIds = (existingRules || []).filter((r) => r.subject_type === 'USER').map((r) => r.subject_id);
      const existingGroupIds = (existingRules || []).filter((r) => r.subject_type === 'GROUP').map((r) => r.subject_id);

      // Remove existing rules for this item
      await db.from('connector_access_rules').delete().eq('connector_item_id', itemId);

      // Insert new rules
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

      // Audit logs for newly granted and revoked
      const addedUsers = userIds.filter((u) => !existingUserIds.includes(u));
      const removedUsers = existingUserIds.filter((u) => !userIds.includes(u));
      const addedGroups = groupIds.filter((g) => !existingGroupIds.includes(g));
      const removedGroups = existingGroupIds.filter((g) => !groupIds.includes(g));

      if (addedUsers.length > 0 || addedGroups.length > 0) {
        await AuditService.logEvent({
          tenant_id: tenantId,
          user_id: req.user.id,
          user_name: req.user.name,
          action: 'ACCESS_GRANTED',
          resource_type: 'CONNECTOR_ITEM',
          resource_id: item.name,
          decision: 'SUCCESS',
          reason: `Granted access to [${item.name}]: ${addedUsers.length} user(s), ${addedGroups.length} group(s).`,
          metadata: { itemId, addedUsers, addedGroups },
        });
      }

      if (removedUsers.length > 0 || removedGroups.length > 0) {
        await AuditService.logEvent({
          tenant_id: tenantId,
          user_id: req.user.id,
          user_name: req.user.name,
          action: 'ACCESS_REVOKED',
          resource_type: 'CONNECTOR_ITEM',
          resource_id: item.name,
          decision: 'SUCCESS',
          reason: `Revoked access from [${item.name}]: ${removedUsers.length} user(s), ${removedGroups.length} group(s).`,
          metadata: { itemId, removedUsers, removedGroups },
        });
      }

      return res.json({
        success: true,
        message: `Access rules updated for [${item.name}].`,
        savedRulesCount: newRules.length,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/connectors/:id/items/:itemId/access/:accessId
   */
  static async removeItemAccess(req, res) {
    try {
      const { id, itemId, accessId } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: rule } = await db.from('connector_access_rules').select('*').eq('id', accessId).eq('tenant_id', tenantId).single();
      if (!rule) {
        return res.status(404).json({ success: false, error: 'Access rule not found.' });
      }

      await db.from('connector_access_rules').delete().eq('id', accessId);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'ACCESS_REVOKED',
        resource_type: 'CONNECTOR_ITEM',
        resource_id: itemId,
        decision: 'SUCCESS',
        reason: `Removed individual access rule [${accessId}] on item [${itemId}].`,
        metadata: { accessId, subjectId: rule.subject_id, subjectType: rule.subject_type },
      });

      return res.json({ success: true, message: 'Access rule revoked.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/connectors/:id/sync
   * Perform synchronized knowledge ingestion into database documents
   */
  static async sync(req, res) {
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

      // 1. Audit Log: CONNECTOR_SYNC_STARTED
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_SYNC_STARTED',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'INFO',
        reason: `Initiated knowledge synchronization for [${connector.name}].`,
        metadata: { connectorId: id, type: connector.type },
      });

      // Update state to SYNCING
      await db.from('connectors').update({
        status: 'SYNCING',
        sync_status: 'SYNCING',
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      // 2. Fetch all items for this connector and tenant
      const { data: allItems } = await db.from('connector_items').select('*').eq('connector_id', id).eq('tenant_id', tenantId);

      // Selected items (files or tables)
      const selectedItems = (allItems || []).filter((item) =>
        item.is_selected && (item.item_type === 'file' || item.item_type === 'table')
      );

      // 3. Load all access rules for inheritance resolution
      const { data: allRules } = await db.from('connector_access_rules').select('*').eq('tenant_id', tenantId);
      const itemByExtId = Object.fromEntries((allItems || []).map((it) => [it.external_id, it]));

      let indexedCount = 0;

      for (const item of selectedItems) {
        // Resolve direct rules
        const directRules = (allRules || []).filter((r) => r.connector_item_id === item.id);
        const effectiveGroupIds = new Set(directRules.filter((r) => r.subject_type === 'GROUP').map((r) => r.subject_id));
        const effectiveUserIds = new Set(directRules.filter((r) => r.subject_type === 'USER').map((r) => r.subject_id));

        // Walk up ancestor folder chain to inherit group/user permissions
        let parentExt = item.parent_id;
        while (parentExt) {
          const parent = itemByExtId[parentExt];
          if (!parent) break;

          const pRules = (allRules || []).filter((r) => r.connector_item_id === parent.id);
          for (const pr of pRules) {
            if (pr.subject_type === 'GROUP') effectiveGroupIds.add(pr.subject_id);
            if (pr.subject_type === 'USER') effectiveUserIds.add(pr.subject_id);
          }
          parentExt = parent.parent_id;
        }

        // If no explicit group assigned, check if department matches a default group
        if (effectiveGroupIds.size === 0 && item.metadata?.department) {
          const { data: matchedGroup } = await db.from('groups').select('id').eq('tenant_id', tenantId).ilike('name', `%${item.metadata.department}%`).single();
          if (matchedGroup) {
            effectiveGroupIds.add(matchedGroup.id);
          }
        }

        const requiredGroupsArray = Array.from(effectiveGroupIds);
        const allowedUsersArray = Array.from(effectiveUserIds);

        const content = item.metadata?.content || `Knowledge document: ${item.name} (${item.path})`;
        const docExternalId = `conn-${connector.type}-${item.external_id}`;

        // Upsert into documents table
        const { data: existingDoc } = await db.from('documents').select('id').eq('tenant_id', tenantId).eq('external_id', docExternalId).single();

        let docId = existingDoc?.id;
        if (docId) {
          await db.from('documents').update({
            title: item.name,
            content,
            source_type: connector.type,
            source_url: `https://${connector.type}.internal${item.path}`,
            department: item.metadata?.department || 'Engineering',
            project: item.metadata?.project || 'Core',
            classification: item.metadata?.classification || 'INTERNAL',
            required_groups: requiredGroupsArray,
            metadata: {
              ...item.metadata,
              allowed_user_ids: allowedUsersArray,
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
            content,
            source_type: connector.type,
            source_url: `https://${connector.type}.internal${item.path}`,
            department: item.metadata?.department || 'Engineering',
            project: item.metadata?.project || 'Core',
            classification: item.metadata?.classification || 'INTERNAL',
            owner: req.user.email,
            version: '1.0',
            required_groups: requiredGroupsArray,
            metadata: {
              ...item.metadata,
              allowed_user_ids: allowedUsersArray,
              connector_id: id,
              connector_item_id: item.id,
              last_synced: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Insert document permissions for group-based gate
        for (const grpId of requiredGroupsArray) {
          await db.from('document_permissions').insert({
            id: crypto.randomUUID(),
            document_id: docId,
            group_id: grpId,
            access_type: 'READ',
            created_at: new Date().toISOString(),
          });
        }

        // Update item sync_status in connector_items
        await db.from('connector_items').update({
          sync_status: 'SYNCED',
          updated_at: new Date().toISOString(),
        }).eq('id', item.id);

        indexedCount++;
      }

      const syncTimestamp = new Date().toISOString();
      await db.from('connectors').update({
        status: 'CONNECTED',
        sync_status: 'SYNCED',
        last_sync_at: syncTimestamp,
        document_count: indexedCount,
        updated_at: syncTimestamp,
      }).eq('id', id);

      // Audit Log: CONNECTOR_SYNC_COMPLETED
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'CONNECTOR_SYNC_COMPLETED',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'SUCCESS',
        reason: `Successfully synchronized ${indexedCount} knowledge item(s) from [${connector.name}].`,
        metadata: { connectorId: id, indexedCount, syncTimestamp },
      });

      return res.json({
        success: true,
        indexedCount,
        last_sync_at: syncTimestamp,
        message: `Synchronization completed: ${indexedCount} item(s) indexed into CompanyBrain knowledge base.`,
      });
    } catch (err) {
      console.error('Connector sync error:', err);
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
        reason: `Synchronization failed: ${err.message}`,
        metadata: { error: err.message },
      });

      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
