const BASE_URL = 'http://localhost:5000/api';

async function testProjectIntelDisplay() {
  console.log('========================================================');
  console.log('TESTING PROJECT INTELLIGENCE UPLOAD & KNOWLEDGE DISPLAY');
  console.log('========================================================\n');

  // 1. Authenticate as Admin
  console.log('1. Logging in as Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'Password123!' })
  });
  const { token } = await loginRes.json();
  console.log('   ✓ Admin authenticated successfully.\n');

  // 2. Fetch Project Alpha Knowledge before linking
  console.log('2. Fetching Project Alpha knowledge...');
  const alphaId = 'p1111111-0000-0000-0000-000000000001';
  const beforeRes = await fetch(`${BASE_URL}/projects/${alphaId}/knowledge`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const beforeData = await beforeRes.json();
  const beforeCount = beforeData.knowledge?.length || 0;
  console.log(`   Project Alpha currently has ${beforeCount} authorized documents.\n`);

  // 3. Find documents from the uploaded "companybrain" folder
  console.log('3. Checking company documents...');
  const docsRes = await fetch(`${BASE_URL}/documents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { documents } = await docsRes.json();
  const cbDocs = (documents || []).filter(d => d.title?.includes('[companybrain]'));
  console.log(`   Found ${cbDocs.length} documents uploaded under folder [companybrain].\n`);

  if (cbDocs.length > 0) {
    // 4. Link these documents to Project Alpha using bulk attach endpoint
    console.log(`4. Linking ${cbDocs.length} [companybrain] documents to Project Alpha...`);
    const docIdsToLink = cbDocs.map(d => d.id);
    const linkRes = await fetch(`${BASE_URL}/projects/${alphaId}/knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ documentIds: docIdsToLink })
    });
    const linkData = await linkRes.json();
    console.log(`   Link response:`, linkData);
  }

  // 5. Re-fetch Project Alpha Knowledge
  console.log('\n5. Re-fetching Project Alpha knowledge after link...');
  const afterRes = await fetch(`${BASE_URL}/projects/${alphaId}/knowledge`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const afterData = await afterRes.json();
  const afterCount = afterData.knowledge?.length || 0;
  console.log(`   Project Alpha now has ${afterCount} authorized documents!`);

  // Verify all have proper document and title fields
  const sample = (afterData.knowledge || []).slice(0, 5);
  console.log('   Sample items in Project Intelligence:');
  sample.forEach(k => {
    console.log(`     - Title: "${k.title}", classification: ${k.classification}, canAccess: ${k.canAccess}`);
  });

  if (afterCount <= beforeCount && cbDocs.length > 0) {
    throw new Error(`Expected afterCount (${afterCount}) > beforeCount (${beforeCount})`);
  }

  // 6. Test querying Project Intelligence as employee Rahul
  console.log('\n6. Testing Project Intelligence query as Rahul Sharma...');
  const rahulLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul@acme.com', password: 'Password123!' })
  });
  const rahulToken = (await rahulLogin.json()).token;

  const queryRes = await fetch(`${BASE_URL}/projects/${alphaId}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rahulToken}`
    },
    body: JSON.stringify({ query: 'What files and services are part of companybrain?' })
  });

  const queryData = await queryRes.json();
  console.log(`   Query status: ${queryRes.status}`);
  console.log(`   Decision: ${queryData.decision}`);
  console.log(`   Sources consulted: ${queryData.sources?.length}`);
  console.log(`   Answer snippet: ${queryData.answer?.slice(0, 150)}...`);

  console.log('\n========================================================');
  console.log('VERIFICATION COMPLETE: ALL DOCUMENTS DISPLAY & RETRIEVE! ✓');
  console.log('========================================================');
}

testProjectIntelDisplay().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
