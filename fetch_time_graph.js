/**
 * Script untuk Menarik Data Time Graph Iklan Shopee (PAS Report)
 * File: fetch_time_graph.js
 * 
 * Cara Menjalankan:
 *   node fetch_time_graph.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. KONFIGURASI KREDENSIAL & TOKEN
// ============================================================================
// Catatan: Jika request menghasilkan 403 atau error 90309999, perbarui nilai
// af-ac-enc-dat, af-ac-enc-sz-token, dan cookie dari DevTools (F12 -> Network).
const CONFIG = {
  spcCds: 'd14c53a6-27f9-4847-a7f7-e25587ee4580',
  spcCdsVer: '2',
  afAcEncDat: '5dda71640de40d16',
  afAcEncSzToken: 'QWDT83Sze3INcI1Lmz78hA==|JaQn3suKYxium6LeY1QM0ouwIYNki7SQG6dOJOVjo7SMwiJrPPoYRqGWkUlnTHS+//q3/cJp7UMocmTL0gkVLPDO|CS1AiHZBplwy5o+P|08|3',
  scFeSession: 'C62425B4417CEC63',
  scFeVer: '21.167990',
  cookie: `SPC_CDS=d14c53a6-27f9-4847-a7f7-e25587ee4580; SPC_SC_SA_TK=; SPC_SC_SA_UD=; SPC_SC_OFFLINE_TOKEN=; SC_SSO=-; SC_SSO_U=-; SPC_SEC_SI=v1-eXgwM3lVUzFHa0hZSk45QTHCMkLbtaSSME6JNvgCXLlO2V+asMTDqMqw2MGJe0J0c6abTBD12pZRhuIY2mFDdooyrhUey4ZXP5E4Qe8dCBs=; SPC_SI=gOC5agAAAAByNFNSaU9Hd11IVAUAAAAAWGpNMHlqSEQ=; csrftoken=Cjmh9t0SNRPL4zEj8oWlAyWuD5svS4tJ; _gcl_au=1.1.1171054823.1790927939; SPC_F=z2Vl5q08gLVH0qRWQhErt5a388evxrfk; REC_T_ID=22737401-be37-11f1-9fbd-2672af6ba215; SPC_SI=brGsagAAAABlRW42b1hYV2/jvgEAAAAAZDdzZWxtbTI=; _fbp=fb.2.1790927941500.999019524951092819; language=id; SPC_CLIENTID=ejJWbDVxMDhnTFZIsxgellqxmegkhdkn; sense_sa_r=s; SPC_ST=QAVfyy3ijCt3UBD6SJzuvbVgUEAvX+OnSRaGJZrqPcCnGpemaUH58wKRg2ii8qqoQaQ4Mo3/X9rxwaGXAUa6y6dcn+wYGGZnLCtwtu9L+d3+yREVqwfn9c746HfgAXagBLlxJcCVSvaNATlmoxGhyeeZdGPdcgsuzZf/x6mlx2eVg20mGQxHQI9Sv1b62AKBZaKkyfR4a/TW+v9tFrld4Xva59nIvJE7mwu3BlasPN8=.ABZtYO/ij/SMDo+2hJA/RWVuZQhb57ya/ON2qulmKSwv; SPC_U=1576092179; SPC_SC_SESSION=gHediPi6UyEaJGcp1UqYfQs11zyW04P1wioDm94Ik69aCDspZqWFGQyBNPaEhjTr2HCKWB2PPAbqy1ZSNXSGsZE8STVpAWqbJ50ApPsVzJ0blICZQqneRtPp0+ae9U14r/T5ijy1QYwY37XqaVBuGGUL+zpjwoNqPzQdpTp/dKAvB4aDeTVWGCv7f9oW/jeTFesbLY8Li07J+Gxa66EC2UVtSNxn+pdyJDWzYFc9L7zVbo1UOrx3u1SUD+RJovqzNHNO+XVPqL4MFybCGE+HTNw==_1_1576092179; SPC_SC_MAIN_SHOP_SA_UD=0; SPC_STK=YgbR6p1SlQHkGfAGSHeaQmQNtKd9v3VGFrXUlyyV6+k7bqWf11BBTP3kEnve8USzKoyo1gIEkGjvO75ZCyiq2SM4NLZ7F03eankUjg44vG/Xnzty8aSFfZE6xAU3J0WTrsY7UEJqISXXidg2bKfhM9BOUoJM0BtFCT8uXFOupsPA6jR7sRD7fUvmBtz07HLy8fRA2PgHsBD0XqUG1C/5jsWelb1q+5pQQh5NnxxdB8yLO7SIei/edoaaYUb4ruVskYDiPVoUFO/vOdC/wKMiqD2fwEO3khNQ0eB4INA6MN6RLyQaiu1UyktttFIAmoX0QQKZGVWpUieRpJgm/CK4z8JKy4eRp3qc4QqN6PxAdjYn0zubhkDKSKIRkHPFPqXbsqowMI/p+vhT8f8aPJtidd96dsqZjmJJuHdvP8CzvoV4PpVoi/3GVA6PFEh4/AeaMMEWsnBFLN1RrVLyHTXDztrQjZFzmFtWy4CfIxa7Vt0DZPMQ/0I6u6nfa3l8OKke; SC_DFP=PVHdrnUuiitjxxgVdGuXCJnjJgrtcZoA; _ga_SW6D8G0HXK=GS2.1.s1790928055$o1$g0$t1790928055$j60$l1$h1280279677; _ga=GA1.1.1012451792.1790928056; SPC_R_T_ID=gWRzSyEMyHZ/JxErCtfgWK4FidemQOIVJhIQ6MzPmE9GDcKrAHz6e8UsggLqr2bMy683nEFGKodIvzYav9qLeRnGCPVZa1/G/wlRxZ9f7fOJyf1tvxD2UpgA+nM3jPn0U0+MEJqQBpIouvtquEc+skwasj+qNrEE5BkDGEOPZIU=; SPC_R_T_IV=OGF0NFA2eWVRb1cyYTQ4Nw==; SPC_T_ID=gWRzSyEMyHZ/JxErCtfgWK4FidemQOIVJhIQ6MzPmE9GDcKrAHz6e8UsggLqr2bMy683nEFGKodIvzYav9qLeRnGCPVZa1/G/wlRxZ9f7fOJyf1tvxD2UpgA+nM3jPn0U0+MEJqQBpIouvtquEc+skwasj+qNrEE5BkDGEOPZIU=; SPC_T_IV=OGF0NFA2eWVRb1cyYTQ4Nw==; SPC_CDS_CHAT=d566a88e-a8d4-45ba-80d2-17d4cc0ad838; _QPWSDCXHZQA=7c6fce66-4d09-4e3b-d629-90c00e4a42f2; REC7iLP4Q=4198c40e-548c-450d-96b6-a020ba4cc09f; _sapid=4acb2feb88af90814f96e3e9152d7efe4e7e6b5bc9036cd9004e8552; shopee_webUnique_ccd=QWDT83Sze3INcI1Lmz78hA%3D%3D%7CJaQn3suKYxium6LeY1QM0ouwIYNki7SQG6dOJOVjo7SMwiJrPPoYRqGWkUlnTHS%2B%2F%2Fq3%2FcJp7UMocmTL0gkVLPDO%7CCS1AiHZBplwy5o%2BP%7C08%7C3; ds=6a0327f0c9c2c4b719d712db66808e52; CTOKEN=S%2FhBa748EfGWlF5IdiwcAQ%3D%3D`.trim()
};

// ============================================================================
// 2. FUNGSI UTAMA FETCH
// ============================================================================
async function fetchTimeGraph(options = {}) {
  const {
    startTime = 1788282000,
    endTime = 1790960399,
    aggInterval = 96,
    campaignType = 'product_homepage_v2',
    filterCampaignType = 'new_cpc_homepage',
    outputFile = path.join(__dirname, 'data_iklan.json')
  } = options;

  const url = `https://seller.shopee.co.id/api/pas/v1/report/get_time_graph/?SPC_CDS=${CONFIG.spcCds}&SPC_CDS_VER=${CONFIG.spcCdsVer}`;

  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'af-ac-enc-dat': CONFIG.afAcEncDat,
    'af-ac-enc-sz-token': CONFIG.afAcEncSzToken,
    'content-type': 'application/json;charset=UTF-8',
    'cookie': CONFIG.cookie,
    'origin': 'https://seller.shopee.co.id',
    'priority': 'u=1, i',
    'referer': `https://seller.shopee.co.id/portal/marketing/pas/index?type=${filterCampaignType}&from=${startTime}&to=${endTime}&group=last_month&offset=600`,
    'sc-fe-session': CONFIG.scFeSession,
    'sc-fe-ver': CONFIG.scFeVer,
    'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154", "Not A(Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
    'x-sz-sdk-version': '1.12.33-sc.3'
  };

  const payload = {
    agg_interval: aggInterval,
    campaign_type: campaignType,
    start_time: startTime,
    end_time: endTime,
    need_roi_target_setting: false,
    filter_params: {
      campaign_type: filterCampaignType
    }
  };

  console.log(`[Shopee PAS] Mengirim POST ke ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    console.log(`[Shopee PAS] HTTP Status: ${res.status} ${res.statusText}`);
    const json = await res.json();

    if (json.code === 0 && json.data) {
      console.log(`[Shopee PAS] Berhasil! Ditemukan ${json.data.report_by_time?.length || 0} titik data.`);
      
      // Simpan ke file output
      fs.writeFileSync(outputFile, JSON.stringify(json, null, 2), 'utf8');
      console.log(`[Shopee PAS] Data berhasil disimpan ke: ${outputFile}`);

      // Tampilkan ringkasan singkat
      const agg = json.data.report_aggregate;
      if (agg) {
        console.log('\n--- Ringkasan Performa Iklan ---');
        console.log(`Total Biaya (Cost): Rp ${(agg.cost / 100000).toLocaleString('id-ID')}`);
        console.log(`Total Omset (GMV) : Rp ${(agg.broad_gmv / 100000).toLocaleString('id-ID')}`);
        console.log(`ROAS / ROI        : ${agg.broad_roi.toFixed(2)}x`);
        console.log(`Total Pesanan     : ${agg.broad_order} pesanan`);
        console.log(`Total Klik        : ${agg.click.toLocaleString('id-ID')} klik`);
        console.log(`Total Tayangan    : ${agg.impression.toLocaleString('id-ID')} tayangan`);
      }

      return json;
    } else {
      console.error('[Shopee PAS] Server mengembalikan respons error:', json);
      if (json.error === 90309999) {
        console.error('\n⚠️  PERINGATAN: Token Akamai (af-ac-enc-dat / af-ac-enc-sz-token) telah expired.');
        console.error('Buka kembali DevTools browser dan perbarui nilai token di CONFIG.');
      }
      return null;
    }
  } catch (err) {
    console.error('[Shopee PAS] Terjadi kesalahan jaringan:', err.message);
    return null;
  }
}

// Jalankan jika dieksekusi langsung
if (require.main === module) {
  fetchTimeGraph();
}

module.exports = { fetchTimeGraph, CONFIG };
