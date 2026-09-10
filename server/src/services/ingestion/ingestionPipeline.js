import { db } from '../../database/db.js';
import { createConnector } from '../../connectors/adapters.js';
import { AuditService } from '../audit/auditService.js';
import crypto from 'crypto';

export class IngestionPipeline {
  /**
   * Apply semantic mapping layer to normalize diverse source schema fields into standard representation
   */
  static applySemanticMapping(rawMetadata = {}, tenantMappings = []) {
    const normalized = {
      department: 'General',
      project: 'Core',
      owner: 'System',
    };

    // Build lookup from tenant semantic mappings
    const fieldMap = {};
    for (const m of tenantMappings) {
      fieldMap[m.source_field.toLowerCase()] = m.target_field;
    }

    // Default canonical aliases
    const aliases = {
      dept: 'department',
      division: 'department',
      org_unit: 'department',
      team: 'department',
      emp_name: 'owner',
      staff_name: 'owner',
      full_name: 'owner',
      author: 'owner',
      project_code: 'project',
      project_name: 'project',
      initiative: 'project',
    };

    for (const [key, val] of Object.entries(rawMetadata)) {
      const lowerKey = key.toLowerCase();
      const targetField = fieldMap[lowerKey] || aliases[lowerKey] || lowerKey;
      normalized[targetField] = val;
    }

    return normalized;
  }

  /**
   * Simple chunking strategy for long documents
   */
  static chunkDocument(content, chunkSize = 800) {
    if (!content || content.length <= chunkSize) {
      return [content];
    }

    const chunks = [];
    let start = 0;
    while (start < content.length) {
      let end = start + chunkSize;
      if (end < content.length) {
        // Find nearest newline or space
        const lastSpace = content.lastIndexOf(' ', end);
        if (lastSpace > start + chunkSize * 0.7) {
          end = lastSpace;
        }
      }
      chunks.push(content.slice(start, end).trim());
      start = end + 1;
    }

    return chunks;
  }

  /**
   * Sync a connector: fetch documents, apply semantic mapping, chunk, and index into database
   */
  static async syncConnector({ connectorId, tenantId, user }) {
    // 1. Fetch connector record
    const { data: connector } = await db.from('connectors').select('*').eq('id', connectorId).single();
    if (!connector) {
      throw new Error(`Connector [${connectorId}] not found.`);
    }

    // 2. Tenant validation
    if (connector.tenant_id !== tenantId && user.role_name !== 'Super Admin') {
      throw new Error('Tenant isolation violation: Connector does not belong to this tenant.');
    }

    // Update connector status to SYNCING
    await db.from('connectors').update({ status: 'SYNCING', sync_status: 'SYNCING' }).eq('id', connectorId);

    try {
      // 3. Load tenant semantic mappings
      const { data: mappings } = await db.from('semantic_mappings').select('*').eq('tenant_id', tenantId);

      // 4. Create adapter & fetch documents
      const adapter = createConnector(connector.type, connector.configuration);
      const rawDocs = await adapter.fetchDocuments();

      let indexedCount = 0;

      // 5. Ingest each raw document
      for (const raw of rawDocs) {
        const normalized = this.applySemanticMapping(raw.raw_metadata || {}, mappings || []);

        // Resolve required groups based on project or department
        let requiredGroups = [];
        if (normalized.project && normalized.project.toLowerCase().includes('alpha')) {
          const { data: grp } = await db.from('groups').select('id').eq('tenant_id', tenantId).eq('name', 'Project-Alpha').single();
          if (grp) requiredGroups.push(grp.id);
        } else if (normalized.department && normalized.department.toLowerCase() === 'hr') {
          const { data: grp } = await db.from('groups').select('id').eq('tenant_id', tenantId).eq('name', 'HR').single();
          if (grp) requiredGroups.push(grp.id);
        } else if (normalized.department && normalized.department.toLowerCase() === 'engineering') {
          const { data: grp } = await db.from('groups').select('id').eq('tenant_id', tenantId).eq('name', 'Engineering').single();
          if (grp) requiredGroups.push(grp.id);
        }

        const docId = crypto.randomUUID();
        const commonDoc = {
          id: docId,
          tenant_id: tenantId,
          connector_id: connectorId,
          external_id: raw.external_id || `ext-${Date.now()}`,
          title: raw.title,
          content: raw.content,
          source_type: raw.source_type,
          source_url: raw.source_url || '',
          department: normalized.department || 'General',
          project: normalized.project || 'Core',
          classification: raw.classification || 'INTERNAL',
          owner: normalized.owner || user.email || 'Admin',
          version: '1.0',
          metadata: { ...raw.raw_metadata, semanticMapped: true, indexedBy: user.email },
          required_groups: requiredGroups,
        };

        // Insert document into knowledge base
        await db.from('documents').insert(commonDoc);

        // Store chunks for future vector search
        const chunks = this.chunkDocument(raw.content);
        for (let i = 0; i < chunks.length; i++) {
          await db.from('document_chunks').insert({
            document_id: docId,
            chunk_index: i,
            content: chunks[i],
            metadata: { title: raw.title, classification: commonDoc.classification },
          });
        }

        indexedCount++;
      }

      // Update connector to SYNCED
      await db.from('connectors').update({
        status: 'CONNECTED',
        sync_status: 'SYNCED',
        last_sync_at: new Date().toISOString(),
        document_count: (connector.document_count || 0) + indexedCount,
      }).eq('id', connectorId);

      // Record audit event
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: user.id,
        user_name: user.name,
        action: 'CONNECTOR_SYNC',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'SUCCESS',
        reason: `Successfully indexed ${indexedCount} document(s) from connector [${connector.name}].`,
        metadata: { connectorType: connector.type, indexedCount },
      });

      return {
        success: true,
        indexedCount,
        message: `Indexed ${indexedCount} new document(s) from ${connector.name}.`,
      };
    } catch (err) {
      console.error('Error during connector sync:', err);
      await db.from('connectors').update({ status: 'ERROR', sync_status: 'ERROR' }).eq('id', connectorId);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: user.id,
        user_name: user.name,
        action: 'CONNECTOR_SYNC',
        resource_type: 'CONNECTOR',
        resource_id: connector.name,
        decision: 'FAILED',
        reason: `Sync failed: ${err.message}`,
        metadata: { connectorType: connector.type, error: err.message },
      });

      throw err;
    }
  }
}
