async function testEndpoints() {
  console.log('Testing frontend and backend integration:');
  
  // 1. Vite frontend index
  try {
    const resVite = await fetch('http://localhost:5173/');
    console.log('1. Frontend HTTP Status:', resVite.status, resVite.statusText);
    const html = await resVite.text();
    console.log('   HTML length:', html.length, 'Contains title:', html.includes('Shopee Ads Marketing Dashboard'));
  } catch (e) {
    console.error('1. Frontend Error:', e.message);
  }

  // 2. Proxied Store Info
  try {
    const resStore = await fetch('http://localhost:5173/api/store/info');
    const store = await resStore.json();
    console.log('2. Proxied Store Info:', store.shopName, 'ID:', store.shopId, 'Connected:', store.isConnected);
  } catch (e) {
    console.error('2. Store Info Error:', e.message);
  }

  // 3. Proxied Time Graph
  try {
    const resTg = await fetch('http://localhost:5173/api/ads/time-graph');
    const tg = await resTg.json();
    console.log('3. Proxied Time Graph Total Cost:', tg.summary.totalCost, 'Broad GMV:', tg.summary.totalBroadGmv, 'ROAS:', tg.summary.roas.toFixed(2), 'Data points:', tg.timeSeries.length);
  } catch (e) {
    console.error('3. Time Graph Error:', e.message);
  }

  // 4. Proxied Campaigns
  try {
    const resCamp = await fetch('http://localhost:5173/api/ads/campaigns');
    const camp = await resCamp.json();
    console.log('4. Proxied Campaigns Total:', camp.total, 'Ongoing:', camp.counts.ongoing, 'Paused:', camp.counts.paused, 'Sample title:', camp.campaigns[0]?.title);
  } catch (e) {
    console.error('4. Campaigns Error:', e.message);
  }
}

testEndpoints();
