import { RAGService } from '../services/rag/ragService.js';
import { db } from '../database/db.js';

export class RAGController {
  static async query(req, res) {
    try {
      const { query, tenantId } = req.body;
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Query text cannot be empty.' });
      }

      const result = await RAGService.executeQuery({
        user: req.user,
        query: query.trim(),
        tenant_id: tenantId || req.user.tenant_id,
      });

      return res.json(result);
    } catch (err) {
      console.error('RAG query execution error:', err);
      return res.status(500).json({
        success: false,
        error: 'AI service is temporarily unavailable. Please verify external API connectivity.',
        details: err.message,
      });
    }
  }

  static async getHistory(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: history } = await db.from('rag_queries')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20);

      return res.json({ success: true, history: history || [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
