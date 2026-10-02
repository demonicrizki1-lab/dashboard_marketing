const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync('./server/config.json', 'utf8'));

async function testCampaignQueryDates() {
  const url = `https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=${config.spcCds}&SPC_CDS_VER=${config.spcCdsVer || '2'}`;
  
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/json;charset=UTF-8',
    'cookie': config.cookie,
    'origin': 'https://seller.shopee.co.id',
    'referer': 'https://seller.shopee.co.id/portal/marketing/pas',
    'sc-fe-session': config.scFeSession || 'C62425B4417CEC63',
    'sc-fe-ver': config.scFeVer || '21.167990',
    'user-agent': config.userAgent,
    'af-ac-enc-dat': config.afAcEncDat || '',
    'af-ac-enc-sz-token': config.afAcEncSzToken || ''
  };

  // 7 hari terakhir: 26 Sept 2026 to 2 Okt 2026
  const start7d = 1790355600; 
  const end7d = 1790960399;

  const payload = {
    start_time: start7d,
    end_time: end7d,
    filter_list: [{ campaign_type: "product_homepage_v3", state: "all", search_term: "", is_valid_rebate_only: false }],
    offset: 0,
    limit: 5,
    use_paid_gmv: false
  };

  console.log('Testing Shopee homepage/query for 7 days range...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    console.log('HTTP Status:', res.status);
    const json = await res.json();
    console.log('Shopee code:', json.code, 'msg:', json.msg);
    if (json.data && json.data.entry_list) {
      console.log('Campaigns count:', json.data.entry_list.length);
      const first = json.data.entry_list[0];
      console.log('Sample #1 Title:', first.title);
      console.log('Sample #1 7d Cost:', (first.report?.cost || 0) / 100000, 'GMV:', (first.report?.broad_gmv || 0) / 100000);
    } else {
      console.log('Error details:', json);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testCampaignQueryDates();
