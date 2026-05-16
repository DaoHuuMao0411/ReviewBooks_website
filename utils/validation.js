const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmail(value) {
  return EMAIL_RE.test(clean(value));
}

function validateRequiredText(value, label, min = 1, max = 1000) {
  const text = clean(value);
  if (text.length < min) return `${label} phải có ít nhất ${min} ký tự.`;
  if (text.length > max) return `${label} không được vượt quá ${max} ký tự.`;
  return '';
}

function validateBook(data, validCategories) {
  const errors = [];
  const title = clean(data.title);
  const author = clean(data.author);
  const category = clean(data.category);
  const cover_image = clean(data.cover_image) || '/images/books/default-book.svg';
  const description = clean(data.description);
  const review_content = clean(data.review_content);

  const titleError = validateRequiredText(title, 'Tên sách', 2, 200);
  const authorError = validateRequiredText(author, 'Tác giả', 2, 150);
  if (titleError) errors.push(titleError);
  if (authorError) errors.push(authorError);
  if (!category || !validCategories.includes(category)) errors.push('Thể loại phải được chọn từ danh sách có sẵn.');
  if (description.length > 3000) errors.push('Mô tả không được vượt quá 3000 ký tự.');
  if (review_content.length > 6000) errors.push('Nội dung review không được vượt quá 6000 ký tự.');

  return {
    errors,
    values: { title, author, category, cover_image, description, review_content }
  };
}

function validateUser(data, mode = 'create') {
  const errors = [];
  const username = clean(data.username);
  const email = clean(data.email);
  const password = clean(data.password);
  const role = data.role === 'admin' ? 'admin' : 'user';

  if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
    errors.push('Username phải dài 3-50 ký tự và chỉ gồm chữ, số hoặc dấu gạch dưới.');
  }
  if (!isEmail(email) || email.length > 120) {
    errors.push('Email không hợp lệ.');
  }
  if (mode === 'create' && password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự.');
  }
  if (mode === 'edit' && password && password.length < 6) {
    errors.push('Mật khẩu mới phải có ít nhất 6 ký tự.');
  }

  return { errors, values: { username, email, password, role } };
}

function validateCategoryName(value) {
  const name = clean(value);
  const errors = [];
  if (name.length < 2) errors.push('Tên category phải có ít nhất 2 ký tự.');
  if (name.length > 80) errors.push('Tên category không được vượt quá 80 ký tự.');
  return { errors, name };
}

function validateContact(data, sessionUser) {
  const errors = [];
  const name = clean(data.name) || (sessionUser ? sessionUser.username : '');
  const email = sessionUser ? sessionUser.email : clean(data.email);
  const subject = clean(data.subject) || 'Góp ý website';
  const message = clean(data.message);

  if (name.length < 2 || name.length > 100) errors.push('Họ tên phải có từ 2 đến 100 ký tự.');
  if (!isEmail(email)) errors.push('Email không hợp lệ.');
  if (subject.length > 200) errors.push('Tiêu đề không được vượt quá 200 ký tự.');
  if (message.length < 5 || message.length > 3000) errors.push('Nội dung phải có từ 5 đến 3000 ký tự.');

  return { errors, values: { name, email, subject, message } };
}

function validateComment(data) {
  const errors = [];
  const content = clean(data.content);
  const numericRating = Number(data.rating);

  if (content.length < 5 || content.length > 2000) errors.push('Bình luận phải có từ 5 đến 2000 ký tự.');
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) errors.push('Điểm đánh giá phải nằm trong khoảng 1 đến 5.');

  return { errors, values: { content, rating: numericRating } };
}

module.exports = {
  clean,
  isEmail,
  validateBook,
  validateUser,
  validateCategoryName,
  validateContact,
  validateComment
};
