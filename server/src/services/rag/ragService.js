import { db } from '../../database/db.js';
import { PolicyEngine } from '../policy/policyEngine.js';
import { aiService } from '../ai/aiService.js';
import { ResponseGuard } from './responseGuard.js';
import { AuditService } from '../audit/auditService.js';

const STOPWORDS = new Set([
  'what', 'is', 'the', 'of', 'in', 'and', 'to', 'a', 'an', 'show', 'me', 'tell', 'about',
  'how', 'does', 'for', 'on', 'with', 'at', 'by', 'from', 'this', 'that', 'are', 'was',
  'were', 'information', 'details', 'give', 'list', 'can', 'you', 'please', 'core', 'system',
]);

export class RAGService {
  /**
   * Execute permission-aware RAG pipeline
   *
   * @param {Object} params
   * @param {Object} params.user - Authenticated user with role and access groups
   * @param {string} params.query - User question
   * @param {string} params.tenant_id - Active tenant ID (verified against user permissions)
   */
  static async executeQuery({ user, query, tenant_id }) {
    const startTime = Date.now();

    if (!user) {
      throw new Error('Unauthorized: Authentication required to access enterprise knowledge.');
    }

    // 1. TENANT VERIFICATION
    const effectiveTenantId = user.role_name === 'Super Admin' ? (tenant_id || user.tenant_id) : user.tenant_id;

    if (tenant_id && tenant_id !== user.tenant_id && user.role_name !== 'Super Admin') {
      await AuditService.logEvent({
        tenant_id: user.tenant_id,
        user_id: user.id,
        user_name: user.name,
        action: 'RAG_QUERY',
        resource_type: 'TENANT_BOUNDARY',
        resource_id: tenant_id,
        decision: 'DENY',
        reason: `Tenant isolation violation: User belonging to tenant [${user.tenant_id}] attempted to query tenant [${tenant_id}].`,
        metadata: { query, requestedTenantId: tenant_id },
      });

      return {
        success: false,
        error: 'Forbidden: You do not have authorization to query documents from this company tenant.',
        answer: 'Access denied: Cross-company data retrieval is strictly prohibited by CompanyBrain Tenant Isolation.',
        sources: [],
        decision: 'DENY',
      };
    }

    // 2. CANDIDATE RETRIEVAL (STRICTLY WITHIN TENANT)
    const { data: tenantDocs } = await db.from('documents').select('*').eq('tenant_id', effectiveTenantId);
    const documents = tenantDocs || [];

    // Meaningful query keywords (filtering out stopwords)
    const qWords = query
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

    // Calculate score
    const scoredDocs = documents.map((doc) => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      const deptLower = (doc.department || '').toLowerCase();
      const projLower = (doc.project || '').toLowerCase();

      for (const word of qWords) {
        if (titleLower.includes(word)) {
          score += word === 'project' ? 2 : 12; // De-weight generic 'project' word
        }
        if (projLower.includes(word)) {
          score += word === 'project' ? 2 : 10;
        }
        if (deptLower.includes(word)) score += 5;
        if (contentLower.includes(word)) score += 2;
      }

      return { ...doc, relevanceScore: score };
    });

    // Meaningful threshold (must have distinct relevance)
    const MIN_RELEVANCE = qWords.length > 1 ? 8 : 4;
    const relevantCandidates = scoredDocs
      .filter((d) => d.relevanceScore >= MIN_RELEVANCE)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // If zero relevant documents match in this tenant
    if (relevantCandidates.length === 0) {
      return {
        success: true,
        answer: `I couldn't find any authorized information in your company's knowledge base regarding "${query}".`,
        sources: [],
        decision: 'ALLOW',
        securityIndicators: {
          tenantIsolation: 'Active (Enforced)',
          policyEngine: 'Evaluated (0 matches in tenant)',
          authorizedSourcesCount: 0,
          deniedSourcesCount: 0,
          llmBoundaryUsed: false,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }

    // 3. POLICY ENGINE FILTERING (BEFORE RAG CONTEXT ASSEMBLY)
    const { authorized, denied } = PolicyEngine.filterAuthorizedDocuments(user, relevantCandidates);

    // Check if the top relevant document is denied (e.g. Salary, Confidential HR)
    const highestScoredDoc = relevantCandidates[0];
    const isTopDocDenied = denied.some((d) => d.id === highestScoredDoc.id);

    // If top match is denied OR all relevant matches are denied:
    if (authorized.length === 0 || (isTopDocDenied && highestScoredDoc.relevanceScore > 10)) {
      const topDenied = denied[0] || highestScoredDoc;
      const denyReason = topDenied.accessEvaluation?.reason ||
        `User lacks required access group to view [${topDenied.title}].`;

      await AuditService.logEvent({
        tenant_id: effectiveTenantId,
        user_id: user.id,
        user_name: user.name,
        action: 'RAG_QUERY',
        resource_type: 'KNOWLEDGE_SEARCH',
        resource_id: topDenied.id,
        decision: 'DENY',
        reason: denyReason,
        metadata: {
          query,
          attempted_document: topDenied.title,
          attempted_classification: topDenied.classification,
          required_groups: topDenied.required_groups,
          user_groups: user.access_groups,
        },
      });

      return {
        success: true,
        answer: `Access Denied: ${denyReason}\n\nCompanyBrain security policy prevents unauthorized retrieval of confidential company data. Your access attempt has been logged for enterprise compliance.`,
        sources: [],
        decision: 'DENY',
        securityIndicators: {
          tenantIsolation: 'Active (Enforced)',
          policyEngine: 'BLOCKED by Policy Engine',
          authorizedSourcesCount: 0,
          deniedSourcesCount: denied.length,
          llmBoundaryUsed: false,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }

    // 4. AUTHORIZED CONTEXT ASSEMBLY (Pass ONLY authorized docs to external AI)
    const finalContextDocs = authorized.slice(0, 4);

    // Call AI Service
    const aiResponse = await aiService.queryRAG({
      query,
      authorizedDocuments: finalContextDocs,
      userContext: {
        name: user.name,
        department: user.department,
        role_name: user.role_name,
        tenant_id: effectiveTenantId,
      },
    });

    // Run Response Guard
    const guarded = ResponseGuard.validateResponse({
      answer: aiResponse.answer,
      authorizedDocuments: finalContextDocs,
      sourcesUsed: aiResponse.sourcesUsed,
      deniedDocuments: denied,
    });

    // Record Audit Log
    const auditRecord = await AuditService.logEvent({
      tenant_id: effectiveTenantId,
      user_id: user.id,
      user_name: user.name,
      action: 'RAG_QUERY',
      resource_type: 'KNOWLEDGE_SEARCH',
      resource_id: finalContextDocs.map((d) => d.id).join(','),
      decision: 'ALLOW',
      reason: `Authorized query executed using ${finalContextDocs.length} approved document(s).`,
      metadata: {
        query,
        documents_accessed: finalContextDocs.length,
        document_titles: finalContextDocs.map((d) => d.title),
        model: aiResponse.modelUsed,
        tokens: aiResponse.tokens,
      },
    });

    // Save RAG query record
    try {
      await db.from('rag_queries').insert({
        tenant_id: effectiveTenantId,
        user_id: user.id,
        query,
        answer: guarded.sanitizedAnswer,
        sources: guarded.sources,
        security_eval: {
          decision: 'ALLOW',
          authorized_count: finalContextDocs.length,
          model: aiResponse.modelUsed,
        },
      });
    } catch (err) {
      console.error('Error saving rag_queries:', err);
    }

    return {
      success: true,
      answer: guarded.sanitizedAnswer,
      sources: guarded.sources,
      decision: 'ALLOW',
      auditId: auditRecord?.id,
      securityIndicators: {
        tenantIsolation: 'Active (Enforced)',
        policyEngine: 'ALLOW (Pre-Retrieved)',
        authorizedSourcesCount: finalContextDocs.length,
        deniedSourcesCount: denied.length,
        llmBoundaryUsed: false,
        modelUsed: aiResponse.modelUsed,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }
}
