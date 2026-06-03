// apps/server/test_owner_api.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';
let token = '';

async function test() {
  console.log('🚀 Starting Owner API Tests...');

  try {
    // 1. Login as OWNER
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'owner@jansystems.com',
      password: 'owner123'
    });
    token = loginRes.data.token;
    console.log('✅ Owner Login Successful');

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Check Briefing
    const bRes = await axios.get(`${BASE_URL}/owner/briefing`, authHeader);
    console.log('✅ Briefing Data:', bRes.data);
    if (bRes.data.todayRevenue === undefined) throw new Error('Briefing missing revenue');

    // 3. Check Revenue Trends
    const rRes = await axios.get(`${BASE_URL}/owner/revenue`, authHeader);
    console.log('✅ Revenue Analytics fetched');
    if (rRes.data.weeklyTrend.length !== 7) throw new Error('Trend should have 7 days');

    // 4. Check Margins
    const mRes = await axios.get(`${BASE_URL}/owner/margins`, authHeader);
    console.log('✅ Margin Analysis fetched');
    const macchiato = mRes.data.find(m => m.name.includes('Macchiato'));
    console.log(`✅ Macchiato Margin: ${macchiato.margin}%`);

    // 5. Check Settings
    const sRes = await axios.get(`${BASE_URL}/settings`);
    console.log('✅ Global Settings:', sRes.data);
    if (sRes.data.cafe_name !== 'Jan Systems') throw new Error('Setting cafe_name mismatch');

    console.log('🎉 ALL OWNER V4 TESTS PASSED!');
  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

test();
