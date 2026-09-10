import { db } from '../database/db.js';
import { createConnector } from '../connectors/adapters.js';
import { IngestionPipeline } from '../services/ingestion/ingestionPipeline.js';
import crypto from 'crypto';

export class ConnectorController {
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: connectors } = await db.from('connectors').select('*').eq('tenant_id', tenantId);
      return res.json({ success: true, connectors: connectors || [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getTypes(req, res) {
    const types = [
      {
        type: 'google_drive',
        name: 'Google Drive Enterprise',
        category: 'Cloud Storage',
        icon: 'Folder',
        description: 'Index shared enterprise drives, PDFs, and architecture specifications.',
      },
      {
        type: 'sharepoint',
        name: 'Microsoft SharePoint / 365',
        category: 'Enterprise Intranet',
        icon: 'FileText',
        description: 'Ingest company documents, HR vaults, employee handbooks, and policy records.',
      },
      {
        type: 'mongodb',
        name: 'MongoDB Atlas',
        category: 'Database',
        icon: 'Database',
        description: 'Connect document collections, trading engines, and telemetry catalogs.',
      },
      {
        type: 'supabase',
        name: 'Supabase PostgreSQL',
        category: 'Database',
        icon: 'Layers',
        description: 'Direct SQL & table ingestion with row-level security and schema mappings.',
      },
      {
        type: 'confluence',
        name: 'Atlassian Confluence',
        category: 'Knowledge Base',
        icon: 'BookOpen',
        description: 'Index engineering spaces, architecture decision records (ADRs), and sprint wikis.',
      },
      {
        type: 'crm',
        name: 'Salesforce CRM',
        category: 'Customer Data',
        icon: 'Users',
        description: 'Synchronize institutional client portfolios, account mandates, and deal briefs.',
      },
      {
        type: 'generic_api',
        name: 'REST API Ingestion Gateway',
        category: 'Developer API',
        icon: 'Code',
        description: 'Custom HTTP webhooks and automated payload delivery pipelines.',
      },
    ];

    return res.json({ success: true, types });
  }

  static async test(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: connector } = await db.from('connectors').select('*').eq('id', id).eq('tenant_id', tenantId).single();
      if (!connector) {
        return res.status(404).json({ success: false, error: 'Connector not found in this company.' });
      }

      const adapter = createConnector(connector.type, connector.configuration);
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

  static async sync(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const syncResult = await IngestionPipeline.syncConnector({
        connectorId: id,
        tenantId,
        user: req.user,
      });

      return res.json({
        success: true,
        ...syncResult,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { type, name, configuration } = req.body;

      if (!type || !name) {
        return res.status(400).json({ success: false, error: 'Type and name are required.' });
      }

      const newConnector = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        type,
        name,
        status: 'CONNECTED',
        configuration: configuration || {},
        last_sync_at: null,
        sync_status: 'IDLE',
        document_count: 0,
        created_at: new Date().toISOString(),
      };

      await db.from('connectors').insert(newConnector);
      return res.status(201).json({ success: true, connector: newConnector });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async disconnect(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      await db.from('connectors').update({ status: 'DISCONNECTED', sync_status: 'IDLE' }).eq('id', id).eq('tenant_id', tenantId);
      return res.json({ success: true, message: 'Connector disconnected.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
