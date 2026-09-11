import bcrypt from 'bcryptjs';

// Pre-hashed 'Password123!' for speed and offline consistency
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

// Deterministic UUIDs for sample data
export const SEED_IDS = {
  // Tenants
  TENANT_ACME: '11111111-1111-1111-1111-111111111111',
  TENANT_NOVA: '22222222-2222-2222-2222-222222222222',
  TENANT_ORBIT: '33333333-3333-3333-3333-333333333333',

  // Roles
  ROLE_SUPER_ADMIN: 'a0000000-0000-0000-0000-000000000001',
  ROLE_COMPANY_ADMIN: 'a0000000-0000-0000-0000-000000000002',
  ROLE_MANAGER: 'a0000000-0000-0000-0000-000000000003',
  ROLE_EMPLOYEE: 'a0000000-0000-0000-0000-000000000004',
  ROLE_VIEWER: 'a0000000-0000-0000-0000-000000000005',

  // Acme Groups
  ACME_GRP_ENG: 'b1111111-0000-0000-0000-000000000001',
  ACME_GRP_HR: 'b1111111-0000-0000-0000-000000000002',
  ACME_GRP_FIN: 'b1111111-0000-0000-0000-000000000003',
  ACME_GRP_ALPHA: 'b1111111-0000-0000-0000-000000000004',
  ACME_GRP_LEAD: 'b1111111-0000-0000-0000-000000000005',

  // Nova Groups
  NOVA_GRP_ENG: 'b2222222-0000-0000-0000-000000000001',
  NOVA_GRP_SALES: 'b2222222-0000-0000-0000-000000000002',
  NOVA_GRP_HR: 'b2222222-0000-0000-0000-000000000003',
  NOVA_GRP_BETA: 'b2222222-0000-0000-0000-000000000004',
  NOVA_GRP_RISK: 'b2222222-0000-0000-0000-000000000005',

  // Orbit Groups
  ORBIT_GRP_ENG: 'b3333333-0000-0000-0000-000000000001',
  ORBIT_GRP_OPS: 'b3333333-0000-0000-0000-000000000002',
  ORBIT_GRP_GAMMA: 'b3333333-0000-0000-0000-000000000003',
  ORBIT_GRP_DEFENSE: 'b3333333-0000-0000-0000-000000000004',

  // Users
  USER_RAHUL: 'c1111111-0000-0000-0000-000000000001',
  USER_PRIYA: 'c1111111-0000-0000-0000-000000000002',
  USER_ADMIN_A: 'c1111111-0000-0000-0000-000000000003',

  USER_ARJUN: 'c2222222-0000-0000-0000-000000000001',
  USER_NEHA: 'c2222222-0000-0000-0000-000000000002',
  USER_ADMIN_B: 'c2222222-0000-0000-0000-000000000003',

  USER_KARAN: 'c3333333-0000-0000-0000-000000000001',
  USER_SIMRAN: 'c3333333-0000-0000-0000-000000000002',
  USER_ADMIN_C: 'c3333333-0000-0000-0000-000000000003',

  USER_SUPERADMIN: 'c0000000-0000-0000-0000-000000000001',
};

export const INITIAL_DATA = {
  tenants: [
    {
      id: SEED_IDS.TENANT_ACME,
      name: 'Acme Technologies',
      slug: 'acme-technologies',
      description: 'Cloud Infrastructure & Enterprise Enterprise SaaS',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: SEED_IDS.TENANT_NOVA,
      name: 'Nova Finance',
      slug: 'nova-finance',
      description: 'Algorithmic Trading & Asset Management',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: SEED_IDS.TENANT_ORBIT,
      name: 'Orbit Systems',
      slug: 'orbit-systems',
      description: 'Aerospace & Autonomous Satellite Guidance',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ],

  roles: [
    {
      id: SEED_IDS.ROLE_SUPER_ADMIN,
      tenant_id: null,
      name: 'Super Admin',
      description: 'Full platform administration across all tenants, health checks, and policy audits',
      permissions: ['*'],
    },
    {
      id: SEED_IDS.ROLE_COMPANY_ADMIN,
      tenant_id: null,
      name: 'Company Admin',
      description: 'Manage tenant users, connectors, access groups, policies, and view audit logs',
      permissions: ['users:*', 'groups:*', 'connectors:*', 'policies:*', 'audit:view', 'knowledge:*', 'rag:query'],
    },
    {
      id: SEED_IDS.ROLE_MANAGER,
      tenant_id: null,
      name: 'Manager',
      description: 'Manage department team members and query authorized organizational knowledge',
      permissions: ['users:view', 'groups:view', 'knowledge:view', 'rag:query'],
    },
    {
      id: SEED_IDS.ROLE_EMPLOYEE,
      tenant_id: null,
      name: 'Employee',
      description: 'Query knowledge sources restricted to assigned roles and access groups',
      permissions: ['rag:query', 'knowledge:view'],
    },
    {
      id: SEED_IDS.ROLE_VIEWER,
      tenant_id: null,
      name: 'Viewer',
      description: 'Read-only access to approved public company documentation',
      permissions: ['knowledge:view'],
    },
  ],

  groups: [
    // Acme
    { id: SEED_IDS.ACME_GRP_ENG, tenant_id: SEED_IDS.TENANT_ACME, name: 'Engineering', description: 'Core software engineering and architecture' },
    { id: SEED_IDS.ACME_GRP_HR, tenant_id: SEED_IDS.TENANT_ACME, name: 'HR', description: 'Human resources, benefits, and executive payroll' },
    { id: SEED_IDS.ACME_GRP_FIN, tenant_id: SEED_IDS.TENANT_ACME, name: 'Finance', description: 'Financial forecasting and audit records' },
    { id: SEED_IDS.ACME_GRP_ALPHA, tenant_id: SEED_IDS.TENANT_ACME, name: 'Project-Alpha', description: 'Restricted next-gen event-driven microservices initiative' },
    { id: SEED_IDS.ACME_GRP_LEAD, tenant_id: SEED_IDS.TENANT_ACME, name: 'Leadership', description: 'Executive committee and strategy board' },

    // Nova
    { id: SEED_IDS.NOVA_GRP_ENG, tenant_id: SEED_IDS.TENANT_NOVA, name: 'Engineering', description: 'Low-latency HFT and quantitative systems' },
    { id: SEED_IDS.NOVA_GRP_SALES, tenant_id: SEED_IDS.TENANT_NOVA, name: 'Sales', description: 'Institutional client acquisition & relationship' },
    { id: SEED_IDS.NOVA_GRP_HR, tenant_id: SEED_IDS.TENANT_NOVA, name: 'HR', description: 'People operations & recruitment' },
    { id: SEED_IDS.NOVA_GRP_BETA, tenant_id: SEED_IDS.TENANT_NOVA, name: 'Project-Beta', description: 'Sub-microsecond kernel bypass execution engine' },
    { id: SEED_IDS.NOVA_GRP_RISK, tenant_id: SEED_IDS.TENANT_NOVA, name: 'Risk-Compliance', description: 'Algorithmic risk limits, SEC/FINRA compliance' },

    // Orbit
    { id: SEED_IDS.ORBIT_GRP_ENG, tenant_id: SEED_IDS.TENANT_ORBIT, name: 'Engineering', description: 'Avionics, flight software, and guidance' },
    { id: SEED_IDS.ORBIT_GRP_OPS, tenant_id: SEED_IDS.TENANT_ORBIT, name: 'Operations', description: 'Satellite ground station network and command' },
    { id: SEED_IDS.ORBIT_GRP_GAMMA, tenant_id: SEED_IDS.TENANT_ORBIT, name: 'Project-Gamma', description: 'LEO autonomous star-tracker constellation' },
    { id: SEED_IDS.ORBIT_GRP_DEFENSE, tenant_id: SEED_IDS.TENANT_ORBIT, name: 'Defense-Aero', description: 'ITAR and DoD sovereign security clearances' },
  ],

  users: [
    // Acme
    {
      id: SEED_IDS.USER_RAHUL,
      tenant_id: SEED_IDS.TENANT_ACME,
      name: 'Rahul Sharma',
      email: 'rahul@acme.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_EMPLOYEE,
      department: 'Engineering',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 80 * 86400000).toISOString(),
    },
    {
      id: SEED_IDS.USER_PRIYA,
      tenant_id: SEED_IDS.TENANT_ACME,
      name: 'Priya Patel',
      email: 'priya@acme.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_MANAGER,
      department: 'HR',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    },
    {
      id: SEED_IDS.USER_ADMIN_A,
      tenant_id: SEED_IDS.TENANT_ACME,
      name: 'Admin A (Acme)',
      email: 'admin@acme.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_COMPANY_ADMIN,
      department: 'Operations',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },

    // Nova
    {
      id: SEED_IDS.USER_ARJUN,
      tenant_id: SEED_IDS.TENANT_NOVA,
      name: 'Arjun Mehta',
      email: 'arjun@nova.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_EMPLOYEE,
      department: 'Engineering',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    },
    {
      id: SEED_IDS.USER_NEHA,
      tenant_id: SEED_IDS.TENANT_NOVA,
      name: 'Neha Kapoor',
      email: 'neha@nova.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_MANAGER,
      department: 'Sales',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: SEED_IDS.USER_ADMIN_B,
      tenant_id: SEED_IDS.TENANT_NOVA,
      name: 'Admin B (Nova)',
      email: 'admin@nova.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_COMPANY_ADMIN,
      department: 'Operations',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },

    // Orbit
    {
      id: SEED_IDS.USER_KARAN,
      tenant_id: SEED_IDS.TENANT_ORBIT,
      name: 'Karan Singhania',
      email: 'karan@orbit.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_EMPLOYEE,
      department: 'Engineering',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: SEED_IDS.USER_SIMRAN,
      tenant_id: SEED_IDS.TENANT_ORBIT,
      name: 'Simran Kaur',
      email: 'simran@orbit.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_MANAGER,
      department: 'Operations',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: SEED_IDS.USER_ADMIN_C,
      tenant_id: SEED_IDS.TENANT_ORBIT,
      name: 'Admin C (Orbit)',
      email: 'admin@orbit.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_COMPANY_ADMIN,
      department: 'Operations',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },

    // Super Admin
    {
      id: SEED_IDS.USER_SUPERADMIN,
      tenant_id: SEED_IDS.TENANT_ACME, // Primary tenant, but holds Super Admin permissions
      name: 'Sarah Connor (Super Admin)',
      email: 'superadmin@companybrain.io',
      password_hash: DEFAULT_PASSWORD_HASH,
      role_id: SEED_IDS.ROLE_SUPER_ADMIN,
      department: 'Executive',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    },
  ],

  user_groups: [
    // Rahul: Engineering, Project-Alpha (Company A)
    { user_id: SEED_IDS.USER_RAHUL, group_id: SEED_IDS.ACME_GRP_ENG },
    { user_id: SEED_IDS.USER_RAHUL, group_id: SEED_IDS.ACME_GRP_ALPHA },

    // Priya: HR, Leadership (Company A)
    { user_id: SEED_IDS.USER_PRIYA, group_id: SEED_IDS.ACME_GRP_HR },
    { user_id: SEED_IDS.USER_PRIYA, group_id: SEED_IDS.ACME_GRP_LEAD },

    // Admin A: All Acme groups
    { user_id: SEED_IDS.USER_ADMIN_A, group_id: SEED_IDS.ACME_GRP_ENG },
    { user_id: SEED_IDS.USER_ADMIN_A, group_id: SEED_IDS.ACME_GRP_HR },
    { user_id: SEED_IDS.USER_ADMIN_A, group_id: SEED_IDS.ACME_GRP_FIN },
    { user_id: SEED_IDS.USER_ADMIN_A, group_id: SEED_IDS.ACME_GRP_ALPHA },
    { user_id: SEED_IDS.USER_ADMIN_A, group_id: SEED_IDS.ACME_GRP_LEAD },

    // Arjun: Engineering, Project-Beta (Company B)
    { user_id: SEED_IDS.USER_ARJUN, group_id: SEED_IDS.NOVA_GRP_ENG },
    { user_id: SEED_IDS.USER_ARJUN, group_id: SEED_IDS.NOVA_GRP_BETA },

    // Neha: Sales, Risk-Compliance (Company B)
    { user_id: SEED_IDS.USER_NEHA, group_id: SEED_IDS.NOVA_GRP_SALES },
    { user_id: SEED_IDS.USER_NEHA, group_id: SEED_IDS.NOVA_GRP_RISK },

    // Admin B: All Nova groups
    { user_id: SEED_IDS.USER_ADMIN_B, group_id: SEED_IDS.NOVA_GRP_ENG },
    { user_id: SEED_IDS.USER_ADMIN_B, group_id: SEED_IDS.NOVA_GRP_SALES },
    { user_id: SEED_IDS.USER_ADMIN_B, group_id: SEED_IDS.NOVA_GRP_HR },
    { user_id: SEED_IDS.USER_ADMIN_B, group_id: SEED_IDS.NOVA_GRP_BETA },
    { user_id: SEED_IDS.USER_ADMIN_B, group_id: SEED_IDS.NOVA_GRP_RISK },

    // Karan: Engineering, Project-Gamma (Company C)
    { user_id: SEED_IDS.USER_KARAN, group_id: SEED_IDS.ORBIT_GRP_ENG },
    { user_id: SEED_IDS.USER_KARAN, group_id: SEED_IDS.ORBIT_GRP_GAMMA },

    // Simran: Operations, Defense-Aero (Company C)
    { user_id: SEED_IDS.USER_SIMRAN, group_id: SEED_IDS.ORBIT_GRP_OPS },
    { user_id: SEED_IDS.USER_SIMRAN, group_id: SEED_IDS.ORBIT_GRP_DEFENSE },

    // Admin C: All Orbit groups
    { user_id: SEED_IDS.USER_ADMIN_C, group_id: SEED_IDS.ORBIT_GRP_ENG },
    { user_id: SEED_IDS.USER_ADMIN_C, group_id: SEED_IDS.ORBIT_GRP_OPS },
    { user_id: SEED_IDS.USER_ADMIN_C, group_id: SEED_IDS.ORBIT_GRP_GAMMA },
    { user_id: SEED_IDS.USER_ADMIN_C, group_id: SEED_IDS.ORBIT_GRP_DEFENSE },
  ],

  connectors: [
    // Acme Connectors
    {
      id: 'd1111111-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_ACME,
      type: 'google_drive',
      name: 'Google Drive (Acme Eng & Product)',
      status: 'CONNECTED',
      configuration: { folder: '/Engineering/Architecture', syncFrequency: 'hourly', authType: 'ServiceAccount' },
      last_sync_at: new Date(Date.now() - 10 * 60000).toISOString(),
      sync_status: 'SYNCED',
      document_count: 5,
    },
    {
      id: 'd1111111-0000-0000-0000-000000000002',
      tenant_id: SEED_IDS.TENANT_ACME,
      type: 'sharepoint',
      name: 'SharePoint (Acme People & HR Vault)',
      status: 'CONNECTED',
      configuration: { siteUrl: 'https://acmetech.sharepoint.com/sites/hr', library: 'ConfidentialDocuments' },
      last_sync_at: new Date(Date.now() - 25 * 60000).toISOString(),
      sync_status: 'SYNCED',
      document_count: 3,
    },
    {
      id: 'd1111111-0000-0000-0000-000000000003',
      tenant_id: SEED_IDS.TENANT_ACME,
      type: 'supabase',
      name: 'Supabase PostgreSQL (Acme Production)',
      status: 'CONNECTED',
      configuration: { schema: 'public', tables: ['api_specs', 'service_registry'] },
      last_sync_at: new Date(Date.now() - 5 * 60000).toISOString(),
      sync_status: 'SYNCED',
      document_count: 2,
    },
    {
      id: 'd1111111-0000-0000-0000-000000000004',
      tenant_id: SEED_IDS.TENANT_ACME,
      type: 'confluence',
      name: 'Confluence (Acme Tech Wiki)',
      status: 'DEMO / SAMPLE DATA',
      configuration: { spaceKey: 'ENG', baseUrl: 'https://acme.atlassian.net/wiki' },
      last_sync_at: new Date(Date.now() - 120 * 60000).toISOString(),
      sync_status: 'IDLE',
      document_count: 1,
    },
    {
      id: 'd1111111-0000-0000-0000-000000000005',
      tenant_id: SEED_IDS.TENANT_ACME,
      type: 'generic_api',
      name: 'REST API Knowledge Ingestion Gateway',
      status: 'CONNECTED',
      configuration: { webhookUrl: '/api/v1/ingest', authScheme: 'Bearer' },
      last_sync_at: new Date(Date.now() - 40 * 60000).toISOString(),
      sync_status: 'SYNCED',
      document_count: 1,
    },

    // Nova Connectors
    {
      id: 'd2222222-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_NOVA,
      type: 'mongodb',
      name: 'MongoDB Quantitative Market Data',
      status: 'CONNECTED',
      configuration: { database: 'market_risk', collection: 'strategy_docs' },
      last_sync_at: new Date(Date.now() - 15 * 60000).toISOString(),
      sync_status: 'SYNCED',
      document_count: 3,
    },
    {
      id: 'd2222222-0000-0000-0000-000000000002',
      tenant_id: SEED_IDS.TENANT_NOVA,
      type: 'crm',
      name: 'Salesforce CRM Institutional Accounts',
      status: 'CONNECTED',
      configuration: { objectTypes: ['Account', 'DealRoom'] },
      last_sync_at: new Date(Date.now() - 45 * 60000).toISOString(),
      sync_status: 'SYNCED',
      document_count: 2,
    },

    // Orbit Connectors
    {
      id: 'd3333333-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_ORBIT,
      type: 'supabase',
      name: 'Supabase Avionics Telemetry Repository',
      status: 'CONNECTED',
      configuration: { schema: 'space_ops', tables: ['flight_manuals', 'orbit_guidance'] },
      last_sync_at: new Date(Date.now() - 30 * 60000).toISOString(),
      sync_status: 'SYNCED',
      document_count: 2,
    },
  ],

  semantic_mappings: [
    // Acme
    { id: 'e1111111-0000-0000-0000-000000000001', tenant_id: SEED_IDS.TENANT_ACME, source_type: 'sharepoint', source_field: 'dept', target_field: 'department', transform_rule: 'DIRECT' },
    { id: 'e1111111-0000-0000-0000-000000000002', tenant_id: SEED_IDS.TENANT_ACME, source_type: 'sharepoint', source_field: 'emp_name', target_field: 'employee', transform_rule: 'TRIM' },
    { id: 'e1111111-0000-0000-0000-000000000003', tenant_id: SEED_IDS.TENANT_ACME, source_type: 'google_drive', source_field: 'project_code', target_field: 'project', transform_rule: 'DIRECT' },

    // Nova
    { id: 'e2222222-0000-0000-0000-000000000001', tenant_id: SEED_IDS.TENANT_NOVA, source_type: 'mongodb', source_field: 'division', target_field: 'department', transform_rule: 'DIRECT' },
    { id: 'e2222222-0000-0000-0000-000000000002', tenant_id: SEED_IDS.TENANT_NOVA, source_type: 'crm', source_field: 'staff_name', target_field: 'employee', transform_rule: 'DIRECT' },
    { id: 'e2222222-0000-0000-0000-000000000003', tenant_id: SEED_IDS.TENANT_NOVA, source_type: 'mongodb', source_field: 'project', target_field: 'project', transform_rule: 'DIRECT' },

    // Orbit
    { id: 'e3333333-0000-0000-0000-000000000001', tenant_id: SEED_IDS.TENANT_ORBIT, source_type: 'supabase', source_field: 'org_unit', target_field: 'department', transform_rule: 'DIRECT' },
    { id: 'e3333333-0000-0000-0000-000000000002', tenant_id: SEED_IDS.TENANT_ORBIT, source_type: 'supabase', source_field: 'full_name', target_field: 'employee', transform_rule: 'DIRECT' },
    { id: 'e3333333-0000-0000-0000-000000000003', tenant_id: SEED_IDS.TENANT_ORBIT, source_type: 'supabase', source_field: 'project_name', target_field: 'project', transform_rule: 'DIRECT' },
  ],

  documents: [
    // ================= Acme Technologies Documents =================
    {
      id: 'f1111111-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_ACME,
      connector_id: 'd1111111-0000-0000-0000-000000000001',
      external_id: 'gdrive-arch-001',
      title: 'Project Alpha Architecture Specification',
      content: `Project Alpha follows an event-driven microservices architecture designed for ultra-high throughput and 99.999% availability.
Core Architectural Components:
1. API Gateway: Kong Ingress routing with mTLS authentication, token verification, and 10,000 req/sec rate limiting.
2. Event Broker: Apache Kafka clusters partitioned across 3 availability zones with exactly-once delivery semantics.
3. Services:
   - auth-svc: Decentralized JWT and asymmetric key issuance with fast Redis token revocation lists.
   - ingestion-svc: Multi-threaded stream processing handling enterprise connector payloads.
   - payment-gateway: PCI-DSS compliant transactional billing processor with idempotency key enforcement.
4. Database & Storage: Multi-tenant PostgreSQL with row-level security and read-replicas; Redis Enterprise for sub-millisecond caching.
5. Observability: OpenTelemetry distributed tracing exported to Prometheus and Grafana dashboards.`,
      source_type: 'google_drive',
      source_url: 'https://drive.google.com/corp/acme/engineering/project-alpha-architecture.pdf',
      department: 'Engineering',
      project: 'Project Alpha',
      classification: 'INTERNAL',
      owner: 'rahul@acme.com',
      version: '2.4',
      metadata: { format: 'pdf', pages: 28, lastEditor: 'Rahul Sharma' },
      required_groups: [SEED_IDS.ACME_GRP_ALPHA],
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'f1111111-0000-0000-0000-000000000002',
      tenant_id: SEED_IDS.TENANT_ACME,
      connector_id: 'd1111111-0000-0000-0000-000000000001',
      external_id: 'gdrive-readme-002',
      title: 'Project Alpha Developer Onboarding & Setup Guide',
      content: `Project Alpha Local Development & CI/CD Handbook.
Local Environment Setup:
- Prerequisites: Node.js 20 LTS, Docker Desktop, Kubernetes Minikube, and PostgreSQL 16.
- Run 'git clone git@github.com:acme-tech/project-alpha.git' followed by 'npm install'.
- Execute 'docker-compose up -d' to start the local Kafka, Redis, and PostgreSQL instances.
- Environment variables must be fetched from HashiCorp Vault via 'vault-env-sync'. Never commit .env files to Git.
- Code Standards: Pre-commit git hooks enforce ESLint, Prettier, and Jest with 85% branch coverage required.`,
      source_type: 'google_drive',
      source_url: 'https://drive.google.com/corp/acme/engineering/project-alpha-readme.md',
      department: 'Engineering',
      project: 'Project Alpha',
      classification: 'INTERNAL',
      owner: 'rahul@acme.com',
      version: '1.2',
      metadata: { format: 'markdown', repository: 'project-alpha' },
      required_groups: [SEED_IDS.ACME_GRP_ALPHA],
      created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'f1111111-0000-0000-0000-000000000003',
      tenant_id: SEED_IDS.TENANT_ACME,
      connector_id: 'd1111111-0000-0000-0000-000000000001',
      external_id: 'gdrive-eng-003',
      title: 'Acme Engineering Standards & Security Handbook',
      content: `Acme Technologies Company-Wide Engineering Standards.
Security Guidelines:
1. Principle of Least Privilege: Every service account and user role must be scoped strictly to required resources.
2. Cryptography: All secrets and keys must rotate every 90 days. AES-256-GCM for encryption at rest; TLS 1.3 enforced for in-flight traffic.
3. Vulnerability Scanning: Automated SAST and DAST scans run on every pull request. Critical severity CVEs require hotfix deployment within 24 hours.
4. Production Access: Production server access requires ephemeral Just-In-Time (JIT) access approval from Engineering Leadership.`,
      source_type: 'google_drive',
      source_url: 'https://drive.google.com/corp/acme/engineering/handbook.pdf',
      department: 'Engineering',
      project: 'Core Platform',
      classification: 'INTERNAL',
      owner: 'admin@acme.com',
      version: '4.1',
      metadata: { format: 'pdf', pages: 45 },
      required_groups: [SEED_IDS.ACME_GRP_ENG],
      created_at: new Date(Date.now() - 70 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 'f1111111-0000-0000-0000-000000000004',
      tenant_id: SEED_IDS.TENANT_ACME,
      connector_id: 'd1111111-0000-0000-0000-000000000003',
      external_id: 'spb-api-004',
      title: 'Enterprise API Gateway Specifications',
      content: `Acme Enterprise API Gateway Architectural Rules and Rate Limiting.
All inbound external traffic must terminate at Cloudflare Enterprise before routing to the internal Kong Gateway.
JWT Tokens: Must carry claims for tenant_id, role_id, user_id, and access_groups array.
Rate Limits: Tier 1 clients (1,000 req/min), Tier 2 clients (10,000 req/min). DDOS mitigation automatically blocks IP addresses exceeding 50 error responses in a 1-minute window.`,
      source_type: 'supabase',
      source_url: 'https://supabase.acme.internal/docs/gateway-specs',
      department: 'Engineering',
      project: 'Infrastructure',
      classification: 'INTERNAL',
      owner: 'admin@acme.com',
      version: '3.0',
      metadata: { format: 'spec', gateway: 'Kong 3.4' },
      required_groups: [SEED_IDS.ACME_GRP_ENG],
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'f1111111-0000-0000-0000-000000000005',
      tenant_id: SEED_IDS.TENANT_ACME,
      connector_id: 'd1111111-0000-0000-0000-000000000002',
      external_id: 'sp-hr-005',
      title: '2026 Executive & Employee Salary Benchmark Report',
      content: `STRICTLY CONFIDENTIAL - HUMAN RESOURCES & EXECUTIVE BOARD ONLY.
Acme Technologies 2026 Comprehensive Compensation and Salary Bands:
1. Software Engineering:
   - Junior Engineer (L3): $105,000 - $130,000 base + $15,000 equity
   - Senior Software Engineer (L5): $170,000 - $210,000 base + $45,000 equity
   - Principal Engineer / Staff (L6): $220,000 - $265,000 base + $85,000 equity
   - VP of Engineering: $340,000 base + 45% annual cash bonus target + $180,000 annual equity grant
2. Executive Compensation & Bonus Allocations:
   - CEO Total Compensation: $620,000 base + $500,000 performance incentive
   - Total HR compensation reserve for FY2026 is budgeted at $42.8M across all regional subsidiaries.
Unauthorized disclosure or retrieval of this document results in immediate disciplinary and legal action.`,
      source_type: 'sharepoint',
      source_url: 'https://acmetech.sharepoint.com/sites/hr/SharedDocuments/ExecutiveSalaryBands2026.docx',
      department: 'HR',
      project: 'Executive Compensation',
      classification: 'HIGHLY_CONFIDENTIAL',
      owner: 'priya@acme.com',
      version: '1.0',
      metadata: { format: 'docx', confidentiality: 'HIGH' },
      required_groups: [SEED_IDS.ACME_GRP_HR],
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'f1111111-0000-0000-0000-000000000006',
      tenant_id: SEED_IDS.TENANT_ACME,
      connector_id: 'd1111111-0000-0000-0000-000000000002',
      external_id: 'sp-hr-006',
      title: 'Corporate Employee Benefits and Health Coverage Policy',
      content: `Acme Technologies Corporate Benefits Guide FY2026.
Health & Wellness:
- Comprehensive medical, dental, and vision insurance covered 100% for full-time employees and 80% for dependents.
- Mental health counseling: 12 free therapy sessions per year through Lyra Health.
Retirement:
- 401(k) matching: Acme matches 100% of employee contributions up to 5% of gross salary with immediate vesting.
Leave Policies:
- 20 days paid vacation, 10 wellness days, and 16 weeks gender-neutral paid parental leave for new parents.`,
      source_type: 'sharepoint',
      source_url: 'https://acmetech.sharepoint.com/sites/hr/SharedDocuments/BenefitsHandbook2026.pdf',
      department: 'HR',
      project: 'People Care',
      classification: 'CONFIDENTIAL',
      owner: 'priya@acme.com',
      version: '2.0',
      metadata: { format: 'pdf', pages: 18 },
      required_groups: [SEED_IDS.ACME_GRP_HR],
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: 'f1111111-0000-0000-0000-000000000007',
      tenant_id: SEED_IDS.TENANT_ACME,
      connector_id: 'd1111111-0000-0000-0000-000000000002',
      external_id: 'sp-hr-007',
      title: 'FY2026 Engineering Headcount and Strategic Hiring Plan',
      content: `Acme Technologies FY2026 Headcount & Expansion Strategy.
Planned Recruitment Target: 52 new full-time hires in Q1-Q3.
Breakdown:
- Cloud Platform Engineering: 18 positions
- Applied AI and RAG Infrastructure: 14 positions
- Enterprise Security & Compliance: 10 positions
- Product Design & Frontend: 10 positions
Total recruitment and agency budget allocated: $820,000. Recruiting priority centers in San Francisco, London, and Bangalore tech hubs.`,
      source_type: 'sharepoint',
      source_url: 'https://acmetech.sharepoint.com/sites/hr/SharedDocuments/HiringPlan2026.xlsx',
      department: 'HR',
      project: 'Hiring Plan',
      classification: 'CONFIDENTIAL',
      owner: 'priya@acme.com',
      version: '1.4',
      metadata: { format: 'xlsx' },
      required_groups: [SEED_IDS.ACME_GRP_HR],
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'f1111111-0000-0000-0000-000000000008',
      tenant_id: SEED_IDS.TENANT_ACME,
      connector_id: 'd1111111-0000-0000-0000-000000000005',
      external_id: 'api-pub-008',
      title: 'Acme Technologies Public Overview & Security Whitepaper',
      content: `Acme Technologies Company Overview and Public Trust Architecture.
Founded in 2021, Acme Technologies builds resilient cloud-native data platforms powering modern enterprises.
Security Certifications:
- SOC2 Type II Certified by Ernst & Young
- ISO/IEC 27001:2022 Certified Information Security Management
- HIPAA and GDPR Compliant data isolation controls
Data residency: Customer data is pinned to regional data centers in North America and Europe with strict cryptographic zero-knowledge enclaves.`,
      source_type: 'generic_api',
      source_url: 'https://acme.com/trust/security-whitepaper.pdf',
      department: 'Marketing',
      project: 'Trust Center',
      classification: 'PUBLIC',
      owner: 'admin@acme.com',
      version: '3.0',
      metadata: { format: 'pdf', public: true },
      required_groups: [], // No group required; PUBLIC classification allows all authenticated users
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },

    // ================= Nova Finance Documents =================
    {
      id: 'f2222222-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_NOVA,
      connector_id: 'd2222222-0000-0000-0000-000000000001',
      external_id: 'mongo-beta-001',
      title: 'Project Beta High-Frequency Trading Core Engine',
      content: `Project Beta represents Nova Finance's next-generation algorithmic order matching engine.
Engineering Architecture:
- Language: Modern C++23 with zero-allocation memory pools and cache-line aligned orderbooks.
- Hardware Acceleration: Solarflare Onload network interface cards with kernel-bypass sockets.
- Latency Benchmark: P99 tick-to-trade latency is clocked at 840 nanoseconds on CME and Nasdaq exchange feeds.
- Determinism: Single-threaded tick processing loop pinned to dedicated isolated CPU cores preventing context switching jitter.`,
      source_type: 'mongodb',
      source_url: 'mongodb://cluster0.nova.internal/market_risk/project_beta_specs',
      department: 'Engineering',
      project: 'Project Beta',
      classification: 'INTERNAL',
      owner: 'arjun@nova.com',
      version: '5.0',
      metadata: { latencyTarget: '840ns', hardware: 'Solarflare' },
      required_groups: [SEED_IDS.NOVA_GRP_BETA],
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'f2222222-0000-0000-0000-000000000002',
      tenant_id: SEED_IDS.TENANT_NOVA,
      connector_id: 'd2222222-0000-0000-0000-000000000001',
      external_id: 'mongo-risk-002',
      title: 'Nova Algorithmic Trading Risk Matrix & Circuit Breakers',
      content: `CONFIDENTIAL - NOVA FINANCE RISK MANAGEMENT COMMITTEE.
Real-Time Risk Parameters:
1. Maximum Aggregate Firm Exposure: Capped at $250M across all equities, futures, and currency pairs.
2. Velocity Limits: Maximum 5,000 orders/second per trading account.
3. Stop-Loss Circuit Breakers: Automatic automated liquidation kicks in if intra-day drawdown on any active strategy crosses 1.8%.
4. Regulatory Reporting: Direct automated feed to FINRA and SEC trade surveillance systems with real-time audit trail.`,
      source_type: 'mongodb',
      source_url: 'mongodb://cluster0.nova.internal/market_risk/risk_matrix',
      department: 'Risk-Compliance',
      project: 'Risk Governance',
      classification: 'CONFIDENTIAL',
      owner: 'admin@nova.com',
      version: '3.1',
      metadata: { regulator: 'FINRA', maxExposure: '$250M' },
      required_groups: [SEED_IDS.NOVA_GRP_RISK],
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'f2222222-0000-0000-0000-000000000003',
      tenant_id: SEED_IDS.TENANT_NOVA,
      connector_id: 'd2222222-0000-0000-0000-000000000002',
      external_id: 'crm-inst-003',
      title: 'Nova Institutional Prime Brokerage Client Portfolio',
      content: `CONFIDENTIAL - SALES & RELATIONSHIP MANAGEMENT.
Institutional Client Accounts Summary:
- Top 10 Hedge Fund Clients hold $1.42B in managed collateral with Nova Finance Prime Brokerage.
- Fee Schedule: Standard 8 bps on equities routing, 4 bps on fixed income, plus 15% performance fee tier.
- Key Accounts: BlackRock Global Alpha, Citadel Securities routing syndicate, Millennium Management desks.`,
      source_type: 'crm',
      source_url: 'https://nova.salesforce.com/lightning/r/Account/0013000000NovaInst',
      department: 'Sales',
      project: 'Institutional Growth',
      classification: 'CONFIDENTIAL',
      owner: 'neha@nova.com',
      version: '2.0',
      metadata: { aum: '$1.42B', totalAccounts: 48 },
      required_groups: [SEED_IDS.NOVA_GRP_SALES],
      created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },

    // ================= Orbit Systems Documents =================
    {
      id: 'f3333333-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_ORBIT,
      connector_id: 'd3333333-0000-0000-0000-000000000001',
      external_id: 'spb-gamma-001',
      title: 'Project Gamma Autonomous Satellite Guidance & ADCS',
      content: `TOP SECRET / DEFENSE - ORBIT SYSTEMS ITAR RESTRICTED.
Project Gamma Autonomous Guidance and Attitude Determination and Control Subsystem (ADCS):
- Target Orbit: Sun-Synchronous Low Earth Orbit (LEO) at 550km altitude.
- Flight Compute: Radiation-hardened Xilinx Virtex-5 FPGA paired with dual ARM Cortex-R5 real-time cores.
- Sensor Array: Dual autonomous star-trackers, 3-axis fiber-optic gyroscopes, and solar vector magnetometers.
- Propulsion: Low-power pulsed plasma thrusters (PPT) yielding 45mN of specific impulse for constellation station-keeping.
- Autonomous Collision Avoidance: Real-time onboard ephemeris calculation avoiding space debris without ground command intervention.`,
      source_type: 'supabase',
      source_url: 'https://orbit-avionics.internal/guidance/project-gamma-adcs.pdf',
      department: 'Engineering',
      project: 'Project Gamma',
      classification: 'HIGHLY_CONFIDENTIAL',
      owner: 'karan@orbit.com',
      version: '4.0',
      metadata: { itar: true, securityClearance: 'Level-5', altitude: '550km' },
      required_groups: [SEED_IDS.ORBIT_GRP_GAMMA, SEED_IDS.ORBIT_GRP_DEFENSE],
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'f3333333-0000-0000-0000-000000000002',
      tenant_id: SEED_IDS.TENANT_ORBIT,
      connector_id: 'd3333333-0000-0000-0000-000000000001',
      external_id: 'spb-defense-002',
      title: 'Aerospace Ground Station Network & Cryptographic Telemetry',
      content: `CONFIDENTIAL - DEFENSE & OPERATIONS SATELLITE COMMAND.
Orbit Systems Global Telemetry, Tracking, and Command (TT&C) Network:
- Ground Stations located in Svalbard, Hawaii, and Hartebeesthoek.
- Downlink Frequency: X-Band 8.2 GHz at 1.2 Gbps downlink bandwidth.
- Cryptography: All uplink telecommands use NSA Type 1 hardware encryption modules. Replay attacks are mitigated via non-repeating monotonic counter nonces.
- Emergency Safemode: In case of telemetry loss exceeding 4 orbits (360 minutes), the spacecraft automatically reorients solar arrays towards the Sun and transmits beacon pulses on 437 MHz UHF.`,
      source_type: 'supabase',
      source_url: 'https://orbit-avionics.internal/ops/ground-network-spec.pdf',
      department: 'Operations',
      project: 'Defense Systems',
      classification: 'CONFIDENTIAL',
      owner: 'simran@orbit.com',
      version: '2.5',
      metadata: { stations: ['Svalbard', 'Hawaii', 'Hartebeesthoek'] },
      required_groups: [SEED_IDS.ORBIT_GRP_OPS, SEED_IDS.ORBIT_GRP_DEFENSE],
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
  ],

  policies: [
    {
      id: 'g1111111-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_ACME,
      name: 'Strict Tenant Isolation & Group-Based Access',
      description: 'Enforces complete tenant data isolation and requires explicit group membership for INTERNAL and CONFIDENTIAL resources.',
      rules: {
        enforceTenantMatch: true,
        requireGroupMembership: true,
        allowPublicToAllAuthenticated: true,
        superAdminCrossTenantOverride: true,
      },
      enabled: true,
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: 'g1111111-0000-0000-0000-000000000002',
      tenant_id: SEED_IDS.TENANT_ACME,
      name: 'Confidential HR & Payroll Shield',
      description: 'Restricts all HIGHLY_CONFIDENTIAL HR and salary data strictly to HR personnel and executive leadership.',
      rules: {
        restrictedDepartments: ['HR'],
        requiredClassification: 'HIGHLY_CONFIDENTIAL',
        allowedGroups: ['HR', 'Leadership'],
      },
      enabled: true,
      created_at: new Date(Date.now() - 85 * 86400000).toISOString(),
    },
    {
      id: 'g2222222-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_NOVA,
      name: 'FINRA Compliance & Algorithmic Firewall',
      description: 'Prevents non-risk certified personnel from accessing trading algorithm risk matrix and exposure parameters.',
      rules: {
        enforceTenantMatch: true,
        requireGroupMembership: true,
      },
      enabled: true,
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'g3333333-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_ORBIT,
      name: 'ITAR Defense & Avionics Guidance Protection',
      description: 'Mandates Defense-Aero security clearance group for all satellite guidance and telemetry communications.',
      rules: {
        enforceTenantMatch: true,
        requireSecurityClearance: true,
      },
      enabled: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ],

  audit_logs: [
    {
      id: 'h1111111-0000-0000-0000-000000000001',
      tenant_id: SEED_IDS.TENANT_ACME,
      user_id: SEED_IDS.USER_RAHUL,
      user_name: 'Rahul Sharma',
      action: 'RAG_QUERY',
      resource_type: 'KNOWLEDGE_SEARCH',
      resource_id: 'Project-Alpha',
      decision: 'ALLOW',
      reason: 'User Rahul belongs to required group Project-Alpha and has Employee role in Acme Technologies',
      metadata: {
        query: 'What is the architecture of Project Alpha?',
        documents_accessed: 2,
        doc_ids: ['f1111111-0000-0000-0000-000000000001', 'f1111111-0000-0000-0000-000000000002'],
        tokens_used: 340,
      },
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
    {
      id: 'h1111111-0000-0000-0000-000000000002',
      tenant_id: SEED_IDS.TENANT_ACME,
      user_id: SEED_IDS.USER_RAHUL,
      user_name: 'Rahul Sharma',
      action: 'RAG_QUERY',
      resource_type: 'KNOWLEDGE_SEARCH',
      resource_id: 'HR-Salaries',
      decision: 'DENY',
      reason: 'User Rahul lacks required access group [HR] to view HIGHLY_CONFIDENTIAL document: 2026 Executive & Employee Salary Benchmark Report',
      metadata: {
        query: 'Show me employee salary information and bonus allocations',
        documents_accessed: 0,
        attempted_docs: ['f1111111-0000-0000-0000-000000000005'],
        security_policy: 'Confidential HR & Payroll Shield',
      },
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'h1111111-0000-0000-0000-000000000003',
      tenant_id: SEED_IDS.TENANT_ACME,
      user_id: SEED_IDS.USER_PRIYA,
      user_name: 'Priya Patel',
      action: 'RAG_QUERY',
      resource_type: 'KNOWLEDGE_SEARCH',
      resource_id: 'HR-Benefits',
      decision: 'ALLOW',
      reason: 'User Priya belongs to group HR with Manager role',
      metadata: {
        query: 'What are the 401(k) matching and parental leave terms?',
        documents_accessed: 1,
        doc_ids: ['f1111111-0000-0000-0000-000000000006'],
      },
      created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
  ],

  connectors: [],
  connector_items: [],
  connector_access_rules: [],
};
