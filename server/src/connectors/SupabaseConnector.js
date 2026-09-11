import { BaseConnector } from './BaseConnector.js';

export class SupabaseConnector extends BaseConnector {
  constructor(config = {}, account = null, isDevelopmentMode = false) {
    super(config, account, isDevelopmentMode);
    this.type = 'supabase';
    this.name = 'Supabase';

    const creds = account?.credential_reference || {};
    this.projectUrl = this.config.projectUrl || creds.projectUrl || process.env.SUPABASE_URL;
    this.apiKey = this.config.apiKey || creds.apiKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  }

  getCleanUrl() {
    let url = (this.projectUrl || '').trim();
    url = url.replace(/\/rest\/v1\/?$/, '');
    url = url.replace(/\/$/, '');
    return url;
  }

  isConfigured() {
    return Boolean((this.projectUrl && this.apiKey) || this.isDevelopmentMode);
  }

  /**
   * Test live Supabase connectivity and verify PostgREST endpoint
   */
  async testConnection() {
    if (this.isDevelopmentMode) {
      return {
        success: true,
        latencyMs: 42,
        service: 'Supabase PostgreSQL (DEVELOPMENT MODE)',
        authenticatedAs: this.account?.account_email || 'developer@companybrain.local',
        schemasFound: ['public'],
        isDevelopmentMode: true,
      };
    }

    if (!this.projectUrl || !this.apiKey) {
      throw new Error('Supabase connection required. Missing Project URL or API Key.');
    }

    const t0 = Date.now();
    const cleanUrl = this.getCleanUrl();
    const res = await fetch(`${cleanUrl}/rest/v1/`, {
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    const latencyMs = Date.now() - t0;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const hint = err.hint ? ` (${err.hint})` : '';
      throw new Error(`Failed to connect to Supabase: ${err.message || res.statusText}${hint}`);
    }

    const openApi = await res.json();
    const tableNames = Object.keys(openApi.definitions || {});

    return {
      success: true,
      latencyMs,
      service: `Supabase PostgREST (${openApi.info?.title || 'Connected'})`,
      tablesFound: tableNames.length,
      projectUrl: cleanUrl,
    };
  }

  /**
   * List real tables and schemas from the connected Supabase instance
   */
  async listItems(folderId = null, search = '') {
    if (this.isDevelopmentMode && (!this.projectUrl || !this.apiKey)) {
      return this.getDevelopmentDataset(folderId, search);
    }

    if (!this.projectUrl || !this.apiKey) {
      throw new Error('Supabase connection required. Missing Project URL or API Key.');
    }

    const cleanUrl = this.getCleanUrl();
    const res = await fetch(`${cleanUrl}/rest/v1/`, {
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const hint = err.hint ? ` (${err.hint})` : '';
      throw new Error(`Failed to query Supabase schema: ${err.message || res.statusText}${hint}`);
    }

    const openApi = await res.json();
    const definitions = openApi.definitions || {};

    const tables = Object.entries(definitions).map(([tableName, def]) => {
      const properties = def.properties || {};
      const columns = Object.entries(properties).map(([colName, colDef]) => ({
        name: colName,
        type: colDef.type || colDef.format || 'unknown',
        description: colDef.description || '',
      }));

      return {
        id: `table_${tableName}`,
        external_id: `table_${tableName}`,
        name: tableName,
        item_type: 'table',
        mime_type: 'application/x-postgresql-table',
        path: `/public/${tableName}`,
        source_type: 'supabase',
        source_url: `${cleanUrl}/rest/v1/${tableName}`,
        parent_id: null,
        metadata: {
          columns,
          columnCount: columns.length,
          description: def.description || `PostgreSQL table: ${tableName}`,
          schemaName: 'public',
        },
      };
    });

    if (search) {
      return tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
    }

    return tables;
  }

  /**
   * Fetch read-only rows from connected Supabase table to convert into knowledge
   */
  async downloadItem(itemId, metadata = {}) {
    if (this.isDevelopmentMode) {
      return `Development mode simulated table extract for [${itemId}]. Real PostgreSQL data is ingested when live Supabase project is connected.`;
    }

    const tableName = itemId.replace('table_', '');
    const cleanUrl = this.getCleanUrl();

    const res = await fetch(`${cleanUrl}/rest/v1/${tableName}?limit=50`, {
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to read records from Supabase table [${tableName}]: ${res.statusText}`);
    }

    const rows = await res.json();
    const formatted = `DATA EXTRACT: public.${tableName} (${rows.length} records)\n` +
      `Columns: ${(metadata.columns || []).map((c) => c.name).join(', ')}\n\n` +
      JSON.stringify(rows, null, 2);

    return formatted;
  }

  getDevelopmentDataset(folderId = null, search = '') {
    const tables = [
      {
        id: 'dev_table_employees',
        external_id: 'dev_table_employees',
        name: 'employees',
        item_type: 'table',
        mime_type: 'application/x-postgresql-table',
        path: '/public/employees',
        source_type: 'supabase',
        parent_id: null,
        metadata: {
          columns: [
            { name: 'id', type: 'uuid' },
            { name: 'name', type: 'text' },
            { name: 'email', type: 'text' },
            { name: 'department', type: 'text' },
          ],
          columnCount: 4,
          isDevelopmentMode: true,
        },
      },
      {
        id: 'dev_table_projects',
        external_id: 'dev_table_projects',
        name: 'projects',
        item_type: 'table',
        mime_type: 'application/x-postgresql-table',
        path: '/public/projects',
        source_type: 'supabase',
        parent_id: null,
        metadata: {
          columns: [
            { name: 'id', type: 'uuid' },
            { name: 'title', type: 'text' },
            { name: 'status', type: 'text' },
          ],
          columnCount: 3,
          isDevelopmentMode: true,
        },
      },
    ];

    if (search) {
      return tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
    }
    return tables;
  }
}
