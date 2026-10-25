@echo off
chcp 65001 >nul
title ĐẨY DỰ ÁN EVN ESTIMATE LÊN GITHUB & DEPLOY VERCEL
cd /d "%~dp0"

echo ===============================================================================
echo            ĐẨY MÃ NGUỒN LÊN GITHUB: Bangtutoanevn
echo            Repository: https://github.com/quocbao0502-source/Bangtutoanevn.git
echo ===============================================================================
echo.

:: 1. Kiểm tra Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [THÔNG BÁO] Máy tính của bạn chưa cài đặt Git.
    echo.
    echo Vui lòng cài đặt Git tại: https://git-scm.com/download/win
    start "" "https://git-scm.com/download/win"
    pause
    exit /b
)

:: 2. Khởi tạo Git repository và cấu hình
echo [1/4] Đang khởi tạo và cấu hình Git cục bộ...
if not exist ".git" (
    git init
)

git config user.name "quocbao0502-source"
git config user.email "quocbao0502@users.noreply.github.com"

echo [2/4] Đang cấu hình Remote repository: https://github.com/quocbao0502-source/Bangtutoanevn.git
git remote remove origin >nul 2>nul
git remote add origin https://github.com/quocbao0502-source/Bangtutoanevn.git
git branch -M main

echo [3/4] Đang cập nhật gói commit...
git add .
git commit -m "EVN Hotline Estimate - Bảng dự toán hotline tự động và hỗ trợ đa thiết bị" >nul 2>nul

echo [4/4] Đang đẩy (push) mã nguồn lên nhánh 'main' trên GitHub...
echo.
echo ===============================================================================
echo [HƯỚNG DẪN XÁC THỰC GITHUB]:
echo - Nếu xuất hiện cửa sổ đăng nhập GitHub:
echo   -> Chọn "Sign in with your browser" (Đăng nhập qua trình duyệt) để xác thực 1 chạm!
echo - Nếu yêu cầu mật khẩu qua console:
echo   -> Nhập GitHub Personal Access Token (PAT) tạo tại: https://github.com/settings/tokens
echo ===============================================================================
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================================
    echo      🎉 CHÚC MỪNG! ĐÃ ĐẨY THÀNH CÔNG LÊN GITHUB!
    echo      Kho mã nguồn: https://github.com/quocbao0502-source/Bangtutoanevn
    echo ===============================================================================
    echo.
    echo [BƯỚC TIẾP THEO: DEPLOY LÊN VERCEL]:
    echo Hệ thống sẽ mở trang Vercel để bạn Deploy 1-Click ngay bây giờ!
    echo.
    start "" "https://vercel.com/new/git/external?repository-url=https://github.com/quocbao0502-source/Bangtutoanevn"
) else (
    echo.
    echo [!] Quá trình đẩy lên GitHub chưa hoàn tất hoặc cần xác thực tài khoản.
    echo     Nếu kho https://github.com/quocbao0502-source/Bangtutoanevn chưa được tạo trên GitHub,
    echo     bạn vui lòng tạo kho mới với tên "Bangtutoanevn" rồi chạy lại file này nhé!
)

echo.
pause
