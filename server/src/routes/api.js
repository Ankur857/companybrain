import express from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { AuthController } from '../controllers/authController.js';
import { CompanyController } from '../controllers/companyController.js';
import { UserController } from '../controllers/userController.js';
import { GroupController } from '../controllers/groupController.js';
import { ConnectorController } from '../controllers/connectorController.js';
import { DocumentController } from '../controllers/documentController.js';
import { RAGController } from '../controllers/ragController.js';
import { AuditController } from '../controllers/auditController.js';
import { PolicyController } from '../controllers/policyController.js';
import { SystemController } from '../controllers/systemController.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'CompanyBrain Platform API',
    timestamp: new Date().toISOString(),
    security: {
      tenantIsolation: 'Active',
      preRAGPolicyEngine: 'Active',
      llmKeyProtected: true,
    },
  });
});

// ================= AUTHENTICATION =================
router.post('/auth/login', AuthController.login);
router.post('/auth/signup', AuthController.signup);
router.get('/auth/personas', AuthController.getDemoPersonas);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', authenticate, AuthController.me);
router.post('/auth/switch-tenant', authenticate, AuthController.switchTenant);

// ================= SYSTEM & DASHBOARD =================
router.get('/system/dashboard-stats', authenticate, SystemController.getDashboardStats);
router.get('/system/architecture', SystemController.getArchitecture);
router.post('/system/reset-demo', authenticate, SystemController.resetDemo);

// ================= COMPANIES (MULTI-TENANT) =================
router.get('/companies', authenticate, CompanyController.getAll);
router.post('/companies', authenticate, CompanyController.create);
router.get('/companies/:id', authenticate, CompanyController.getById);
router.put('/companies/:id', authenticate, CompanyController.update);

// ================= USERS =================
router.get('/users', authenticate, UserController.getAll);
router.post('/users', authenticate, requireAdmin, UserController.create);
router.put('/users/:id', authenticate, requireAdmin, UserController.update);

// ================= ACCESS GROUPS =================
router.get('/groups', authenticate, GroupController.getAll);
router.post('/groups', authenticate, requireAdmin, GroupController.create);
router.post('/groups/:id/members', authenticate, requireAdmin, GroupController.addMember);
router.delete('/groups/:id/members/:userId', authenticate, requireAdmin, GroupController.removeMember);

// ================= CONNECTORS (ADMIN ONLY) =================
router.get('/connectors', authenticate, requireAdmin, ConnectorController.getAll);
router.get('/connectors/types', authenticate, requireAdmin, ConnectorController.getTypes);
router.get('/connectors/:id', authenticate, requireAdmin, ConnectorController.getById);
router.post('/connectors/:id/test', authenticate, requireAdmin, ConnectorController.test);
router.post('/connectors/:id/sync', authenticate, requireAdmin, ConnectorController.sync);
router.post('/connectors/:id/disconnect', authenticate, requireAdmin, ConnectorController.disconnect);
router.delete('/connectors/:id', authenticate, requireAdmin, ConnectorController.delete);

// Real Account OAuth & Live Connection Endpoints
router.get('/connectors/oauth/:provider/authorize', authenticate, requireAdmin, ConnectorController.getOAuthUrl);
router.get('/connectors/oauth/:provider/callback', ConnectorController.handleOAuthCallback);
router.post('/connectors/supabase/connect', authenticate, requireAdmin, ConnectorController.connectSupabase);
router.post('/connectors/supabase/upload', authenticate, requireAdmin, ConnectorController.uploadSupabaseDocument);
router.post('/connectors/development/connect', authenticate, requireAdmin, ConnectorController.connectDevelopment);

// Live Source Browsing & Selection
router.get('/connectors/:id/browse', authenticate, requireAdmin, ConnectorController.browse);
router.post('/connectors/:id/select', authenticate, requireAdmin, ConnectorController.selectKnowledge);

// Connector Access Governance & Permissions
router.get('/connectors/:id/items/:itemId/access', authenticate, requireAdmin, ConnectorController.getItemAccess);
router.post('/connectors/:id/items/:itemId/access', authenticate, requireAdmin, ConnectorController.saveItemAccess);

// ================= DOCUMENTS / KNOWLEDGE =================
router.get('/documents', authenticate, DocumentController.getAll);
router.get('/documents/:id', authenticate, DocumentController.getById);
router.post('/documents', authenticate, requireAdmin, DocumentController.create);
router.put('/documents/:id', authenticate, requireAdmin, DocumentController.update);
router.delete('/documents/:id', authenticate, requireAdmin, DocumentController.delete);

// ================= PERMISSION-AWARE RAG =================
router.post('/rag/query', authenticate, RAGController.query);
router.get('/rag/history', authenticate, RAGController.getHistory);

// ================= AUDIT LOGS =================
router.get('/audit-logs', authenticate, AuditController.getLogs);

// ================= POLICIES =================
router.get('/policies', authenticate, PolicyController.getAll);
router.post('/policies', authenticate, requireAdmin, PolicyController.create);
router.put('/policies/:id', authenticate, requireAdmin, PolicyController.update);
router.post('/policies/evaluate', authenticate, PolicyController.simulate);

export default router;
