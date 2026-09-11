const BASE_URL = 'http://localhost:5000/api';

async function verify() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'Password123!' })
  });
  const { token } = await loginRes.json();

  const knowRes = await fetch(`${BASE_URL}/projects/p1111111-0000-0000-0000-000000000001/knowledge`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await knowRes.json();

  console.log('Project Alpha Knowledge items count:', data.knowledge?.length);
  console.log('Sample titles:');
  (data.knowledge || []).slice(0, 8).forEach(k => {
    console.log(` - ${k.title} (canAccess: ${k.canAccess})`);
  });
}

verify().catch(console.error);
