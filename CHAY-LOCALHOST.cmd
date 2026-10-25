@echo off
chcp 65001 >nul
title MÁY CHỦ EVN POLEINSPECTOR (LOCALHOST)
cd /d "%~dp0"

echo ===============================================================================
echo                KHỞI ĐỘNG WEB DEMO EVN POLEINSPECTOR TRÊN LOCALHOST
echo ===============================================================================
echo.
echo Đang chạy máy chủ web cục bộ tại: http://localhost:3000
echo Tự động mở trình duyệt web trong giây lát...
echo.
echo [LƯU Ý] Không tắt cửa sổ này khi đang trải nghiệm web.
echo.

start "" "http://localhost:3000"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0local-server.ps1" -Port 3000
pause

