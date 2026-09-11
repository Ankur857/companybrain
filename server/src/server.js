import 'dotenv/config';
import app from './app.js';
import { db } from './database/db.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
==========================================================
   COMPANYBRAIN ENTERPRISE AI PLATFORM (BACKEND)
==========================================================
   Port:                 http://localhost:${PORT}
   API Health:           http://localhost:${PORT}/api/health
   Policy Engine:        ACTIVE (Pre-Retrieval Enforced)
   Tenant Isolation:     ACTIVE (Strict Database Scoping)
   RAG Key Exposure:     PROTECTED (Backend-Only)
   Status:               Ready for enterprise requests
==========================================================
  `);
});
