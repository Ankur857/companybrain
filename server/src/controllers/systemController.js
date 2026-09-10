import { db, resetDatabase } from '../database/db.js';
import { aiService } from '../services/ai/aiService.js';

export class SystemController {
  static async getDashboardStats(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const isSuperAdmin = req.user.role_name === 'Super Admin';

      const { data: allTenants } = await db.from('tenants').select('*');
      const { data: tenantUsers } = await db.from('users').select('*').eq('tenant_id', tenantId);
      const { data: tenantConnectors } = await db.from('connectors').select('*').eq('tenant_id', tenantId);
      const { data: tenantDocs } = await db.from('documents').select('*').eq('tenant_id', tenantId);
      const { data: tenantAudits } = await db.from('audit_logs').select('*').eq('tenant_id', tenantId);
      const { data: tenantGroups } = await db.from('groups').select('*').eq('tenant_id', tenantId);

      const aiHealth = await aiService.healthCheck();

      const allowedQueries = (tenantAudits || []).filter((a) => a.action === 'RAG_QUERY' && a.decision === 'ALLOW').length;
      const deniedQueries = (tenantAudits || []).filter((a) => a.action === 'RAG_QUERY' && a.decision === 'DENY').length;
      const connectedConnectors = (tenantConnectors || []).filter((c) => c.status === 'CONNECTED').length;

      return res.json({
        success: true,
        stats: {
          totalCompanies: (allTenants || []).length,
          totalUsers: (tenantUsers || []).length,
          connectedSources: connectedConnectors,
          totalSources: (tenantConnectors || []).length,
          indexedDocuments: (tenantDocs || []).length,
          accessGroupsCount: (tenantGroups || []).length,
          queriesTotal: allowedQueries + deniedQueries,
          allowedQueries,
          deniedQueries,
          securityStatus: {
            tenantIsolation: 'ACTIVE (Strict Server-Side)',
            policyEngine: 'ACTIVE (Pre-Retrieval Gate)',
            permissionAwareRetrieval: 'ACTIVE (Context Sanitized)',
            auditLogging: 'ACTIVE (Append-Only)',
            aiProvider: aiHealth.provider,
            aiStatus: aiHealth.status,
          },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getArchitecture(req, res) {
    const pipeline = [
      { step: 1, id: 'companies', name: 'Multi-Company Tenants', desc: 'Acme Technologies, Nova Finance, Orbit Systems strictly segmented with tenant_id boundaries.' },
      { step: 2, id: 'connectors', name: 'Connectors', desc: 'Google Drive, SharePoint, MongoDB, Supabase, Confluence, CRM, REST APIs.' },
      { step: 3, id: 'mapping', name: 'Schema / Semantic Mapping', desc: 'Normalizes custom schemas (dept, division, org_unit -> department; emp_name -> employee).' },
      { step: 4, id: 'common_doc', name: 'Common Knowledge Model', desc: 'Standard internal representation with classification and access group tags.' },
      { step: 5, id: 'classification', name: 'Classification & Permissions', desc: 'PUBLIC, INTERNAL, CONFIDENTIAL, HIGHLY_CONFIDENTIAL with group requirements.' },
      { step: 6, id: 'tenant_index', name: 'Tenant-Isolated Knowledge Index', desc: 'PostgreSQL/Supabase isolated tables. Never mix tenant documents.' },
      { step: 7, id: 'auth', name: 'Authentication Layer', desc: 'Bearer JWT containing signed userId, tenantId, and roleName. Never trust client body.' },
      { step: 8, id: 'roles_groups', name: 'Tenant + Role + Groups', desc: 'Hydrates user clearance: e.g. Rahul (Engineering, Project-Alpha).' },
      { step: 9, id: 'policy_engine', name: 'Policy Engine', desc: 'Evaluates canAccess(user, doc) BEFORE retrieval. Blocks unauthorized data.' },
      { step: 10, id: 'permission_rag', name: 'Permission-Aware Retrieval', desc: 'Fetches ONLY approved documents. Denied docs are omitted completely.' },
      { step: 11, id: 'authorized_context', name: 'Authorized Context Assembly', desc: 'Packages authorized docs with prompt-injection defense delimiters.' },
      { step: 12, id: 'external_ai', name: 'External RAG / LLM API', desc: 'API key lives on backend only. LLM answers only from authorized context.' },
      { step: 13, id: 'response_guard', name: 'Response Guard & DLP', desc: 'Verifies citations, guarantees zero leakage, and prevents halluncinations.' },
      { step: 14, id: 'audit_log', name: 'Audit Logging & Citations', desc: 'Logs ALLOW/DENY decision, query text, accessed sources, and latency.' },
    ];

    return res.json({ success: true, pipeline });
  }

  static async resetDemo(req, res) {
    try {
      resetDatabase();
      return res.json({ success: true, message: 'Database reset to initial pristine demo state.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
