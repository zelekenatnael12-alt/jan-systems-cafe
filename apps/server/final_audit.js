// apps/server/final_audit.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';
let token = '';

async function audit() {
  console.log('🛡️ Starting Final System Audit...');

  try {
    // 1. Backend Connectivity
    console.log('📡 Checking API connectivity...');
    const health = await axios.get(`${BASE_URL}/menu`);
    console.log(`✅ Menu items found: ${health.data.length}`);

    // 2. Owner Dashboard Data Integrity
    console.log('📊 Verifying Owner Analytics...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'owner@jansystems.com',
      password: 'owner123'
    });
    token = loginRes.data.token;
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const briefing = await axios.get(`${BASE_URL}/owner/briefing`, authHeader);
    console.log(`✅ Today's Revenue: ${briefing.data.todayRevenue} ETB`);
    console.log(`✅ Historical Comparison: ${briefing.data.comparison}%`);

    // 3. Inventory Atomicity Check
    console.log('📦 Testing Inventory Logic...');
    const invRes = await axios.get(`${BASE_URL}/inventory`, authHeader);
    const coffeeBefore = invRes.data.find(i => i.name.includes('Coffee'));
    console.log(`☕ Coffee Stock before order: ${coffeeBefore.amount}${coffeeBefore.unit}`);

    // 4. End-to-End Order Flow
    console.log('🛒 Simulating customer order...');
    const orderRes = await axios.post(`${BASE_URL}/orders`, {
      customer: 'Audit Bot',
      items: [{ productId: health.data[0].id, quantity: 1 }],
      total: health.data[0].price
    });
    const orderId = orderRes.data.id;
    console.log(`✅ Order ${orderId} created (NEW)`);

    // 5. Complete Order via Kitchen Logic (Using Admin for operational access)
    console.log('🍳 Completing order via Kitchen...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@jansystems.com',
      password: 'admin123'
    });
    const adminHeader = { headers: { Authorization: `Bearer ${adminLogin.data.token}` } };

    await axios.patch(`${BASE_URL}/orders/${orderId}/status`, 
      { status: 'PREPARING' }, adminHeader
    );
    await axios.patch(`${BASE_URL}/orders/${orderId}/status`, 
      { status: 'READY' }, adminHeader
    );
    await axios.patch(`${BASE_URL}/orders/${orderId}/status`, 
      { status: 'DONE', paymentMethod: 'TELEBIRR' }, adminHeader
    );
    console.log('✅ Order marked DONE with TELEBIRR');

    // 6. Verify Inventory Decrement
    const invResAfter = await axios.get(`${BASE_URL}/inventory`, authHeader);
    const coffeeAfter = invResAfter.data.find(i => i.name.includes('Coffee'));
    console.log(`☕ Coffee Stock after order: ${coffeeAfter.amount}${coffeeAfter.unit}`);
    
    if (coffeeAfter.amount < coffeeBefore.amount) {
      console.log('✅ Inventory auto-decrement verified.');
    } else {
      throw new Error('Inventory did not decrement!');
    }

    console.log('✨ ALL TECHNICAL AUDIT CHECKS PASSED!');
  } catch (error) {
    console.error('❌ Audit Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

audit();
