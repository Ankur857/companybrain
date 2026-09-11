const BASE_URL = 'http://localhost:5000/api';

async function check() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'Password123!' })
  });
  const { token } = await loginRes.json();

  const docsRes = await fetch(`${BASE_URL}/documents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { documents } = await docsRes.json();
  const cbDocs = (documents || []).filter(d => d.title?.includes('[companybrain]'));
  console.log(`Found ${cbDocs.length} documents with [companybrain]`);
  if (cbDocs.length > 0) {
    console.log('Sample cbDoc project value:', cbDocs[0].project, 'department:', cbDocs[0].department);
  }
}

check().catch(console.error);
