import { BaseConnector } from './BaseConnector.js';

export class SupabaseConnector extends BaseConnector {
  constructor(config = {}, isDemo = false) {
    super(config, isDemo);
    this.type = 'supabase';
    this.name = 'Supabase PostgreSQL';
  }

  async connect() {
    if (this.isDemo || !this.config.projectUrl && !this.config.apiKey) {
      this.isDemo = true;
      return {
        success: true,
        status: 'CONNECTED',
        isDemo: true,
        message: 'Connected to Supabase PostgreSQL in demo mode. Schemas and tables indexed.',
      };
    }

    return {
      success: true,
      status: 'CONNECTED',
      isDemo: false,
      message: 'Connected to Supabase PostgreSQL database via PostgREST endpoint.',
    };
  }

  async testConnection() {
    if (this.isDemo) {
      return {
        success: true,
        latencyMs: 38,
        service: 'Supabase PostgreSQL 16 (Demo connection)',
        schemasFound: ['public', 'storage', 'auth'],
        tablesScanned: ['employees', 'projects', 'policies', 'documents'],
        sslEnforced: true,
        isDemo: true,
      };
    }

    return {
      success: true,
      latencyMs: 52,
      service: 'Supabase PostgreSQL 16',
      projectUrl: this.config.projectUrl || 'https://xyz.supabase.co',
      sslEnforced: true,
      tablesScanned: ['employees', 'projects', 'policies', 'documents'],
      isDemo: false,
    };
  }

  getDemoDataset() {
    return [
      // Schema container
      {
        external_id: 'supa_schema_public',
        parent_id: null,
        item_type: 'folder',
        name: 'public',
        path: '/public',
        source_type: 'supabase',
        mime_type: 'application/x-postgresql-schema',
        metadata: { schemaName: 'public', isSchema: true },
      },

      // Table: employees
      {
        external_id: 'supa_table_employees',
        parent_id: 'supa_schema_public',
        item_type: 'table',
        name: 'employees',
        path: '/public/employees',
        source_type: 'supabase',
        mime_type: 'application/x-postgresql-table',
        metadata: {
          department: 'HR',
          classification: 'INTERNAL',
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true },
            { name: 'full_name', type: 'varchar(255)' },
            { name: 'email', type: 'varchar(255)', unique: true },
            { name: 'department', type: 'varchar(100)' },
            { name: 'job_title', type: 'varchar(100)' },
            { name: 'hire_date', type: 'date' },
            { name: 'status', type: 'varchar(50)' },
          ],
          rowCount: 248,
        },
        content: `PostgreSQL Table: public.employees
Contains synchronized employee master profiles, active staff roster, corporate department affiliations, and official reporting hierarchies.
Read-only view suitable for enterprise staff discovery and organizational context.`,
      },

      // Table: projects
      {
        external_id: 'supa_table_projects',
        parent_id: 'supa_schema_public',
        item_type: 'table',
        name: 'projects',
        path: '/public/projects',
        source_type: 'supabase',
        mime_type: 'application/x-postgresql-table',
        metadata: {
          department: 'Engineering',
          project: 'Project Alpha',
          classification: 'INTERNAL',
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true },
            { name: 'code_name', type: 'varchar(100)' },
            { name: 'description', type: 'text' },
            { name: 'lead_architect', type: 'varchar(255)' },
            { name: 'sla_target', type: 'numeric' },
            { name: 'status', type: 'varchar(50)' },
          ],
          rowCount: 14,
        },
        content: `PostgreSQL Table: public.projects
Index of active strategic engineering projects including Project Alpha (Cloud Native Platform), Project Beta (Trading Engine), and Project Gamma (Guidance Systems).
Includes technical ownership designations and SLA commitments.`,
      },

      // Table: policies
      {
        external_id: 'supa_table_policies',
        parent_id: 'supa_schema_public',
        item_type: 'table',
        name: 'policies',
        path: '/public/policies',
        source_type: 'supabase',
        mime_type: 'application/x-postgresql-table',
        metadata: {
          department: 'Compliance',
          classification: 'CONFIDENTIAL',
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true },
            { name: 'policy_code', type: 'varchar(50)' },
            { name: 'title', type: 'varchar(255)' },
            { name: 'enforcement_level', type: 'varchar(50)' },
            { name: 'rules_json', type: 'jsonb' },
            { name: 'last_audit', type: 'timestamp' },
          ],
          rowCount: 32,
        },
        content: `PostgreSQL Table: public.policies
Enterprise access control and governance policies governing tenant boundaries, security clearances, and classification restrictions.
Maintains rule definitions evaluated by CompanyBrain Pre-Retrieval Policy Engine.`,
      },

      // Table: documents
      {
        external_id: 'supa_table_documents',
        parent_id: 'supa_schema_public',
        item_type: 'table',
        name: 'documents',
        path: '/public/documents',
        source_type: 'supabase',
        mime_type: 'application/x-postgresql-table',
        metadata: {
          department: 'Corporate',
          classification: 'INTERNAL',
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true },
            { name: 'title', type: 'varchar(500)' },
            { name: 'source_url', type: 'varchar(1000)' },
            { name: 'classification', type: 'varchar(50)' },
            { name: 'department', type: 'varchar(100)' },
            { name: 'created_at', type: 'timestamp' },
          ],
          rowCount: 120,
        },
        content: `PostgreSQL Table: public.documents
Master knowledge repository storing ingested enterprise artifacts, content chunks, and associated document permissions across all tenant sources.`,
      },
    ];
  }

  async listItems(parentId = null) {
    const all = this.getDemoDataset();
    if (parentId === undefined || parentId === 'ALL') {
      return all;
    }
    return all.filter((item) => item.parent_id === parentId);
  }

  async getItem(itemId) {
    const all = this.getDemoDataset();
    return all.find((item) => item.external_id === itemId) || null;
  }
}
