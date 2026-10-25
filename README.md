# EVN PoleInspector

Ứng dụng tiếng Việt để quản lý trụ điện, ghi nhận hiện trường, lập lộ trình và dự toán bảo trì.

## Chạy trên Windows

Yêu cầu Node.js 22.12 trở lên. Tại thư mục dự án:

~~~powershell
npm.cmd install
npm.cmd run dev
~~~

Mở http://localhost:3000 hoặc nhấp đúp MO-WEB.cmd. Các lệnh dùng node trực tiếp để tương thích với đường dẫn có dấu &; không cần đổi Execution Policy của PowerShell.

## Xem trên điện thoại

- Điện thoại và máy tính cùng Wi-Fi: mở địa chỉ LAN trong TRUY-CAP.txt ở thư mục cha.
- Xem khung điện thoại trên máy tính: http://localhost:3000/dien-thoai.html (360, 390, 430, 768 px).
- Máy chủ lắng nghe trên 0.0.0.0:3000. Nếu mạng hoặc Windows Firewall chặn cổng này, cần cấu hình mạng của máy để cho phép truy cập.
- Camera/GPS trên điện thoại phụ thuộc trình duyệt và cần HTTPS. Với HTTP qua LAN vẫn có thể tải ảnh có sẵn và nhập tọa độ thủ công.
- Dữ liệu lưu trong trình duyệt của từng thiết bị; bản này chưa có cơ sở dữ liệu để đồng bộ giữa các điện thoại.

## Tạo HTML và bản phát hành

~~~powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run build:html
npm.cmd start
~~~

- dist/: bản web sản xuất; phục vụ bằng npm.cmd start. Máy chủ Express cung cấp cả API AI.
- html/index.html: HTML độc lập đã nhúng CSS và JavaScript, có thể nhấp đúp để mở. Bản đồ nền và tìm địa chỉ vẫn cần Internet. AI cần máy chủ Express nên dùng bản web khi phân tích ảnh.
- npm run preview chỉ phục vụ nội dung tĩnh, không cung cấp API AI.

## Cấu hình AI (tùy chọn)

Sao chép .env.example thành .env.local, đặt GEMINI_API_KEY và khởi động lại máy chủ. Khóa chỉ đọc ở máy chủ, không được đóng gói vào HTML. GEMINI_MODEL cho phép thay mô hình khi cần.

API nhận JPG, PNG, WebP tối đa 10 MB. Ảnh mẫu là SVG minh họa được chuyển thành PNG trước khi gửi. Ứng dụng không tạo sẵn kết quả AI giả. Khi chưa có khóa, các chức năng quản lý, dự toán và xuất báo cáo vẫn dùng được; API phân tích trả lỗi 503 rõ ràng.

Tài liệu tích hợp: [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding).

## Cách tính và dữ liệu

- Dữ liệu ban đầu là **8 trụ mẫu**, cần thay bằng dữ liệu hiện trường đã xác minh.
- Quãng đường là Haversine giữa tọa độ, không phải khoảng cách đường bộ. Tối ưu gần đúng bằng nearest-neighbor và 2-opt; không bảo đảm nghiệm ngắn nhất toàn cục.
- Định mức, đơn giá, VAT và các hệ số có sẵn là cấu hình mẫu của dự án, chưa đối chiếu với hồ sơ/định mức được phê duyệt của đơn vị. Chỉnh đơn giá công tác và hệ số TH-01 trước khi lập hồ sơ.
- Báo cáo cộng dự toán **từng trụ**, giữ hệ số đồng thời ở cấp trụ, không giảm lần thứ hai cho toàn tuyến. Cự ly vận chuyển tổng hợp là tổng cự ly tính tại từng trụ, không phải cự ly chuyến xe dùng chung.
- Khoảng cách 0 km tính vận chuyển bằng 0; không chọn công tác thì dự toán bằng 0. Khối lượng 0 được giữ nguyên.
- Dữ liệu lưu bằng localStorage. Dữ liệu hỏng được sao lưu với hậu tố _recovery trước khi dùng dữ liệu thay thế. Bộ nhớ đầy/bị chặn sẽ có thông báo để xuất dữ liệu trước khi đóng.
- CSV có BOM UTF-8 và xử lý dấu nháy, công thức đầu ô. Nút Excel xuất HTML tương thích Excel đuôi .xls; Excel có thể hiện thông báo định dạng. Đây chưa phải tệp .xlsx gốc.

## Kiểm tra

npm.cmd test chạy kiểm thử tính toán, tổng hợp nhiều trụ, lộ trình, lưu trữ, CSV, API và tương tác React bằng jsdom. jsdom không thay thế kiểm tra giao diện thực trên trình duyệt hay điện thoại. Xem KIEM-TRA.md về phạm vi đã xác minh.
