(async function sedotSemuaCreatorTikTok() {
  console.clear();
  console.log('%c🚀 MEMULAI PENARIKAN SELURUH DATA CREATOR TIKTOK...', 'color: #10b981; font-size: 14px; font-weight: bold;');

  const pageSize = 50;
  let curPage = 1;
  let totalCount = 0;
  let allSamples = [];
  let hasMore = true;

  // Endpoint internal TikTok Seller Center
  const apiUrl = `/api/v1/affiliate/sample/group/list?user_language=id-ID&aid=4331&app_name=i18n_ecom_alliance&device_platform=web&oec_seller_id=7494826103548118725&shop_region=ID`;

  while (hasMore) {
    console.log(`⏳ Sedang menarik Halaman ${curPage}...`);
    try {
      const payload = {
        tab: 0, // Semua status pengajuan
        cur_page: curPage,
        page_size: pageSize,
        search_params: [{ search_key: 1, search_type: 2, value: "" }],
        order_params: []
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error(`❌ Gagal di Halaman ${curPage}: HTTP ${res.status}`);
        break;
      }

      const data = await res.json();
      if (data.code !== 0) {
        console.error(`❌ TikTok Error di Halaman ${curPage}: Code ${data.code} - ${data.message}`);
        break;
      }

      totalCount = data.total_count || totalCount;
      const items = data.agg_info || [];
      allSamples.push(...items);

      console.log(`  ✓ Halaman ${curPage} berhasil: didapat ${items.length} creator (Total terkumpul: ${allSamples.length}/${totalCount})`);

      // Cek apakah data sudah habis
      if (!data.has_more || items.length === 0 || allSamples.length >= totalCount) {
        hasMore = false;
        break;
      }

      curPage++;
      // Jeda 600ms antar halaman agar aman dan tidak memicu proteksi bot TikTok
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`❌ Terjadi error di Halaman ${curPage}:`, err);
      break;
    }
  }

  const finalResult = {
    code: 0,
    message: "success",
    total_count: totalCount || allSamples.length,
    agg_info: allSamples,
    fetched_at: new Date().toISOString()
  };

  // Simpan ke window global agar selalu bisa diakses kapan saja dari Console DevTools
  window.finalResult = finalResult;
  window.tiktokSamples = finalResult;

  // Coba kirim langsung ke Dashboard lokal Monture
  let sentToDashboard = false;
  try {
    const apiRes = await fetch('http://localhost:3001/api/tiktok/import-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: finalResult })
    });
    if (apiRes.ok) {
      sentToDashboard = true;
      console.log('%c🚀 DATA SUKSES TERKIRIM LANGSUNG KE DASHBOARD MONTURE!', 'color: #10b981; font-size: 14px; font-weight: bold;');
    }
  } catch (e) {
    // Jika koneksi langsung ke localhost dibatasi kebijakan browser
  }

  // Otomatis salin ke Clipboard
  try {
    if (typeof copy === 'function') {
      copy(JSON.stringify(finalResult));
      console.log('%c📋 Data juga telah otomatis disalin ke clipboard!', 'color: #3b82f6; font-size: 12px;');
    }
  } catch (e) {
    // Clipboard fallback
  }

  console.log('%c🎉 SELESAI! Total ' + allSamples.length + ' data creator berhasil ditarik.', 'color: #10b981; font-size: 16px; font-weight: bold;');
  if (sentToDashboard) {
    alert(`🎉 Sukses menarik ${allSamples.length} creator!\n\nData sudah OTOMATIS MASUK ke Monture Dashboard lokal.\nAnda tidak perlu paste manual lagi, silakan refresh tab Dashboard!`);
  } else {
    alert(`Sukses menarik ${allSamples.length} creator!\nKetik copy(finalResult) di console jika ingin menyalin manual.`);
  }
})();