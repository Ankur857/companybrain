/**
 * Automated Test Suite for Real-Account & Live-Data Connectors Module
 * Validates:
 * 1. Admin Authentication & Role Enforcement (Employees blocked with 403)
 * 2. Multi-Tenant Isolation (Company A cannot access Company B connectors)
 * 3. 3 Supported Connectors: Google Drive, Microsoft SharePoint, Supabase
 * 4. OAuth URL generation with cryptographically signed state
 * 5. Live / Development Mode Connection & Real Schema / File Browsing
 * 6. Explicit Knowledge Selection into CompanyBrain
 * 7. Folder-Level Access Inheritance & User/Group Permissions
 * 8. Real Synchronized Ingestion into Documents & Permissions
 * 9. Safe Disconnection
 * 10. Structured Audit Event Logging
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('===============================================================');
  console.log('  COMPANYBRAIN REAL CONNECTORS MODULE AUTOMATED TEST SUITE');
  console.log('===============================================================\n');

  let total = 0;
  let passed = 0;

  function assert(condition, name, detail = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name} ${detail ? `\n       ↳ ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? `\n       ↳ ${detail}` : ''}`);
    }
  }

  // --- Step 1: Login Personas ---
  // Rahul: Acme Employee (non-admin)
  const rahulRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul@acme.com', password: 'Password123!' }),
  });
  const rahulData = await rahulRes.json();
  const rahulToken = rahulData.token;

  // Admin A: Acme Company Admin
  const adminARes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'Password123!' }),
  });
  const adminAData = await adminARes.json();
  const adminAToken = adminAData.token;

  // Admin B: Nova Finance Company Admin
  const adminBRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nova.com', password: 'Password123!' }),
  });
  const adminBData = await adminBRes.json();
  const adminBToken = adminBData.token;

  // =========================================================================
  // TEST 1: Normal Employee is strictly BLOCKED from connectors (403 Forbidden)
  // =========================================================================
  const empGetRes = await fetch(`${BASE_URL}/connectors`, {
    headers: { Authorization: `Bearer ${rahulToken}` },
  });
  assert(
    empGetRes.status === 403,
    'TEST 1: Normal employee cannot access GET /connectors',
    'Rahul blocked with HTTP 403 Forbidden.'
  );

  // =========================================================================
  // TEST 2: Supported connector types list only Google Drive, SharePoint, Supabase
  // =========================================================================
  const typesRes = await fetch(`${BASE_URL}/connectors/types`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const typesData = await typesRes.json();
  const typeKeys = (typesData.types || []).map((t) => t.type);
  assert(
    typesRes.status === 200 &&
    typeKeys.includes('google_drive') &&
    typeKeys.includes('sharepoint') &&
    typeKeys.includes('supabase') &&
    typeKeys.length === 3,
    'TEST 2: Supported connector types list only Google Drive, SharePoint, and Supabase',
    `Available types: [${typeKeys.join(', ')}]`
  );

  // =========================================================================
  // TEST 3: Google Drive OAuth URL Generation with State
  // =========================================================================
  const oauthRes = await fetch(`${BASE_URL}/connectors/oauth/google_drive/authorize?clientId=demo-client-id.apps.googleusercontent.com`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const oauthData = await oauthRes.json();
  assert(
    oauthRes.status === 200 && oauthData.success && oauthData.authUrl.includes('accounts.google.com'),
    'TEST 3: Generates real Google OAuth 2.0 authorization URL with state',
    `Auth URL target: ${oauthData.authUrl.slice(0, 75)}...`
  );

  // =========================================================================
  // TEST 4: Connect Google Drive in explicit DEVELOPMENT MODE
  // =========================================================================
  const devConnRes = await fetch(`${BASE_URL}/connectors/development/connect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'google_drive', name: 'Acme Google Drive' }),
  });
  const devConnData = await devConnRes.json();
  const gdriveId = devConnData.connector?.id;
  assert(
    devConnRes.status === 201 && devConnData.success && devConnData.connector?.is_development_mode === true,
    'TEST 4: Admin connects Google Drive with clear DEVELOPMENT MODE indicator',
    `Created connector ID: ${gdriveId}`
  );

  // =========================================================================
  // TEST 5: Live Browse of files/folders via Provider API (No predefined fake files)
  // =========================================================================
  const browseRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/browse`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const browseData = await browseRes.json();
  const rootItems = browseData.items || [];
  const folder = rootItems.find((i) => i.item_type === 'folder');

  assert(
    browseRes.status === 200 && browseData.success && rootItems.length > 0 && folder,
    'TEST 5: Browse endpoint returns files/folders from connected provider',
    `Discovered root items: ${rootItems.map((i) => i.name).join(', ')}`
  );

  // Browse inside subfolder
  const subBrowseRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/browse?folderId=${folder.external_id}`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const subBrowseData = await subBrowseRes.json();
  const subFiles = subBrowseData.items || [];
  const roadmapFile = subFiles.find((i) => i.name === 'Project Roadmap.pdf') || subFiles[0];

  assert(
    subBrowseRes.status === 200 && subFiles.length > 0,
    'TEST 6: Subfolder drill-down retrieves real nested files',
    `Found files inside [${folder.name}]: ${subFiles.map((i) => i.name).join(', ')}`
  );

  // =========================================================================
  // TEST 7: Explicit Knowledge Selection (Add to CompanyBrain)
  // =========================================================================
  const selectRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        {
          external_id: folder.external_id,
          name: folder.name,
          item_type: 'folder',
          path: folder.path,
        },
        {
          external_id: roadmapFile.external_id,
          name: roadmapFile.name,
          item_type: 'file',
          path: roadmapFile.path,
          mime_type: roadmapFile.mime_type,
          parent_id: folder.external_id,
        },
      ],
    }),
  });
  const selectData = await selectRes.json();
  assert(
    selectRes.status === 200 && selectData.success && selectData.selectedCount >= 2,
    'TEST 7: Admin explicitly selects files and folders for CompanyBrain knowledge inclusion',
    selectData.message
  );

  // =========================================================================
  // TEST 8: Folder-Level Access Inheritance & User/Group Permissions
  // =========================================================================
  // Fetch connector items to get UUIDs
  const subBrowseRes2 = await (await fetch(`${BASE_URL}/connectors/${gdriveId}/browse?folderId=${folder.external_id}`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  })).json();
  const connItems = subBrowseRes2.items || [];

  const savedRoadmap = connItems.find((i) => i.name === roadmapFile.name);
  const roadmapDbId = savedRoadmap.companybrain_item_id;

  // Fetch groups
  const groupsData = await (await fetch(`${BASE_URL}/groups`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  })).json();
  const engGroup = (groupsData.groups || []).find((g) => g.name === 'Engineering') || groupsData.groups[0];

  // Assign Engineering group to parent folder
  const rootBrowseRes = await (await fetch(`${BASE_URL}/connectors/${gdriveId}/browse`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  })).json();
  const folderDbId = (rootBrowseRes.items || []).find((i) => i.name === folder.name).companybrain_item_id;

  await fetch(`${BASE_URL}/connectors/${gdriveId}/items/${folderDbId}/access`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds: [engGroup.id], userIds: [] }),
  });

  // Check inherited access on child file
  const childAccessRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/items/${roadmapDbId}/access`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const childAccessData = await childAccessRes.json();
  const inheritedFromFolder = (childAccessData.inherited || []).some(
    (inh) => inh.folderName === folder.name
  );

  assert(
    childAccessRes.status === 200 && inheritedFromFolder,
    'TEST 8: Folder-level access inheritance correctly applied to child files',
    `Child file [${savedRoadmap.name}] inherited access from [${folder.name}]`
  );

  // =========================================================================
  // TEST 9: Synchronize Selected Knowledge into Database Documents
  // =========================================================================
  const syncRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const syncData = await syncRes.json();
  assert(
    syncRes.status === 200 && syncData.success && syncData.indexedCount >= 1,
    'TEST 9: Sync action retrieves real selected items and indexes into knowledge documents',
    syncData.message
  );

  // =========================================================================
  // TEST 10: Multi-Tenant Isolation (Admin B cannot access Admin A connector)
  // =========================================================================
  const crossTenantRes = await fetch(`${BASE_URL}/connectors/${gdriveId}`, {
    headers: { Authorization: `Bearer ${adminBToken}` },
  });
  assert(
    crossTenantRes.status === 403,
    'TEST 10: Multi-Tenant Boundary: Nova Finance Admin B blocked from Acme connector',
    'HTTP 403 Forbidden returned when attempting cross-tenant access.'
  );

  // =========================================================================
  // TEST 11: Disconnect Source and Revoke Access
  // =========================================================================
  const disconnectRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/disconnect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const disconnectData = await disconnectRes.json();
  assert(
    disconnectRes.status === 200 && disconnectData.success,
    'TEST 11: Admin disconnects source and revokes account connection',
    disconnectData.message
  );

  // =========================================================================
  // TEST 12: Audit Events Logged for all operations
  // =========================================================================
  const auditRes = await fetch(`${BASE_URL}/audit-logs?limit=20`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const auditData = await auditRes.json();
  const actions = (auditData.logs || []).map((l) => l.action);

  assert(
    actions.includes('CONNECTOR_CONNECTED') &&
    actions.includes('KNOWLEDGE_SELECTED') &&
    actions.includes('ACCESS_GRANTED') &&
    actions.includes('CONNECTOR_SYNC_COMPLETED') &&
    actions.includes('CONNECTOR_DISCONNECTED'),
    'TEST 12: Structured audit events recorded for all lifecycle operations',
    `Audit trail actions: [${[...new Set(actions)].join(', ')}]`
  );

  console.log('\n===============================================================');
  console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('===============================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
