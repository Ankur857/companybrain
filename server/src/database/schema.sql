-- ==============================================================================
-- COMPANYBRAIN DATABASE SCHEMA (PostgreSQL / Supabase)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS (Companies)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, TRIAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL means Global Role (e.g. Super Admin)
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ACCESS GROUPS
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. USER <-> GROUPS MAPPING (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_groups (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
);

-- 6. CONNECTORS
CREATE TABLE IF NOT EXISTS connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- google_drive, sharepoint, supabase
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'DISCONNECTED', -- CONNECTED, SYNCING, SYNCED, ERROR, DISCONNECTED
    is_demo BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    configuration JSONB DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'IDLE',
    document_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6b. CONNECTOR ACCOUNTS (Authenticated OAuth Accounts & Credentials - Backend Only)
CREATE TABLE IF NOT EXISTS connector_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_account_id VARCHAR(255),
    account_email VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    credential_reference JSONB DEFAULT '{}'::jsonb, -- Secure encrypted access/refresh tokens
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6c. CONNECTOR ITEMS (Selected Knowledge Files/Folders/Tables)
CREATE TABLE IF NOT EXISTS connector_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    parent_id VARCHAR(255),
    item_type VARCHAR(50) NOT NULL, -- folder, file, table, schema
    name VARCHAR(255) NOT NULL,
    path VARCHAR(1000) NOT NULL,
    source_type VARCHAR(100) NOT NULL, -- google_drive, sharepoint, supabase
    mime_type VARCHAR(255),
    source_url VARCHAR(1000),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_selected BOOLEAN DEFAULT FALSE,
    sync_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SYNCED, ERROR
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6d. CONNECTOR ACCESS RULES (User & Group Level Permissions with Folder Inheritance)
CREATE TABLE IF NOT EXISTS connector_access_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    connector_item_id UUID NOT NULL REFERENCES connector_items(id) ON DELETE CASCADE,
    subject_type VARCHAR(50) NOT NULL, -- USER, GROUP
    subject_id UUID NOT NULL,
    permission VARCHAR(50) DEFAULT 'READ', -- READ, WRITE, ADMIN
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. SCHEMA / SEMANTIC MAPPINGS
CREATE TABLE IF NOT EXISTS semantic_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_type VARCHAR(100) NOT NULL,
    source_field VARCHAR(100) NOT NULL,
    target_field VARCHAR(100) NOT NULL,
    transform_rule VARCHAR(100) DEFAULT 'DIRECT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. DOCUMENTS (Common Knowledge Representation)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    connector_id UUID REFERENCES connectors(id) ON DELETE SET NULL,
    external_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    source_url VARCHAR(1000),
    department VARCHAR(100),
    project VARCHAR(100),
    classification VARCHAR(50) NOT NULL DEFAULT 'INTERNAL', -- PUBLIC, INTERNAL, CONFIDENTIAL, HIGHLY_CONFIDENTIAL
    owner VARCHAR(255),
    version VARCHAR(50) DEFAULT '1.0',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. DOCUMENT PERMISSIONS (Access Group Gate)
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    access_type VARCHAR(50) DEFAULT 'READ', -- READ, WRITE, ADMIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. DOCUMENT CHUNKS
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. POLICIES
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- RAG_QUERY, CONNECTOR_SYNC, DOCUMENT_VIEW, POLICY_CHANGE, AUTH_LOGIN
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    decision VARCHAR(50) NOT NULL, -- ALLOW, DENY, INFO, SUCCESS, FAILED
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. RAG QUERIES (History & Insights)
CREATE TABLE IF NOT EXISTS rag_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    security_eval JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM ISOLATION & QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_groups_tenant_id ON groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connectors_tenant_id ON connectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_accounts_tenant ON connector_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_accounts_conn ON connector_accounts(connector_id);
CREATE INDEX IF NOT EXISTS idx_connector_items_tenant_id ON connector_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_items_conn_id ON connector_items(connector_id);
CREATE INDEX IF NOT EXISTS idx_connector_items_parent_id ON connector_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_conn_access_tenant_id ON connector_access_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conn_access_item_id ON connector_access_rules(connector_item_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project);
CREATE INDEX IF NOT EXISTS idx_doc_perm_doc_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_perm_group_id ON document_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_decision ON audit_logs(decision);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
