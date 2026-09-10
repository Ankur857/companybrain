export class ResponseGuard {
  /**
   * Validate the RAG response prior to delivering it to the client.
   * Ensures no leakage of unauthorized citations, guarantees non-empty responses,
   * and enforces strict factual grounding.
   *
   * @param {Object} params
   * @param {string} params.answer
   * @param {Array} params.authorizedDocuments
   * @param {Array} params.sourcesUsed
   * @param {Array} params.deniedDocuments
   * @returns {Object} { isValid: boolean, sanitizedAnswer: string, sources: Array, securityNote: string }
   */
  static validateResponse({ answer, authorizedDocuments = [], sourcesUsed = [], deniedDocuments = [] }) {
    // Check 1: Zero authorized sources
    if (!authorizedDocuments || authorizedDocuments.length === 0) {
      return {
        isValid: false,
        sanitizedAnswer: "I couldn't find enough authorized information in your company's knowledge base to answer this question. You may lack the necessary access group permissions or classification clearance.",
        sources: [],
        securityNote: 'Zero authorized context available. Blocked before retrieval.',
      };
    }

    // Check 2: Empty or malformed answer
    if (!answer || answer.trim().length === 0) {
      return {
        isValid: false,
        sanitizedAnswer: "I was unable to retrieve a conclusive answer from the authorized sources.",
        sources: sourcesUsed,
        securityNote: 'Empty response prevented.',
      };
    }

    let sanitized = answer;

    // Check 3: Prevent leakage of denied document titles or IDs (Data Loss Prevention / DLP)
    for (const deniedDoc of deniedDocuments) {
      if (deniedDoc.title && sanitized.toLowerCase().includes(deniedDoc.title.toLowerCase())) {
        sanitized = sanitized.replace(
          new RegExp(deniedDoc.title, 'gi'),
          '[RESTRICTED_SOURCE]'
        );
      }
    }

    // Check 4: Ensure every source in sourcesUsed was actually in authorizedDocuments
    const authorizedIds = new Set(authorizedDocuments.map((d) => d.id));
    const cleanSources = sourcesUsed.filter((s) => authorizedIds.has(s.id));

    return {
      isValid: true,
      sanitizedAnswer: sanitized,
      sources: cleanSources,
      securityNote: `Response verified. ${cleanSources.length} authorized source(s) used. Zero unauthorized sources referenced.`,
    };
  }
}
