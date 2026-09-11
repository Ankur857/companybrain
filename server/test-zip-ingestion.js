import 'dotenv/config';
import JSZip from 'jszip';

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runZipIngestionTest() {
  console.log('\n======================================================');
  console.log('   COMPANYBRAIN GITHUB ZIP CODEBASE INGESTION TEST');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // 1. Authenticate as Admin
  console.log('1. Authenticating as Company Admin...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@acme.com', password: 'Password123!' })
  });
  assert(loginRes.status === 200 && loginRes.data.token, 'Company Admin logged in successfully');
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Fetch Projects and select or create a project
  console.log('\n2. Fetching project for codebase attachment...');
  const projRes = await request('/projects', { headers: authHeaders });
  assert(projRes.status === 200 && projRes.data.projects?.length > 0, 'Found existing projects');
  const project = projRes.data.projects[0];
  console.log(`   Target Project: "${project.name}" (ID: ${project.id})`);

  // 3. Construct an in-memory repository zip archive simulating a GitHub download
  console.log('\n3. Synthesizing in-memory GitHub repository ZIP archive...');
  const zip = new JSZip();
  const repoFolder = zip.folder('ecommerce-microservice-main');

  // Architecture & Readme
  repoFolder.file('README.md', `# E-Commerce Payment & Order Microservice
This repository manages real-time orders, payment gateway webhooks, and invoice generation.
Built with Node.js, Express, and Prisma ORM.

## Architecture
- \`src/routes/orderRoutes.js\`: REST endpoints for cart checkout and order statuses.
- \`src/routes/paymentRoutes.js\`: Stripe and Razorpay webhook integrations.
- \`prisma/schema.prisma\`: Data definitions for Orders and Transactions.`);

  // Package manifest
  repoFolder.file('package.json', JSON.stringify({
    name: 'ecommerce-microservice',
    version: '2.4.0',
    scripts: {
      start: 'node src/index.js',
      test: 'jest --coverage',
      db_migrate: 'prisma migrate deploy'
    },
    dependencies: {
      express: '^4.19.2',
      prisma: '^5.14.0',
      stripe: '^15.0.0',
      jsonwebtoken: '^9.0.2'
    }
  }, null, 2));

  // Database Schema
  repoFolder.file('prisma/schema.prisma', `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model CustomerOrder {
  id           String      @id @default(uuid())
  customerEmail String
  totalAmount  Decimal     @db.Decimal(10, 2)
  currency     String      @default("USD")
  orderStatus  String      @default("PENDING") // PENDING, PAID, CANCELLED
  items        OrderItem[]
  createdAt    DateTime    @default(now())
}

model OrderItem {
  id        String        @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  unitPrice Decimal       @db.Decimal(10, 2)
  order     CustomerOrder @relation(fields: [orderId], references: [id])
}

model PaymentTransaction {
  id            String   @id @default(uuid())
  orderId       String
  processor     String   // STRIPE, RAZORPAY
  transactionRef String  @unique
  settledAmount Decimal  @db.Decimal(10, 2)
  status        String   @default("SUCCEEDED")
}`);

  // API Routes
  repoFolder.file('src/routes/orderRoutes.js', `const express = require('express');
const router = express.Router();

/**
 * POST /api/v1/orders/checkout
 * Validates inventory and creates a CustomerOrder record in PENDING state.
 */
router.post('/checkout', async (req, res) => {
  res.json({ message: 'Order created', orderId: 'ord_12345' });
});

/**
 * GET /api/v1/orders/:orderId/track
 * Retrieves shipping and delivery tracking updates.
 */
router.get('/:orderId/track', async (req, res) => {
  res.json({ orderId: req.params.orderId, status: 'IN_TRANSIT' });
});

module.exports = router;`);

  // JUNK FILES THAT MUST BE FILTERED OUT
  repoFolder.file('node_modules/fake-dep/index.js', 'console.log("SHOULD BE IGNORED BY FILTER");');
  repoFolder.file('.git/HEAD', 'ref: refs/heads/main');
  repoFolder.file('dist/bundle.min.js', '/* MINIFIED COMPILED CODE SHOULD BE IGNORED */');
  repoFolder.file('assets/banner.png', Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const base64Zip = zipBuffer.toString('base64');
  console.log(`   Generated ZIP archive of size: ${zipBuffer.length} bytes (${(zipBuffer.length / 1024).toFixed(2)} KB)`);

  // 4. Ingest Codebase ZIP via API
  console.log('\n4. Ingesting codebase ZIP via POST /api/projects/:id/upload-zip...');
  const uploadRes = await request(`/projects/${project.id}/upload-zip`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      zipData: base64Zip,
      repositoryName: 'ecommerce-microservice-main',
      classification: 'Internal'
    })
  });

  assert(uploadRes.status === 201, `Upload endpoint returned HTTP 201 (got ${uploadRes.status})`);
  assert(uploadRes.data.success === true, 'Response indicates success');
  assert(uploadRes.data.files_ingested >= 4, `Ingested ${uploadRes.data.files_ingested} files (expected >= 4)`);
  assert(uploadRes.data.manifest_id, 'Repository Architecture Manifest created');

  console.log('   Category Breakdown:');
  console.log('   ', JSON.stringify(uploadRes.data.category_breakdown, null, 2));

  // 5. Verify Documents are attached to project_knowledge
  console.log('\n5. Verifying project knowledge sources...');
  const knowRes = await request(`/projects/${project.id}/knowledge`, { headers: authHeaders });
  assert(knowRes.status === 200, 'Project knowledge retrieved');
  const attachedTitles = (knowRes.data.knowledge || []).map(k => k.title || k.document?.title);
  assert(attachedTitles.some(t => t?.includes('README.md')), 'README.md linked to project');
  assert(attachedTitles.some(t => t?.includes('schema.prisma')), 'Prisma schema linked to project');
  assert(attachedTitles.some(t => t?.includes('orderRoutes.js')), 'orderRoutes.js linked to project');
  assert(attachedTitles.some(t => t?.includes('Architecture & Repository Manifest') || t?.includes('Manifest')), 'Architecture & Repository Manifest linked to project');
  assert(!attachedTitles.some(t => t?.includes('node_modules')), 'node_modules properly filtered out');
  assert(!attachedTitles.some(t => t?.includes('bundle.min.js')), 'dist/ minified files properly filtered out');

  // 6. Test Project Intelligence RAG with Google Gemini
  console.log('\n6. Testing Project Intelligence Q&A with Google Gemini (gemini-3.6-flash)...');
  console.log('   Query 1: Asking about database schema models...');
  const query1Res = await request(`/projects/${project.id}/query`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      query: 'What database models are defined in the schema and what are their fields?'
    })
  });

  assert(query1Res.status === 200, 'Query 1 returned HTTP 200');
  console.log('   Gemini Response 1:\n  ', query1Res.data.answer.replace(/\n/g, '\n   '));
  assert(
    query1Res.data.answer.includes('CustomerOrder') || query1Res.data.answer.includes('PaymentTransaction'),
    'AI synthesized answer correctly identifies models from extracted schema.prisma'
  );

  console.log('\n   Query 2: Asking about available API endpoints...');
  const query2Res = await request(`/projects/${project.id}/query`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      query: 'What API routes are defined in orderRoutes.js for orders?'
    })
  });

  assert(query2Res.status === 200, 'Query 2 returned HTTP 200');
  console.log('   Gemini Response 2:\n  ', query2Res.data.answer.replace(/\n/g, '\n   '));
  assert(
    query2Res.data.answer.includes('/checkout') || query2Res.data.answer.includes('/track'),
    'AI synthesized answer correctly identifies API endpoints from extracted orderRoutes.js'
  );

  console.log('\n======================================================');
  console.log(`   TEST RESULT: ${passed} / ${total} ASSERTS PASSED (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('======================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runZipIngestionTest().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
