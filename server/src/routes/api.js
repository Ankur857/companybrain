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

// ================= CONNECTORS =================
router.get('/connectors', authenticate, ConnectorController.getAll);
router.get('/connectors/types', authenticate, ConnectorController.getTypes);
router.post('/connectors', authenticate, requireAdmin, ConnectorController.create);
router.post('/connectors/:id/test', authenticate, ConnectorController.test);
router.post('/connectors/:id/sync', authenticate, ConnectorController.sync);
router.post('/connectors/:id/disconnect', authenticate, requireAdmin, ConnectorController.disconnect);

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
