/**
 * Smart cURL Parser Service
 * File: server/services/curlParser.js
 */

function parseCurl(curlString) {
  if (!curlString || typeof curlString !== 'string') {
    throw new Error('Teks cURL tidak boleh kosong.');
  }

  const result = {
    url: '',
    spcCds: '',
    spcCdsVer: '2',
    cookie: '',
    afAcEncDat: '',
    afAcEncSzToken: '',
    scFeSession: '',
    scFeVer: '',
    userAgent: ''
  };

  // 1. Ekstrak URL
  const urlMatch = curlString.match(/curl\s+(?:--url\s+)?['"]([^'"]+)['"]/i) ||
                   curlString.match(/['"](https?:\/\/seller\.shopee\.co\.id[^'"]+)['"]/i);
  if (urlMatch) {
    result.url = urlMatch[1];
    try {
      const parsedUrl = new URL(result.url);
      if (parsedUrl.searchParams.has('SPC_CDS')) {
        result.spcCds = parsedUrl.searchParams.get('SPC_CDS');
      }
      if (parsedUrl.searchParams.has('SPC_CDS_VER')) {
        result.spcCdsVer = parsedUrl.searchParams.get('SPC_CDS_VER');
      }
    } catch (e) {}
  }

  // 2. Ekstrak Cookie (dari flag -b, --cookie, atau -H 'cookie: ...')
  const cookieFlagMatch = curlString.match(/(?:-b|--cookie)\s+['"]([^'"]+)['"]/i);
  const cookieHeaderMatch = curlString.match(/-H\s+['"]cookie:\s*([^'"]+)['"]/i);
  
  if (cookieFlagMatch) {
    result.cookie = cookieFlagMatch[1].trim();
  } else if (cookieHeaderMatch) {
    result.cookie = cookieHeaderMatch[1].trim();
  }

  // Koreksi typo umum jika ada
  if (result.cookie.includes('STVawqbJ')) {
    result.cookie = result.cookie.replace('STVawqbJ', 'STVpAWqbJ');
  }

  // Jika spcCds belum didapat dari URL, coba cari dari cookie
  if (!result.spcCds && result.cookie) {
    const cdsMatch = result.cookie.match(/SPC_CDS=([a-f0-9\-]+)/i);
    if (cdsMatch) result.spcCds = cdsMatch[1];
  }

  // 3. Ekstrak Headers
  const headerRegex = /-H\s+['"]([^:]+):\s*([^'"]+)['"]/gi;
  let match;
  while ((match = headerRegex.exec(curlString)) !== null) {
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();

    if (key === 'af-ac-enc-dat') {
      result.afAcEncDat = value;
    } else if (key === 'af-ac-enc-sz-token') {
      result.afAcEncSzToken = value;
    } else if (key === 'sc-fe-session') {
      result.scFeSession = value;
    } else if (key === 'sc-fe-ver') {
      result.scFeVer = value;
    } else if (key === 'user-agent') {
      result.userAgent = value;
    }
  }

  // Fallback afAcEncSzToken dari cookie jika belum ada di header
  if (!result.afAcEncSzToken && result.cookie) {
    const szMatch = result.cookie.match(/shopee_webUnique_ccd=([^;]+)/i);
    if (szMatch) {
      result.afAcEncSzToken = decodeURIComponent(szMatch[1]);
    }
  }

  // Validasi dasar
  if (!result.cookie) {
    throw new Error('Cookie tidak ditemukan dalam perintah cURL.');
  }

  return result;
}

module.exports = { parseCurl };
