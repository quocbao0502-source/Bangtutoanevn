@echo off
chcp 65001 >nul
title MÁY CHỦ EVNSPC ESTIMATE (LOCALHOST:5292)
cd /d "%~dp0"

echo ===============================================================================
echo            KHỞI ĐỘNG TRANG WEB EVNSPC ESTIMATE - LOCALHOST:5292
echo ===============================================================================
echo.
echo Đang chạy máy chủ web tại: http://localhost:5292
echo Tự động mở trình duyệt web...
echo.
echo [LƯU Ý] Không tắt cửa sổ này khi đang dùng trang web.
echo.

start "" "http://localhost:5292"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server-5292.ps1" -Port 5292
pause

