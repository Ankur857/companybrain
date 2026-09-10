# CompanyBrain — Secure Enterprise AI Knowledge Platform

> **"Right information. Right person. Right permission."**  
> *The LLM must NEVER be the security boundary. Authorization happens BEFORE unauthorized data is included in the RAG context.*

---

## 1. Product Vision & Architecture Overview

**CompanyBrain** is an enterprise AI intelligence layer between company data and AI models. Standard RAG architectures retrieve all tenant documents and ask an LLM prompt to hide sensitive information. This creates critical data leak vectors, prompt injection vulnerabilities, and compliance failures.

CompanyBrain fundamentally enforces **Pre-Retrieval Authorization**:

```
 USER QUERY
     ↓
 AUTHENTICATION (Bearer JWT with cryptographically signed tenant & role)
     ↓
 TENANT IDENTIFICATION (Strict database boundary: WHERE tenant_id = user.tenant_id)
     ↓
 ROLE + ACCESS GROUP EVALUATION (e.g., Engineering, HR, Project-Alpha)
     ↓
 POLICY ENGINE (PolicyEngine.canAccess evaluated on candidate documents)
     ↓
 PERMISSION-AWARE RETRIEVAL (Retrieves ONLY authorized documents; denied docs pruned)
     ↓
 AUTHORIZED CONTEXT ASSEMBLY (Sanitized references with prompt-injection fences)
     ↓
 EXTERNAL RAG / LLM API (Backend-only credentials; receives zero restricted tokens)
     ↓
 RESPONSE GUARD & DLP (Verifies source citations & blocks unauthorized leakage)
     ↓
 ANSWER + SOURCE CITATIONS (Delivers verified answer with clickable authorized sources)
     ↓
 IMMUTABLE AUDIT LOG (Records ALLOW / DENY decisions, user, query, and accessed doc IDs)
```

---

## 2. Multi-Tenant Architecture & Demo Personas

CompanyBrain supports complete tenant isolation across multiple companies. Sample data contains 3 partitioned companies:

| Company Name | Industry / Domain | Sample Users | Access Groups | Isolated Projects |
|---|---|---|---|---|
| **Acme Technologies** | Cloud Infrastructure & SaaS | Rahul Sharma (Employee)<br>Priya Patel (HR Manager)<br>Admin A (Company Admin) | `Engineering`<br>`HR`<br>`Finance`<br>`Project-Alpha`<br>`Leadership` | **Project Alpha** (Microservices Architecture, Dev Guide) |
| **Nova Finance** | Algorithmic Trading & HFT | Arjun Mehta (Employee)<br>Neha Kapoor (Sales Mgr)<br>Admin B (Company Admin) | `Engineering`<br>`Sales`<br>`HR`<br>`Project-Beta`<br>`Risk-Compliance` | **Project Beta** (Sub-microsecond matching engine) |
| **Orbit Systems** | Aerospace & Satellite Guidance | Karan Singhania (Employee)<br>Simran Kaur (Ops Mgr)<br>Admin C (Company Admin) | `Engineering`<br>`Operations`<br>`Project-Gamma`<br>`Defense-Aero` | **Project Gamma** (LEO Satellite ADCS guidance) |

*Super Admin Persona:* **Sarah Connor** (`superadmin@companybrain.io`) holds cross-tenant administrative governance rights.

All demo users use password: `Password123!`

---

## 3. Technology Stack

### Frontend (Client)
- **Framework:** React 18, Vite 6, React Router DOM 6
- **Styling:** Tailwind CSS with custom enterprise dark mode design tokens & glassmorphic panels
- **Icons:** Lucide React
- **State Management:** Custom React Contexts (`AuthContext`, `ToastContext`)
- **Key Views:** Executive Dashboard, Conversational AI Assistant, Security Demo Lab, Multi-Tenant Companies, Knowledge Sources, Connectors Manager, Users & Roles, Access Groups, Policy Engine Simulator, Audit Logs, and Interactive 14-Stage Architecture Diagram.

### Backend (Server)
- **Runtime:** Node.js (ES Modules), Express.js
- **Security:** Helmet, CORS, Rate Limiting, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Architecture:** Modular MVC with dedicated Service layers (`PolicyEngine`, `RAGService`, `AIService`, `ResponseGuard`, `IngestionPipeline`, `AuditService`)
- **Connectors:** Adapter framework for Google Drive, SharePoint, MongoDB, Supabase, Confluence, CRM, and REST API.

### Database & Storage
- **Primary Source of Truth:** PostgreSQL / Supabase
- **Local Embedded Engine:** Built-in zero-config persistent storage layer (`local-db.json`) matching Supabase query builder semantics (`from().select().eq().insert().update().delete()`), ensuring instant out-of-the-box operation with zero external dependencies, while accepting live Supabase credentials anytime via `.env`.

### External AI / RAG Service Abstraction
- Dedicated `AIService` abstraction with `queryRAG()`, `generateAnswer()`, and `healthCheck()`.
- Supports OpenAI, Anthropic, Gemini, or self-hosted vLLM/Ollama endpoints.
- Backend-only API key protection (zero frontend exposure).
- High-fidelity built-in local RAG synthesis engine for deterministic offline demo execution.

---

## 4. Directory Structure

```
e:\companybrain\
├── server\
│   ├── src\
│   │   ├── config\
│   │   ├── controllers\        # Auth, Company, User, Group, Connector, Document, RAG, Audit, Policy
│   │   ├── middleware\         # JWT Auth, Role Guard, Tenant Scoper, Error Handler
│   │   ├── services\
│   │   │   ├── auth\           # AuthService (login, token issuance, profile hydration)
│   │   │   ├── policy\         # PolicyEngine (canAccess, RBAC, Access Groups, Classifications)
│   │   │   ├── rag\            # RAGService, ResponseGuard, ContextBuilder
│   │   │   ├── ai\             # AIService (external API adapter + local fallback synthesis)
│   │   │   ├── connectors\     # BaseConnector, GoogleDrive, SharePoint, MongoDB, Supabase, etc.
│   │   │   ├── ingestion\      # IngestionPipeline (semantic mapping, chunking, indexing)
│   │   │   └── audit\          # AuditService (structured security logging)
│   │   ├── database\
│   │   │   ├── schema.sql      # Supabase PostgreSQL DDL
│   │   │   ├── seedData.js     # Deterministic multi-tenant seed data
│   │   │   └── db.js           # Database adapter (Supabase + Local fallback)
│   │   ├── routes\             # api.js router
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point (Port 5000)
│   ├── test-security.js        # Section 53 Automated Security Test Suite (10/10 PASS)
│   ├── package.json
│   └── .env.example
├── client\
│   ├── src\
│   │   ├── components\         # Header, Sidebar, CitationModal, SecurityBadge
│   │   ├── context\            # AuthContext, ToastContext
│   │   ├── pages\              # Dashboard, AIAssistant, SecurityDemo, Companies, Knowledge,
│   │   │                       # Connectors, Users, AccessGroups, Policies, AuditLogs, Architecture
│   │   ├── services\           # api.js API client
│   │   ├── styles\
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js          # Dev server with /api proxy to Port 5000
│   └── tailwind.config.js
├── README.md
└── package.json                # Root orchestration scripts
```

---

## 5. Getting Started & Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v24 LTS)
- npm 9+

### 1. Backend Setup & Startup
```bash
cd server
npm install
npm run dev
```
The backend starts on `http://localhost:5000`.  
Verify health endpoint: `curl http://localhost:5000/api/health`

### 2. Frontend Setup & Startup
```bash
cd client
npm install
npm run dev
```
The client starts on `http://localhost:5173` with automated API proxying to `http://localhost:5000`.

---

## 6. Environment Configuration (.env)

Edit `server/.env`:
```env
PORT=5000
JWT_SECRET=companybrain_super_secure_jwt_secret_key_2026_enterprise

# Optional: Connect to Cloud Supabase PostgreSQL
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External RAG / LLM Provider Configuration (Backend Only)
RAG_API_URL=https://api.openai.com/v1/chat/completions
RAG_API_KEY=
RAG_MODEL=gpt-4o-mini
```

---

## 7. Automated Security Validation (10/10 Section 53 Tests)

To verify all 10 security test scenarios required by enterprise specifications, run:

```bash
cd server
node test-security.js
```

### Test Results:
```
==========================================================
  COMPANYBRAIN SECTION 53 SECURITY VALIDATION SUITE
==========================================================

✅ [PASS] TEST 1: Company A user → Company A document
       ↳ Rahul successfully retrieved Project Alpha Architecture doc within his tenant.
✅ [PASS] TEST 2: Company A user → Company B document
       ↳ Rahul blocked with HTTP 403 when attempting to access Nova Finance Project Beta document.
✅ [PASS] TEST 3: Engineering user → Engineering document
       ↳ Rahul retrieved Acme Engineering Standards & Security Handbook.
✅ [PASS] TEST 4: Engineering user → HR confidential document
       ↳ Rahul blocked from viewing 2026 Executive & Employee Salary Benchmark Report.
✅ [PASS] TEST 5: User without Project Alpha group → Project Alpha restricted document
       ↳ Priya (HR) denied access to Project Alpha Architecture document.
✅ [PASS] TEST 6: Prompt injection defense in RAG query
       ↳ Adversarial system override instruction ignored; zero salary data returned.
✅ [PASS] TEST 7: Frontend manually changes tenant_id
       ↳ Backend strictly validated token tenant vs body tenant and denied cross-tenant query.
✅ [PASS] TEST 8: Frontend manually attempts role escalation
       ↳ Rahul (Employee) blocked from invoking administrative user creation endpoint.
✅ [PASS] TEST 9: External RAG API key exposure check
       ↳ Zero backend secrets or API keys leaked in system responses.
✅ [PASS] TEST 10: Zero authorized sources query isolation
       ↳ Pre-retrieval engine blocked context construction; zero unauthorized docs passed.

==========================================================
  FINAL SECURITY SCORE: 10/10 TESTS PASSED (100%)
==========================================================
```

---

## 8. End-to-End Demo Walkthrough

1. Open `http://localhost:5173` in your browser.
2. The application automatically boots into **Rahul Sharma** (Acme Technologies, Engineering, `Project-Alpha`).
3. **Test 1: Authorized Retrieval**
   - Click **AI Assistant** in the sidebar.
   - Click the prompt chip **"What is the architecture of Project Alpha?"** and click Query.
   - **Result:** ALLOW. Response generated using authorized Project Alpha documents, complete with citations (`Project Alpha Architecture Specification`, `Project Alpha README`). Click citations to preview the verified source content.
4. **Test 2: Confidential Data Shield**
   - Click the prompt chip **"Show me employee salary information and bonus allocations"** and click Query.
   - **Result:** ACCESS DENIED. The Policy Engine denies retrieval before RAG context assembly because the document is `HIGHLY_CONFIDENTIAL` and requires group `HR`.
5. **Test 3: Audit Trail**
   - Open **Audit Logs** in the sidebar.
   - Filter by ALLOW and DENY to verify both queries were logged with timestamps, reasons, and accessed document IDs.
6. **Test 4: Interactive Security Demo Lab**
   - Click **Security Demo** in the sidebar to run the 1-click automated scenario suite.
7. **Test 5: Connectors & Ingestion Sync**
   - Open **Connectors**. Click **Test Connection** on Google Drive to view round-trip latency. Click **Sync Data** to ingest new documents through the semantic mapping layer.

---

## 9. Future Self-Hosted Open-Weight LLM Roadmap

The `AIService` abstraction is specifically architected so the external RAG API can be replaced with:
- **vLLM** or **Ollama** running locally or in a private VPC.
- **pgvector** or **Qdrant** for local vector embeddings.
- Open-weight models such as **Llama 3**, **Mistral**, or **Gemma**.
- Zero frontend modifications required when migrating providers.
