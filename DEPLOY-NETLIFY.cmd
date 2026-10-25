@echo off
chcp 65001 >nul
title TRIỂN KHAI DỰ ÁN EVN POLEINSPECTOR LÊN NETLIFY
cd /d "%~dp0"

echo ===============================================================================
echo                TRIỂN KHAI DỰ ÁN LÊN WEB NETLIFY - EVN POLEINSPECTOR
echo ===============================================================================
echo.
echo [1/2] Đang đồng bộ và kiểm tra bản dựng web mới nhất trong thư mục dist-netlify...

if exist "evn-poleinspector---quản-lý-trụ-điện-&-lộ-trình-bảo-trì\dist" (
  if not exist "dist-netlify" mkdir "dist-netlify"
  if exist "dist-netlify\assets" rmdir /s /q "dist-netlify\assets"
  xcopy /E /Y /Q "evn-poleinspector---quản-lý-trụ-điện-&-lộ-trình-bảo-trì\dist\*" "dist-netlify\" >nul
  echo     + Đã làm sạch và sao chép các tệp giao diện web, script và css mới nhất.
)

if exist "EVN-PoleInspector.html" (
  copy /Y "EVN-PoleInspector.html" "dist-netlify\EVN-PoleInspector.html" >nul
  echo     + Đã đồng bộ bản HTML độc lập EVN-PoleInspector.html vào gói deploy.
)

if not exist "dist-netlify\_redirects" (
  echo /api/*  /.netlify/functions/api/:splat  200> "dist-netlify\_redirects"
  echo /*      /index.html                     200>> "dist-netlify\_redirects"
)

echo [2/2] Thư mục triển khai dist-netlify đã sẵn sàng!
echo.
echo ===============================================================================
echo                     CHỌN PHƯƠNG THỨC ĐẨY LÊN NETLIFY
echo ===============================================================================
echo [1] Kéo thả lên Netlify Drop (KHUYÊN DÙNG - Cực nhanh, 10 giây có web ngay)
echo     - Tự động mở trang https://app.netlify.com/drop
echo     - Tự động mở thư mục dist-netlify trên máy để bạn kéo thả vào trình duyệt
echo.
echo [2] Đẩy tự động bằng Netlify CLI (Cần tài khoản Netlify đăng nhập trên terminal)
echo     - Chạy lệnh npx netlify-cli deploy --prod
echo.
echo [3] Mở tài liệu hướng dẫn chi tiết (HUONG-DAN-NETLIFY.txt)
echo.
echo [0] Thoát
echo ===============================================================================
echo.
set /p opt="Nhập lựa chọn của bạn (1, 2, 3 hoặc 0) rồi nhấn Enter: "

if "%opt%"=="1" goto opt_drop
if "%opt%"=="2" goto opt_cli
if "%opt%"=="3" goto opt_guide
if "%opt%"=="0" exit /b 0
goto opt_drop

:opt_drop
echo.
echo Đang mở trình duyệt Netlify Drop và mở thư mục dist-netlify...
start "" "https://app.netlify.com/drop"
explorer "%~dp0dist-netlify"
echo.
echo -------------------------------------------------------------------------------
echo HƯỚNG DẪN KÉO THẢ:
echo 1. Nhìn vào cửa sổ thư mục vừa hiện ra, kéo thư mục "dist-netlify" (hoặc bôi đen
echo    tất cả các tệp bên trong) thả vào ô vòng tròn đứt đoạn trên trang web Netlify.
echo 2. Netlify sẽ tải lên trong 5-10 giây và cấp ngay cho bạn một đường link
echo    dạng: https://dutoan-evn-xxxxxx.netlify.app
echo 3. Bạn có thể mở link này trên điện thoại (iPhone, Android) từ bất cứ đâu!
echo -------------------------------------------------------------------------------
echo.
pause
exit /b 0

:opt_cli
echo.
echo Đang khởi chạy Netlify CLI để triển khai trực tiếp...
echo (Lưu ý: Lần đầu chạy có thể mất 1-2 phút để tải công cụ và yêu cầu đăng nhập)
call npx --yes netlify-cli deploy --dir=dist-netlify --prod
echo.
pause
exit /b 0

:opt_guide
notepad "%~dp0HUONG-DAN-NETLIFY.txt"
exit /b 0

