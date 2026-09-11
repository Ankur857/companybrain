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

  /**
   * Execute Project-Scoped, Permission-Aware Intelligence Query
   * Strictly enforces:
   * Level 1: User must be a member of the project (directly or through assigned access group)
   * Level 2: Pre-RAG document policy clearance on attached project knowledge
   */
  static async executeProjectQuery({ user, project_id, query = '', action_type = 'chat' }) {
    const startTime = Date.now();

    if (!user) {
      throw new Error('Unauthorized: Authentication required.');
    }

    // 1. Fetch Project & Tenant Boundary Check
    const { data: project } = await db.from('projects').select('*').eq('id', project_id).single();
    if (!project) {
      return {
        success: false,
        error: 'Project not found.',
        answer: 'The requested project could not be found.',
        sources: [],
        decision: 'DENY',
      };
    }

    const tenantId = user.tenant_id;
    if (project.tenant_id !== tenantId && user.role_name !== 'Super Admin') {
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: user.id,
        user_name: user.name,
        action: 'PROJECT_QUERY',
        resource_type: 'PROJECT',
        resource_id: project_id,
        decision: 'DENY',
        reason: `Tenant isolation violation: User belonging to tenant [${tenantId}] attempted to query project [${project.name}] in tenant [${project.tenant_id}].`,
        metadata: { query, requestedProjectId: project_id },
      });

      return {
        success: false,
        error: 'Forbidden: Tenant isolation boundary.',
        answer: 'Access denied: You do not have authorization to query projects from this company tenant.',
        sources: [],
        decision: 'DENY',
      };
    }

    // 2. LEVEL 1: PROJECT MEMBERSHIP VERIFICATION
    let isProjectMember = ['Company Admin', 'Super Admin'].includes(user.role_name);

    if (!isProjectMember) {
      // Check direct user membership
      const { data: directMember } = await db
        .from('project_members')
        .select('*')
        .eq('project_id', project_id)
        .eq('user_id', user.id)
        .single();

      if (directMember) {
        isProjectMember = true;
      } else {
        // Check group membership
        const { data: projectGroups } = await db
          .from('project_groups')
          .select('*')
          .eq('project_id', project_id);

        const projectGroupIds = new Set((projectGroups || []).map((pg) => pg.group_id));

        // User's assigned groups
        const { data: userGroupRows } = await db
          .from('user_groups')
          .select('*')
          .eq('user_id', user.id);

        const userGroupIds = new Set((userGroupRows || []).map((ug) => ug.group_id));

        for (const gid of projectGroupIds) {
          if (userGroupIds.has(gid)) {
            isProjectMember = true;
            break;
          }
        }
      }
    }

    if (!isProjectMember) {
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: user.id,
        user_name: user.name,
        action: 'PROJECT_QUERY',
        resource_type: 'PROJECT',
        resource_id: project_id,
        decision: 'DENY',
        reason: `Access Denied: User [${user.name}] is not an authorized member of project [${project.name}].`,
        metadata: { query, project_name: project.name, action_type },
      });

      return {
        success: false,
        error: `Access Denied: You are not assigned to project "${project.name}".`,
        answer: `Access Denied: You do not have permission to access project "${project.name}". An employee can only query projects to which they have been assigned.`,
        sources: [],
        decision: 'DENY',
        securityIndicators: {
          projectAccess: 'DENIED (Not a member)',
          policyEngine: 'BLOCKED (Pre-RAG)',
          authorizedSourcesCount: 0,
        },
      };
    }

    // 3. RETRIEVE ATTACHED PROJECT KNOWLEDGE
    const { data: knowledgeRows } = await db
      .from('project_knowledge')
      .select('*')
      .eq('project_id', project_id);

    const docIds = (knowledgeRows || []).map((k) => k.document_id);

    if (docIds.length === 0) {
      return {
        success: true,
        answer: `This project doesn't have any knowledge sources yet.\n\nAn administrator must attach documents or files to **${project.name}** before project intelligence can be generated.`,
        sources: [],
        decision: 'ALLOW',
        securityIndicators: {
          projectAccess: 'GRANTED',
          policyEngine: '0 documents attached to project',
          authorizedSourcesCount: 0,
        },
      };
    }

    // Fetch candidate project documents
    const { data: projectDocs } = await db.from('documents').select('*').in('id', docIds);
    const candidateDocs = projectDocs || [];

    // 4. LEVEL 2: DOCUMENT-LEVEL SECURITY EVALUATION (BEFORE RAG)
    const { authorized, denied } = PolicyEngine.filterAuthorizedDocuments(user, candidateDocs);

    // If candidate docs exist but user lacks clearance for ALL of them:
    if (authorized.length === 0) {
      const topDenied = denied[0];
      const denyReason = topDenied?.accessEvaluation?.reason || 'User lacks required access clearance for attached project documents.';

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: user.id,
        user_name: user.name,
        action: 'PROJECT_QUERY',
        resource_type: 'DOCUMENT_SECURITY',
        resource_id: topDenied?.id || project_id,
        decision: 'DENY',
        reason: denyReason,
        metadata: { query, project_id, action_type, attempted_docs: denied.map((d) => d.title) },
      });

      return {
        success: true,
        answer: `Access Denied: ${denyReason}\n\nAlthough you have project access to ${project.name}, the attached documents require specific security clearance or access group memberships that your account does not possess.`,
        sources: [],
        decision: 'DENY',
        securityIndicators: {
          projectAccess: 'GRANTED',
          documentAccess: 'DENIED by Policy Engine',
          authorizedSourcesCount: 0,
          deniedSourcesCount: denied.length,
        },
      };
    }

    // 5. CALL AI SERVICE WITH ONLY AUTHORIZED PROJECT KNOWLEDGE
    const aiResponse = await aiService.explainProject({
      action: action_type,
      query,
      project,
      authorizedDocuments: authorized,
      userContext: {
        name: user.name,
        department: user.department,
        role_name: user.role_name,
        tenant_id: tenantId,
      },
    });

    // 6. RESPONSE GUARD VALIDATION
    const guarded = ResponseGuard.validateResponse({
      answer: aiResponse.answer,
      authorizedDocuments: authorized,
      sourcesUsed: aiResponse.sourcesUsed,
      deniedDocuments: denied,
    });

    // 7. AUDIT LOG
    const auditAction = action_type === 'summary' ? 'PROJECT_SUMMARY_GENERATED' : 'PROJECT_QUERY';
    await AuditService.logEvent({
      tenant_id: tenantId,
      user_id: user.id,
      user_name: user.name,
      action: auditAction,
      resource_type: 'PROJECT',
      resource_id: project_id,
      decision: 'ALLOW',
      reason: `Project intelligence generated for [${project.name}] using ${authorized.length} authorized document(s).`,
      metadata: {
        action_type,
        query,
        project_name: project.name,
        documents_accessed: authorized.length,
        sources_used: guarded.sources.map((s) => s.title),
        model: aiResponse.modelUsed,
      },
    });

    return {
      success: true,
      answer: guarded.sanitizedAnswer,
      sources: guarded.sources,
      decision: 'ALLOW',
      securityIndicators: {
        tenantIsolation: 'Active (Enforced)',
        projectAccess: 'VERIFIED (Member/Group)',
        policyEngine: 'ALLOW (Pre-Retrieved)',
        authorizedSourcesCount: authorized.length,
        deniedSourcesCount: denied.length,
        modelUsed: aiResponse.modelUsed,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }
}
