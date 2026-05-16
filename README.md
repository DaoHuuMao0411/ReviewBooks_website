# Review Books Local Website

## Version 1.1.0

- Admin có thể thêm, sửa, xóa category.
- Khi sửa category, các sách đang dùng category cũ được cập nhật sang tên mới.
- Khi xóa category đang có sách, các sách liên quan được chuyển sang category khác còn tồn tại. Nếu đó là category duy nhất và đang có sách, hệ thống không cho xóa.
- Admin có thể thêm, sửa, xóa tài khoản admin và user. Nếu admin xóa chính tài khoản đang đăng nhập, phiên hiện tại sẽ kết thúc và quay về trang đăng nhập.
- Đã sửa logic phân trang: chỉ hiện phân trang khi có từ 2 trang trở lên, không render link tới trang không tồn tại.
- Bình luận/review hiển thị đủ tên người gửi, email, nội dung bình luận và điểm đánh giá.


Website review sách chạy local bằng HTML, CSS, JavaScript thuần, EJS, Express và MySQL.

## Yêu cầu

- Node.js
- MySQL local hoặc MySQL Workbench/MySQL Server

## Cài đặt

```bash
npm install
```

## Tạo database mới

Import file:

```text
sql/database.sql
```

Nếu dùng MySQL Workbench, mở connection local rồi chạy toàn bộ script trong `sql/database.sql`.

## Database

Bản đóng gói v1.1.0 là bản sạch. Import trực tiếp `sql/database.sql` để tạo schema và dữ liệu mẫu.

Cấu hình database nằm trong:

```text
config/db.js
```

Ví dụ:

```js
host: "localhost",
port: 3306,
user: "root",
password: "your_mysql_password",
database: "review_books"
```

## Chạy website

```bash
npm start
```

Mở trình duyệt:

```text
http://localhost:3000
```

## Tài khoản mẫu

Admin:

```text
username: admin
password: admin123
```

User:

```text
username: reader
password: user123
```

Các user mẫu bổ sung dùng cùng mật khẩu:

```text
password: user123
```

## Chức năng đã có

- Lưu dữ liệu bằng MySQL.
- Đăng ký, đăng nhập, đăng xuất.
- Phân quyền `admin` và `user`.
- Theo dõi trạng thái online/offline của user bằng `last_seen_at`.
- Trang chủ giống design mẫu.
- Thư viện sách có tìm kiếm, lọc category, sort và phân trang.
- Trang chi tiết sách theo mã `/books/:id`.
- Bình luận/review và đánh giá sách được gộp chung.
- Trang `/reviews` hiển thị tất cả bình luận/review kèm sách, sắp xếp từ bình luận tạo sớm nhất đến mới nhất và có phân trang.
- Popup quảng cáo sau 60 giây.
- Cookie để không hiện lại popup sau khi đóng.
- Trang `/contact` gộp nội dung giới thiệu, thông tin liên hệ và form gửi góp ý.
- Route `/about` chuyển hướng về `/contact` để tránh tách thành hai trang.
- Nếu user đã đăng nhập, contact form tự dùng email tài khoản và không hiện ô nhập email.
- Admin dashboard hiển thị tổng view và số lượng dữ liệu chính.
- Admin CRUD sách.
- Admin CRUD user; admin có thể xóa user đang online, nhưng không được xóa tài khoản admin.
- Admin quản lý category: thêm/xóa category, không có sửa. Category đang có sách sử dụng không được xóa.
- Khi tạo/sửa sách, admin chỉ được chọn category có sẵn trong database.
- Admin xem và xóa bình luận/review.
- Admin xem contacts.
- Các thao tác admin có ảnh hưởng dữ liệu website như sửa/xóa đều hỏi xác nhận bằng popup `confirm()`; thao tác thêm không hỏi lại.
- Các trang danh sách cần thiết có phân trang và chỉ hiện pagination khi dữ liệu vượt quá giới hạn mỗi trang.
- Thông báo thành công/lỗi rõ ràng bằng flash message.
- Form validation phía client và server cho auth, contact, comment, book, user, category.
- Responsive layout theo 3 ngưỡng: dưới 800px, 800-1199px, từ 1200px.

## Không dùng

- Bootstrap
- Tailwind
- jQuery
- React/Vue/Angular
- Template giao diện có sẵn

## Category

Từ v5, category không còn định nghĩa trong code. Category được lưu trong bảng `categories` của MySQL và quản lý tại:

```text
/admin/categories
```

Admin có thể thêm hoặc xóa category. Không có chức năng sửa category để tránh làm lệch dữ liệu sách đã có.
