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

  // Coba kirim langsung ke Dashboard jika koneksi lokal diizinkan browser
  try {
    await fetch('http://localhost:3001/api/tiktok/import-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: finalResult })
    });
    console.log('%c🚀 DATA BERHASIL DIKIRIM LANGSUNG KE DASHBOARD!', 'color: #10b981; font-weight: bold;');
  } catch (e) {
    // Jika browser memblokir request langsung ke localhost, data tetap aman disalin ke clipboard
  }

  // Otomatis salin ke Clipboard Windows
  try {
    copy(JSON.stringify(finalResult));
    console.log('%c🎉 SELESAI! Berhasil menarik ' + allSamples.length + ' creator!', 'color: #10b981; font-size: 16px; font-weight: bold;');
    console.log('%c📋 Seluruh data sudah OTOMATIS DISALIN KE CLIPBOARD Anda!', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
    alert(`Sukses menarik ${allSamples.length} data creator!\nData sudah otomatis disalin ke clipboard.\n\nSilakan buka Monture Dashboard lalu paste (Ctrl+V) di menu Impor Data.`);
  } catch (e) {
    console.log('Ketik copy(finalResult) di console untuk menyalin data.');
  }
})();