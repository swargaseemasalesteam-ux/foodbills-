const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + urlPath);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers
    };

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer,
          text: buffer.toString('utf8'),
          json: () => {
            try { return JSON.parse(buffer.toString('utf8')); }
            catch (e) { return null; }
          }
        });
      });
    });

    req.on('error', reject);
    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runVerification() {
  console.log('----------------------------------------------------');
  console.log('RUNNING AUTOMATED ENDPOINT VERIFICATION TESTS...');
  console.log('----------------------------------------------------');

  try {
    // 1. Health check
    console.log('1. Testing GET /api/health...');
    const health = await request('GET', '/health');
    console.log(`   Status: ${health.statusCode} | Body: ${health.text}`);
    if (health.statusCode !== 200) throw new Error('Health check failed');

    // 2. Admin Login
    console.log('\n2. Testing Admin Login (admin@company.com)...');
    const adminRes = await request('POST', '/auth/login', { 'Content-Type': 'application/json' }, {
      email: 'admin@company.com',
      password: 'admin123'
    });
    const adminData = adminRes.json();
    console.log(`   Status: ${adminRes.statusCode} | User: ${adminData?.name} (${adminData?.role})`);
    if (!adminData?.token) throw new Error('Admin login failed');
    const adminToken = adminData.token;

    // 3. Agent Login
    console.log('\n3. Testing Agent Login (lahari@company.com)...');
    const agentRes = await request('POST', '/auth/login', { 'Content-Type': 'application/json' }, {
      email: 'lahari@company.com',
      password: 'agent123'
    });
    const agentData = agentRes.json();
    console.log(`   Status: ${agentRes.statusCode} | Agent: ${agentData?.name}`);
    if (!agentData?.token) throw new Error('Agent login failed');
    const agentToken = agentData.token;

    // 4. Fetch Active Agents
    console.log('\n4. Fetching active agents list...');
    const agentsRes = await request('GET', '/agents?activeOnly=true', { Authorization: `Bearer ${agentToken}` });
    const agentsList = agentsRes.json();
    console.log(`   Status: ${agentsRes.statusCode} | Active Agents Count: ${agentsList.length}`);
    if (!agentsList || agentsList.length === 0) throw new Error('No agents found');
    const targetAgent = agentsList[0];

    // 5. Submit Food Bill (Multipart Form Data)
    console.log(`\n5. Submitting food bill for agent ${targetAgent.name}...`);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Create dummy 1x1 PNG image buffer
    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    
    const fields = {
      agentId: targetAgent._id,
      date: new Date().toISOString().split('T')[0],
      foodType: 'Dinner',
      amount: '350.50',
      paymentMethod: 'UPI',
      remarks: 'Automated test dinner bill'
    };

    let bodyPayload = Buffer.alloc(0);
    for (const [key, val] of Object.entries(fields)) {
      bodyPayload = Buffer.concat([
        bodyPayload,
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`)
      ]);
    }

    // Add screenshot file chunk
    bodyPayload = Buffer.concat([
      bodyPayload,
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="screenshot"; filename="test-receipt.png"\r\nContent-Type: image/png\r\n\r\n`),
      dummyPng,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const submitRes = await request('POST', '/bills', {
      Authorization: `Bearer ${agentToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    }, bodyPayload);

    const submitData = submitRes.json();
    console.log(`   Status: ${submitRes.statusCode} | Bill ID: ${submitData?.bill?.billId} | Amount: ₹${submitData?.bill?.amount}`);
    if (submitRes.statusCode !== 201) throw new Error('Bill submission failed: ' + submitRes.text);
    const createdBillId = submitData.bill._id;

    // 6. Duplicate Submission Test
    console.log('\n6. Testing Duplicate Submission Prevention...');
    const dupRes = await request('POST', '/bills', {
      Authorization: `Bearer ${agentToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    }, bodyPayload);
    console.log(`   Status: ${dupRes.statusCode} | Message: ${dupRes.json()?.message}`);
    if (dupRes.statusCode !== 409) throw new Error('Duplicate prevention failed to return 409 Conflict');

    // 7. Admin Approval Test
    console.log(`\n7. Admin Approving Bill ID ${submitData?.bill?.billId}...`);
    const approveRes = await request('PATCH', `/bills/${createdBillId}/status`, {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }, { status: 'Approved' });
    console.log(`   Status: ${approveRes.statusCode} | New Status: ${approveRes.json()?.bill?.status}`);
    if (approveRes.json()?.bill?.status !== 'Approved') throw new Error('Bill approval failed');

    // 8. Admin 15-Day Report Data
    console.log('\n8. Fetching 15-Day Report JSON Summary...');
    const reportRes = await request('GET', '/reports/15-day?periodPreset=Period1', {
      Authorization: `Bearer ${adminToken}`
    });
    const reportData = reportRes.json();
    console.log(`   Status: ${reportRes.statusCode} | Total Amount: ₹${reportData?.summary?.totalAmount} | Bills Count: ${reportData?.summary?.totalBills}`);

    // 9. Download Excel Report
    console.log('\n9. Testing Excel Export Download...');
    const excelRes = await request('GET', '/reports/excel?periodPreset=Period1', {
      Authorization: `Bearer ${adminToken}`
    });
    console.log(`   Status: ${excelRes.statusCode} | Content-Type: ${excelRes.headers['content-type']} | Bytes: ${excelRes.buffer.length}`);
    if (excelRes.statusCode !== 200 || !excelRes.headers['content-type']?.includes('spreadsheet')) {
      throw new Error('Excel report download failed');
    }

    // 10. Download Screenshot PDF Report (2x3 grid)
    console.log('\n10. Testing Screenshot PDF Report Download (2x3 Grid)...');
    const pdfRes = await request('GET', '/reports/screenshot-pdf?periodPreset=Period1', {
      Authorization: `Bearer ${adminToken}`
    });
    console.log(`   Status: ${pdfRes.statusCode} | Content-Type: ${pdfRes.headers['content-type']} | Bytes: ${pdfRes.buffer.length}`);
    const pdfHeader = pdfRes.buffer.slice(0, 5).toString('utf8');
    console.log(`   PDF Magic Header: ${pdfHeader}`);
    if (pdfRes.statusCode !== 200 || pdfHeader !== '%PDF-') {
      throw new Error('Screenshot PDF report generation failed');
    }

    console.log('\n====================================================');
    console.log('ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\nVERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runVerification();
