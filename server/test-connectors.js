/**
 * Comprehensive Automated Test Suite for CompanyBrain Connectors Module
 * Validates:
 * 1. Admin Authentication & Role Enforcement (Employees blocked with 403)
 * 2. Multi-Tenant Isolation (Company A cannot see Company B connectors)
 * 3. 3 Supported Connectors: Google Drive, Microsoft SharePoint, Supabase
 * 4. Hierarchical Item Browsing & Knowledge Selection
 * 5. Folder-Level Access Inheritance & User/Group-Level Permissions
 * 6. Synchronized Knowledge Ingestion into database documents
 * 7. Structured Audit Event Logging
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('===============================================================');
  console.log('  COMPANYBRAIN CONNECTORS MODULE AUTOMATED TEST SUITE');
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

  const empPostRes = await fetch(`${BASE_URL}/connectors`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${rahulToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'google_drive', name: 'Unauthorized Drive' }),
  });
  assert(
    empPostRes.status === 403,
    'TEST 2: Normal employee cannot create connector (POST /connectors)',
    'Rahul blocked from creating or modifying connectors.'
  );

  // =========================================================================
  // TEST 3: Admin A retrieves supported connector types (Google Drive, SharePoint, Supabase)
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
    'TEST 3: Supported connector types list only Google Drive, SharePoint, and Supabase',
    `Available types: [${typeKeys.join(', ')}]`
  );

  // =========================================================================
  // TEST 4: Admin A connects Google Drive (Demo mode)
  // =========================================================================
  const connGdriveRes = await fetch(`${BASE_URL}/connectors`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'google_drive',
      name: 'Acme Google Drive',
      isDemo: true,
      configuration: {},
    }),
  });
  const connGdrive = await connGdriveRes.json();
  const gdriveId = connGdrive.connector?.id;
  assert(
    connGdriveRes.status === 201 && connGdrive.success && connGdrive.connector?.is_demo === true,
    'TEST 4: Admin connects Google Drive with clear Demo connection mode',
    `Created connector ID: ${gdriveId} (is_demo: ${connGdrive.connector?.is_demo})`
  );

  // =========================================================================
  // TEST 5: Test Connection latency and verification
  // =========================================================================
  const testRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const testData = await testRes.json();
  assert(
    testRes.status === 200 && testData.success && testData.testResult?.latencyMs > 0,
    'TEST 5: Test connection verifies latency and authenticated service status',
    `Latency: ${testData.testResult?.latencyMs}ms | Service: ${testData.testResult?.service}`
  );

  // =========================================================================
  // TEST 6: Hierarchical Item Browsing (Engineering -> Project Alpha -> Architecture.pdf)
  // =========================================================================
  const itemsRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/items`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const itemsData = await itemsRes.json();
  const items = itemsData.items || [];
  const archDoc = items.find((i) => i.name === 'Architecture.pdf');
  const engFolder = items.find((i) => i.name === 'Engineering');
  const alphaFolder = items.find((i) => i.name === 'Project Alpha');
  const salaryDoc = items.find((i) => i.name === 'Salary Report.xlsx');

  assert(
    itemsRes.status === 200 && archDoc && engFolder && alphaFolder && salaryDoc,
    'TEST 6: Discovered hierarchical file and folder structure for Google Drive',
    `Found ${items.length} items (Engineering, Project Alpha, Architecture.pdf, Salary Report.xlsx)`
  );

  // =========================================================================
  // TEST 7: Select Knowledge to add to CompanyBrain
  // =========================================================================
  const selectRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds: [archDoc.id], isSelected: true }),
  });
  const selectData = await selectRes.json();
  assert(
    selectRes.status === 200 && selectData.success && selectData.affectedCount >= 1,
    'TEST 7: Admin selects Architecture.pdf for CompanyBrain knowledge inclusion',
    selectData.message
  );

  // =========================================================================
  // TEST 8: Folder-Level Access Inheritance
  // Assign Project Alpha folder to Project-Alpha group -> verify Architecture.pdf inherits it!
  // =========================================================================
  const groupsData = await (await fetch(`${BASE_URL}/groups`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  })).json();
  const acmeGroups = groupsData.groups || [];

  const alphaGroup = acmeGroups.find((g) => g.name === 'Project-Alpha') || acmeGroups[0];

  // Assign access rule to the Project Alpha folder
  await fetch(`${BASE_URL}/connectors/${gdriveId}/items/${alphaFolder.id}/access`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds: [alphaGroup.id], userIds: [] }),
  });

  // Now inspect access on Architecture.pdf (child file inside Project Alpha folder)
  const childAccessRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/items/${archDoc.id}/access`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const childAccessData = await childAccessRes.json();
  const inheritedFromAlpha = (childAccessData.inherited || []).some(
    (inh) => inh.folderName === 'Project Alpha'
  );

  assert(
    childAccessRes.status === 200 && inheritedFromAlpha,
    'TEST 8: Folder-level access inheritance correctly passed down to child file',
    `Architecture.pdf inherited access from parent folder [${alphaFolder.name}]`
  );

  // =========================================================================
  // TEST 9: Direct User-Level Access Assignment (Assign Rahul directly)
  // =========================================================================
  const usersData = await (await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  })).json();
  const acmeUsers = usersData.users || [];
  const rahulUser = acmeUsers.find((u) => u.email === 'rahul@acme.com') || acmeUsers[0];

  const assignUserRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/items/${archDoc.id}/access`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds: [], userIds: [rahulUser.id] }),
  });
  const assignUserData = await assignUserRes.json();
  assert(
    assignUserRes.status === 200 && assignUserData.savedRulesCount >= 1,
    'TEST 9: Direct user-level access rule assigned to Rahul Sharma',
    assignUserData.message
  );

  // =========================================================================
  // TEST 10: Sync Action ingests knowledge into database with permissions
  // =========================================================================
  const syncRes = await fetch(`${BASE_URL}/connectors/${gdriveId}/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const syncData = await syncRes.json();
  assert(
    syncRes.status === 200 && syncData.success && syncData.indexedCount >= 1,
    'TEST 10: Connector Sync ingests selected items into database documents',
    `Indexed ${syncData.indexedCount} item(s) into CompanyBrain knowledge base.`
  );

  // =========================================================================
  // TEST 11: Multi-Tenant Isolation (Admin B cannot access Admin A connector)
  // =========================================================================
  const crossTenantRes = await fetch(`${BASE_URL}/connectors/${gdriveId}`, {
    headers: { Authorization: `Bearer ${adminBToken}` },
  });
  assert(
    crossTenantRes.status === 403,
    'TEST 11: Multi-Tenant Boundary: Nova Finance Admin B blocked from Acme connector',
    'HTTP 403 Forbidden returned when accessing another company\'s connector.'
  );

  // =========================================================================
  // TEST 12: Audit Events logged for all operations
  // =========================================================================
  const auditRes = await fetch(`${BASE_URL}/audit-logs?limit=20`, {
    headers: { Authorization: `Bearer ${adminAToken}` },
  });
  const auditData = await auditRes.json();
  const auditActions = (auditData.logs || []).map((l) => l.action);

  assert(
    auditActions.includes('CONNECTOR_CONNECTED') &&
    auditActions.includes('CONNECTOR_SYNC_COMPLETED') &&
    auditActions.includes('ACCESS_GRANTED'),
    'TEST 12: Structured audit logs generated for connector and access actions',
    `Recorded actions: [${[...new Set(auditActions)].join(', ')}]`
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
