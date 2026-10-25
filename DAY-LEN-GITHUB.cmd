@echo off
chcp 65001 >nul
title ĐẨY DỰ ÁN EVN POLEINSPECTOR LÊN GITHUB
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
    echo Bạn có 2 cách cực kỳ nhanh:
    echo.
    echo   [Cách A] Tự động cài Git qua Windows Package Manager (Winget)
    echo            Hệ thống sẽ chạy: winget install --id Git.Git -e --source winget
    echo.
    echo   [Cách B] Mở trang tải Git chính thức (Khuyên dùng nếu Winget bị chặn)
    echo            Trang web: https://git-scm.com/download/win
    echo.
    echo   [Cách C] Tải lên trực tiếp không cần cài Git:
    echo            Mở https://github.com/quocbao0502-source/Bangtutoanevn
    echo            Bấm "Upload files" rồi kéo thả toàn bộ thư mục này vào!
    echo.
    set /p choice="Nhập lựa chọn của bạn (A, B hoặc C): "
    if /i "%choice%"=="A" (
        echo.
        echo Đang tiến hành cài đặt Git qua winget...
        winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
        echo.
        echo [!] Sau khi cài xong, vui lòng khởi động lại file DAY-LEN-GITHUB.cmd này!
        pause
        exit /b
    )
    if /i "%choice%"=="B" (
        start "" "https://git-scm.com/download/win"
        echo Đã mở trình duyệt tải Git. Sau khi cài xong, hãy chạy lại file này!
        pause
        exit /b
    )
    if /i "%choice%"=="C" (
        start "" "https://github.com/quocbao0502-source/Bangtutoanevn"
        echo Đã mở trang GitHub để bạn tải file lên trực tiếp.
        pause
        exit /b
    )
    pause
    exit /b
)

:: 2. Khởi tạo Git repository và commit
echo [1/4] Đang khởi tạo kho lưu trữ Git cục bộ...
if not exist ".git" (
    git init
)

echo [2/4] Đang cấu hình Remote repository: https://github.com/quocbao0502-source/Bangtutoanevn.git
git remote remove origin >nul 2>nul
git remote add origin https://github.com/quocbao0502-source/Bangtutoanevn.git
git branch -M main

echo [3/4] Đang thêm các tệp vào gói commit...
git add .
git commit -m "EVN PoleInspector - Quản lý trụ điện và dự toán bảo trì" >nul 2>nul
if %errorlevel% neq 0 (
    echo     (Mã nguồn đã được commit từ trước hoặc không có thay đổi mới).
)

echo [4/4] Đang đẩy (push) mã nguồn lên nhánh 'main' trên GitHub...
echo.
echo ===============================================================================
echo [LƯU Ý ĐĂNG NHẬP GITHUB]:
echo - Nếu Git yêu cầu đăng nhập: Chọn "Sign in with your browser" để xác thực 1 chạm.
echo - Nếu yêu cầu mật khẩu qua console: Bạn cần nhập GitHub Personal Access Token (PAT)
echo   (Tạo tại https://github.com/settings/tokens với quyền "repo").
echo ===============================================================================
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================================
    echo      CHÚC MỪNG! ĐÃ ĐẨY THÀNH CÔNG LÊN GITHUB!
    echo      Xem kho mã nguồn tại: https://github.com/quocbao0502-source/Bangtutoanevn
    echo ===============================================================================
) else (
    echo.
    echo [!] Quá trình đẩy lên GitHub chưa hoàn tất hoặc gặp lỗi xác thực tài khoản.
    echo     Vui lòng kiểm tra lại quyền truy cập hoặc Personal Access Token của bạn.
)

echo.
pause

