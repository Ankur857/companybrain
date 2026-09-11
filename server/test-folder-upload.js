/**
 * Automated Verification Script: Supabase Knowledge Folder Upload & Bulk Ingestion
 */

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  console.log('====================================================');
  console.log('RUNNING FOLDER UPLOAD & BULK INGESTION VERIFICATION');
  console.log('====================================================\n');

  // 1. Authenticate as Company Admin
  console.log('1. Authenticating as Company Admin (admin@acme.com)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'Password123!' })
  });

  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
  }
  console.log('   ✓ Admin authenticated successfully.\n');

  // 2. Perform Folder Upload with simulated nested files
  console.log('2. Ingesting folder with 4 simulated documents (PDF, DOCX, MD, JS)...');
  const folderPayload = {
    folderName: 'Architecture_Docs_v2',
    department: 'Engineering',
    project: 'Project Alpha',
    classification: 'INTERNAL',
    required_groups: [],
    allowed_user_ids: [],
    files: [
      {
        fileName: 'system-overview.pdf',
        relativePath: 'Architecture_Docs_v2/docs/system-overview.pdf',
        fileType: 'application/pdf',
        sizeBytes: 8192,
        content: '[Enterprise Document: system-overview.pdf] (8.0 KB) Architecture overview for Project Alpha services, gateways, and auth policies.'
      },
      {
        fileName: 'data-flow-spec.docx',
        relativePath: 'Architecture_Docs_v2/specs/data-flow-spec.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 12288,
        content: '[Enterprise Document: data-flow-spec.docx] (12.0 KB) Data pipeline streaming, Kafka consumers, and PostgreSQL Supabase schema.'
      },
      {
        fileName: 'README.md',
        relativePath: 'Architecture_Docs_v2/README.md',
        fileType: 'text/markdown',
        sizeBytes: 1540,
        content: '# Architecture Docs\nThis directory holds enterprise specifications for Project Alpha engineering onboarding.'
      },
      {
        fileName: 'authService.js',
        relativePath: 'Architecture_Docs_v2/code/authService.js',
        fileType: 'text/javascript',
        sizeBytes: 2048,
        content: 'export function verifyToken(token) { return jwt.verify(token, secret); }'
      }
    ]
  };

  const uploadRes = await fetch(`${BASE_URL}/connectors/supabase/upload-folder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(folderPayload)
  });

  const uploadData = await uploadRes.json();
  console.log(`   Response status: ${uploadRes.status}`);
  console.log(`   Uploaded count: ${uploadData?.count}`);
  console.log(`   Message: ${uploadData?.message}`);

  if (uploadRes.status !== 201 || uploadData?.count !== 4) {
    throw new Error(`Folder upload failed: ${JSON.stringify(uploadData)}`);
  }
  console.log('   ✓ Folder upload succeeded with 4 files.\n');

  // 3. Verify Documents in knowledge base
  console.log('3. Verifying uploaded documents in Knowledge Base...');
  const docsRes = await fetch(`${BASE_URL}/documents`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const docsData = await docsRes.json();
  const docs = docsData?.documents || docsData?.data || [];
  const uploadedFiles = docs.filter(d => d.title && d.title.includes('[Architecture_Docs_v2]'));
  console.log(`   Found ${uploadedFiles.length} documents matching folder [Architecture_Docs_v2]`);
  uploadedFiles.forEach(d => {
    console.log(`     - ${d.title} (Type: ${d.file_type}, Dept: ${d.department}, Project: ${d.project})`);
  });

  if (uploadedFiles.length < 4) {
    throw new Error(`Expected at least 4 documents, got ${uploadedFiles.length}`);
  }
  console.log('   ✓ All folder documents successfully stored and queryable in database.\n');

  // 4. Verify RBAC / Non-admin protection
  console.log('4. Verifying RBAC protection for /connectors/supabase/upload-folder...');
  const employeeLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul@acme.com', password: 'Password123!' })
  });
  const employeeData = await employeeLogin.json();
  const employeeToken = employeeData.token;

  const unauthorizedRes = await fetch(`${BASE_URL}/connectors/supabase/upload-folder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${employeeToken}`
    },
    body: JSON.stringify(folderPayload)
  });

  console.log(`   Employee attempt status code: ${unauthorizedRes.status}`);
  if (unauthorizedRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for employee upload, got ${unauthorizedRes.status}`);
  }
  console.log('   ✓ RBAC enforced: Only administrators can execute folder uploads.\n');

  console.log('====================================================');
  console.log('ALL FOLDER UPLOAD TESTS PASSED SUCCESSFULLY! ✓✓✓');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
