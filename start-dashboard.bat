@echo off
title Shopee Marketing Analytics Dashboard - Monture Outdoor
color 0B
cls
echo =====================================================================
echo       SHOPEE MARKETING ANALYTICS DASHBOARD - MONTURE OUTDOOR
echo =====================================================================
echo.
echo [1/3] Memulai Backend Express Server (Port 3001)...
start "Dashboard Backend Server" cmd /k "cd /d "%~dp0server" && node server.js"

timeout /t 2 /nobreak >nul

echo [2/3] Memulai Vite Frontend Dev Server (Port 5173)...
start "Dashboard Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Membuka Dashboard di Browser...
start http://localhost:5173/

echo.
echo =====================================================================
echo  DASHBOARD BERHASIL DIJALANKAN!
echo  Frontend URL : http://localhost:5173/
echo  Backend API  : http://localhost:3001/
echo =====================================================================
echo.
echo Tekan tombol apa saja untuk menutup jendela peluncur ini...
pause >nul
