DROP DATABASE IF EXISTS review_books;
CREATE DATABASE review_books CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE review_books;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  last_seen_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  cover_image VARCHAR(255) DEFAULT '/images/books/default-book.svg',
  description TEXT,
  review_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  user_id INT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_books FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_stats (
  id INT PRIMARY KEY,
  total_views INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO site_stats (id, total_views) VALUES (1, 0);

INSERT INTO categories (name) VALUES
('Văn học Việt Nam'),
('Tiểu thuyết'),
('Kỹ năng sống'),
('Phát triển bản thân'),
('Truyền cảm hứng'),
('Lịch sử'),
('Khoa học'),
('Kinh doanh'),
('Công nghệ'),
('Thiếu nhi');

INSERT INTO users (username, email, password, role, last_seen_at) VALUES
('admin', 'admin@bookreview.local', '79c7a5b63a6b2eaaea3abbdd12b92ddd:e5c778f8d8db0e9e725c75756f27cafb3eb2464e7a060a96b491a752b9695f0e0594e44d743bd638eeda40e5cba2c8e9705069f0f321024b7f608a9193197852', 'admin', NULL),
('reader', 'reader@bookreview.local', '7b4bc0603e4426054cad1ae7707dfe13:94e7e1b6ba2c6e29f63b7f78f72b623a27447edb89fdf3a300e71df65cb7a7c6d6f95f2bfb2a2162b0ce272b7bc07e884752638a248ba3f6d440a4f42a7e8ca9', 'user', NULL),
('linh_reader', 'linh@bookreview.local', '7b4bc0603e4426054cad1ae7707dfe13:94e7e1b6ba2c6e29f63b7f78f72b623a27447edb89fdf3a300e71df65cb7a7c6d6f95f2bfb2a2162b0ce272b7bc07e884752638a248ba3f6d440a4f42a7e8ca9', 'user', NULL),
('minh_reader', 'minh@bookreview.local', '7b4bc0603e4426054cad1ae7707dfe13:94e7e1b6ba2c6e29f63b7f78f72b623a27447edb89fdf3a300e71df65cb7a7c6d6f95f2bfb2a2162b0ce272b7bc07e884752638a248ba3f6d440a4f42a7e8ca9', 'user', NULL),
('hoa_reader', 'hoa@bookreview.local', '7b4bc0603e4426054cad1ae7707dfe13:94e7e1b6ba2c6e29f63b7f78f72b623a27447edb89fdf3a300e71df65cb7a7c6d6f95f2bfb2a2162b0ce272b7bc07e884752638a248ba3f6d440a4f42a7e8ca9', 'user', NULL);

INSERT INTO books (title, author, category, cover_image, description, review_content) VALUES
('Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 'Nguyễn Nhật Ánh', 'Văn học Việt Nam', '/images/books/book-1.svg', 'Một câu chuyện trong trẻo về tuổi thơ, tình thân và những rung động đầu đời.', 'Tác phẩm có giọng kể nhẹ, giàu hình ảnh và giàu cảm xúc. Điểm mạnh là cách tác giả tái hiện thế giới trẻ thơ vừa hồn nhiên vừa nhiều tổn thương.'),
('Nhà Giả Kim', 'Paulo Coelho', 'Tiểu thuyết', '/images/books/book-2.svg', 'Hành trình đi tìm kho báu cũng là hành trình nhận ra ước mơ và bản thân.', 'Cuốn sách dễ đọc, giàu tính biểu tượng. Phù hợp với người đọc thích những thông điệp ngắn gọn về ước mơ và lựa chọn cá nhân.'),
('Đắc Nhân Tâm', 'Dale Carnegie', 'Kỹ năng sống', '/images/books/book-3.svg', 'Sách kinh điển về giao tiếp, ứng xử và xây dựng quan hệ.', 'Nội dung thực tế, nhiều nguyên tắc dễ áp dụng. Khi đọc cần chọn lọc để tránh biến giao tiếp thành kỹ thuật máy móc.'),
('Atomic Habits', 'James Clear', 'Phát triển bản thân', '/images/books/book-4.svg', 'Hệ thống xây dựng thói quen nhỏ nhưng tạo thay đổi lớn theo thời gian.', 'Sách có cấu trúc rõ, ví dụ dễ hiểu. Giá trị chính nằm ở cách biến mục tiêu lớn thành hệ thống hành động nhỏ và đều đặn.'),
('Tuổi Trẻ Đáng Giá Bao Nhiêu', 'Rosie Nguyễn', 'Truyền cảm hứng', '/images/books/book-5.svg', 'Những suy ngẫm về học tập, trải nghiệm, đọc sách và trưởng thành.', 'Phù hợp với học sinh, sinh viên đang tìm định hướng. Văn phong gần gũi, dễ tiếp cận, thiên về động lực cá nhân.'),
('Sapiens', 'Yuval Noah Harari', 'Lịch sử', '/images/books/book-6.svg', 'Lược sử loài người qua các giai đoạn nhận thức, nông nghiệp, xã hội và khoa học.', 'Một cuốn sách giàu góc nhìn tổng hợp. Nên đọc với tinh thần phản biện vì sách đưa ra nhiều diễn giải rộng về lịch sử và xã hội.'),
('Dế Mèn Phiêu Lưu Ký', 'Tô Hoài', 'Thiếu nhi', '/images/books/default-book.svg', 'Tác phẩm thiếu nhi kinh điển về hành trình trưởng thành của Dế Mèn.', 'Truyện có tính phiêu lưu, giàu bài học về trách nhiệm, lòng dũng cảm và sự khiêm tốn.'),
('Lược Sử Thời Gian', 'Stephen Hawking', 'Khoa học', '/images/books/default-book.svg', 'Giới thiệu các ý tưởng lớn về vũ trụ học cho độc giả phổ thông.', 'Một cuốn sách kích thích tò mò khoa học, tuy có một số phần cần đọc chậm để nắm ý tưởng.'),
('Không Gia Đình', 'Hector Malot', 'Tiểu thuyết', '/images/books/default-book.svg', 'Câu chuyện cảm động về cậu bé Rémi trên hành trình mưu sinh.', 'Tác phẩm giàu cảm xúc, đề cao lòng nhân ái và nghị lực sống.'),
('Khởi Nghiệp Tinh Gọn', 'Eric Ries', 'Kinh doanh', '/images/books/default-book.svg', 'Phương pháp xây dựng sản phẩm dựa trên thử nghiệm, đo lường và học hỏi.', 'Nội dung phù hợp với người quan tâm startup và phát triển sản phẩm.'),
('Clean Code', 'Robert C. Martin', 'Công nghệ', '/images/books/default-book.svg', 'Các nguyên tắc viết mã rõ ràng, dễ bảo trì.', 'Sách hữu ích cho lập trình viên muốn cải thiện chất lượng code.'),
('Việt Nam Sử Lược', 'Trần Trọng Kim', 'Lịch sử', '/images/books/default-book.svg', 'Tổng thuật lịch sử Việt Nam theo lối viết cổ điển.', 'Nên đọc như một tài liệu tham khảo lịch sử, kết hợp với nguồn hiện đại để đối chiếu.');

INSERT INTO comments (book_id, user_id, name, email, content, rating, created_at) VALUES
(1, 2, 'reader', 'reader@bookreview.local', 'Sách rất nhẹ nhàng, đọc xong thấy nhớ tuổi thơ.', 5, '2026-01-02 09:00:00'),
(2, 2, 'reader', 'reader@bookreview.local', 'Thông điệp đơn giản nhưng truyền cảm hứng.', 4, '2026-01-03 10:15:00'),
(4, 2, 'reader', 'reader@bookreview.local', 'Rất thực tế cho việc xây dựng thói quen học tập.', 5, '2026-01-04 11:30:00'),
(1, 3, 'linh_reader', 'linh@bookreview.local', 'Phần miêu tả tuổi thơ rất đẹp, văn phong dễ đọc.', 5, '2026-01-05 08:20:00'),
(3, 3, 'linh_reader', 'linh@bookreview.local', 'Có nhiều nguyên tắc giao tiếp hữu ích nhưng cần áp dụng linh hoạt.', 4, '2026-01-06 13:00:00'),
(6, 3, 'linh_reader', 'linh@bookreview.local', 'Góc nhìn rộng, nhiều phần khiến mình muốn tìm hiểu thêm.', 4, '2026-01-07 14:45:00'),
(7, 4, 'minh_reader', 'minh@bookreview.local', 'Đọc vui và có nhiều bài học cho thiếu nhi.', 5, '2026-01-08 16:10:00'),
(8, 4, 'minh_reader', 'minh@bookreview.local', 'Một số đoạn hơi khó nhưng rất kích thích trí tò mò.', 4, '2026-01-09 19:30:00'),
(10, 4, 'minh_reader', 'minh@bookreview.local', 'Phù hợp nếu đang tìm cách kiểm chứng ý tưởng sản phẩm.', 4, '2026-01-10 20:00:00'),
(11, 5, 'hoa_reader', 'hoa@bookreview.local', 'Nhiều lời khuyên code thực tế, đặc biệt là đặt tên và tách hàm.', 5, '2026-01-11 07:50:00'),
(5, 5, 'hoa_reader', 'hoa@bookreview.local', 'Sách nhẹ nhàng, phù hợp với sinh viên.', 4, '2026-01-12 09:40:00'),
(9, 5, 'hoa_reader', 'hoa@bookreview.local', 'Câu chuyện cảm động và có sức sống lâu dài.', 5, '2026-01-13 12:25:00'),
(12, 2, 'reader', 'reader@bookreview.local', 'Có giá trị tham khảo, nhưng cần đọc thêm nguồn đối chiếu.', 3, '2026-01-14 15:10:00'),
(4, 3, 'linh_reader', 'linh@bookreview.local', 'Các ví dụ về thói quen nhỏ rất dễ áp dụng.', 5, '2026-01-15 17:40:00'),
(2, 4, 'minh_reader', 'minh@bookreview.local', 'Truyện ngắn gọn, dễ nhớ, thông điệp rõ.', 4, '2026-01-16 18:05:00'),
(11, 2, 'reader', 'reader@bookreview.local', 'Hữu ích nhưng có vài quan điểm cần chọn lọc theo dự án.', 4, '2026-01-17 21:15:00');
