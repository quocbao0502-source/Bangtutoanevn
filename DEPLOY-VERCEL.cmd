@echo off
chcp 65001 >nul
title DEPLOY DỰ ÁN EVN ESTIMATE LÊN VERCEL
cd /d "%~dp0"

echo ===============================================================================
echo            HƯỚNG DẪN DEPLOY DỰ TOÁN EVNSPC LÊN VERCEL
echo            Repository: https://github.com/quocbao0502-source/Bangtutoanevn
echo ===============================================================================
echo.
echo Dự án đã được cấu hình sẵn tệp vercel.json:
echo - Tự động định tuyến vào giao diện Bảng dự toán Hotline đa thiết bị.
echo - Tốc độ tải trang siêu nhanh qua mạng Edge toàn cầu của Vercel.
echo.
echo [CÁCH 1: DEPLOY TỰ ĐỘNG 1-CLICK (Khuyên dùng)]:
echo Nhấn phím bất kỳ, hệ thống sẽ mở trực tiếp trang Vercel Deploy.
echo Bạn chỉ cần nhấn nút "Deploy" là xong!
echo.
pause

start "" "https://vercel.com/new/git/external?repository-url=https://github.com/quocbao0502-source/Bangtutoanevn"

echo.
echo ===============================================================================
echo [CÁCH 2: NẾU BẠN ĐÃ ĐĂNG NHẬP SẴN VERCEL]:
echo 1. Truy cập: https://vercel.com/new
echo 2. Chọn kho "Bangtutoanevn" trong danh sách GitHub của bạn -> bấm "Import".
echo 3. Giữ nguyên toàn bộ cấu hình mặc định (đã có vercel.json) -> bấm "Deploy".
echo 4. Sau 15-30 giây, Vercel sẽ cấp đường link: https://bangtutoanevn.vercel.app
echo ===============================================================================
echo.
pause
