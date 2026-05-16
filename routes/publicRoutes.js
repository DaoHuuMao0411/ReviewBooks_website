const express = require('express');
const db = require('../config/db');
const requireLogin = require('../middleware/auth');
const { getPagination, buildPageUrl } = require('../utils/pagination');
const { validateContact, validateComment } = require('../utils/validation');
const { setFlash } = require('../middleware/flash');

const router = express.Router();

async function getCategories() {
  const [rows] = await db.query('SELECT name FROM categories ORDER BY name ASC');
  return rows.map((row) => row.name);
}

router.get('/', async (req, res, next) => {
  try {
    const [books] = await db.query(`
      SELECT b.*, COALESCE(ROUND(AVG(c.rating), 1), 0) AS average_rating, COUNT(c.id) AS comment_count
      FROM books b
      LEFT JOIN comments c ON c.book_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT 6
    `);
    res.render('pages/index', { title: 'Book Review Page', books });
  } catch (err) {
    next(err);
  }
});

router.get('/books', async (req, res, next) => {
  try {
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const sort = req.query.sort || 'newest';
    const perPage = 6;

    let whereSql = 'WHERE 1 = 1';
    const params = [];

    if (search) {
      whereSql += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      whereSql += ' AND b.category = ?';
      params.push(category);
    }

    const [[countRow]] = await db.query(`SELECT COUNT(*) AS total FROM books b ${whereSql}`, params);
    const pagination = getPagination(req, countRow.total, perPage);

    let orderSql = 'ORDER BY b.created_at DESC';
    if (sort === 'rating') orderSql = 'ORDER BY average_rating DESC, b.created_at DESC';
    else if (sort === 'title') orderSql = 'ORDER BY b.title ASC';

    const [books] = await db.query(`
      SELECT b.*, COALESCE(ROUND(AVG(c.rating), 1), 0) AS average_rating, COUNT(c.id) AS comment_count
      FROM books b
      LEFT JOIN comments c ON c.book_id = b.id
      ${whereSql}
      GROUP BY b.id
      ${orderSql}
      LIMIT ? OFFSET ?
    `, [...params, pagination.perPage, pagination.offset]);

    const categories = await getCategories();

    res.render('pages/books', {
      title: 'Thư viện sách',
      books,
      categories,
      search,
      category,
      sort,
      pagination,
      buildPageUrl: (page) => buildPageUrl(req, page)
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reviews', async (req, res, next) => {
  try {
    const perPage = 8;
    const [[countRow]] = await db.query('SELECT COUNT(*) AS total FROM comments');
    const pagination = getPagination(req, countRow.total, perPage);

    const [reviews] = await db.query(`
      SELECT
        c.id,
        c.book_id,
        c.user_id,
        c.name,
        c.email,
        c.content,
        c.rating,
        c.created_at,
        u.username,
        b.title AS book_title,
        b.author AS book_author,
        b.category AS book_category,
        b.cover_image AS book_cover_image
      FROM comments c
      INNER JOIN books b ON b.id = c.book_id
      LEFT JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at ASC, c.id ASC
      LIMIT ? OFFSET ?
    `, [pagination.perPage, pagination.offset]);

    res.render('pages/reviews', {
      title: 'Tất cả bình luận',
      reviews,
      pagination,
      buildPageUrl: (page) => buildPageUrl(req, page)
    });
  } catch (err) {
    next(err);
  }
});

router.get('/books/:id', async (req, res, next) => {
  try {
    const [books] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    const book = books[0];

    if (!book) {
      return res.status(404).render('pages/error', {
        title: 'Không tìm thấy sách',
        message: 'Mã sách không tồn tại.'
      });
    }

    const [comments] = await db.query(`
      SELECT c.*, u.username
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.book_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    const [ratingRows] = await db.query(
      'SELECT COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating, COUNT(*) AS total FROM comments WHERE book_id = ?',
      [req.params.id]
    );

    res.render('pages/book-detail', {
      title: book.title,
      book,
      comments,
      rating: ratingRows[0],
      error: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/books/:id/comments', requireLogin, async (req, res, next) => {
  try {
    const { errors, values } = validateComment(req.body);

    const [bookRows] = await db.query('SELECT id FROM books WHERE id = ?', [req.params.id]);
    if (!bookRows[0]) {
      return res.status(404).render('pages/error', {
        title: 'Không tìm thấy sách',
        message: 'Không thể bình luận vì sách không tồn tại.'
      });
    }

    if (errors.length) {
      setFlash(req, 'error', errors.join(' '));
      return res.redirect(`/books/${req.params.id}#reviews`);
    }

    await db.query(
      'INSERT INTO comments (book_id, user_id, name, email, content, rating) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, req.session.user.id, req.session.user.username, req.session.user.email, values.content, values.rating]
    );

    setFlash(req, 'success', 'Đã gửi bình luận thành công.');
    res.redirect(`/books/${req.params.id}#reviews`);
  } catch (err) {
    next(err);
  }
});

router.get('/about', (req, res) => {
  res.redirect('/contact');
});

router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Giới thiệu và liên hệ',
    sent: false,
    error: null,
    formData: {
      name: req.session.user ? req.session.user.username : '',
      email: req.session.user ? req.session.user.email : ''
    }
  });
});

router.post('/contact', async (req, res, next) => {
  try {
    const { errors, values } = validateContact(req.body, req.session.user);

    if (errors.length) {
      return res.status(400).render('pages/contact', {
        title: 'Giới thiệu và liên hệ',
        sent: false,
        error: errors.join(' '),
        formData: values
      });
    }

    await db.query(
      'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [values.name, values.email, values.subject, values.message]
    );

    res.render('pages/contact', {
      title: 'Giới thiệu và liên hệ',
      sent: true,
      error: null,
      formData: {
        name: req.session.user ? req.session.user.username : '',
        email: req.session.user ? req.session.user.email : ''
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
