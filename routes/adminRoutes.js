const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const adminOnly = require('../middleware/adminOnly');
const { getPagination, buildPageUrl } = require('../utils/pagination');
const { validateBook, validateUser, validateCategoryName } = require('../utils/validation');
const { setFlash } = require('../middleware/flash');

const router = express.Router();
router.use(adminOnly);

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function getCategories() {
  const [rows] = await db.query('SELECT name FROM categories ORDER BY name ASC');
  return rows.map((row) => row.name);
}

async function renderPaginated(req, res, view, title, tableSql, countSql, params, dataKey, perPage = 10) {
  const [[countRow]] = await db.query(countSql, params);
  const pagination = getPagination(req, countRow.total, perPage);
  const [rows] = await db.query(`${tableSql} LIMIT ? OFFSET ?`, [...params, pagination.perPage, pagination.offset]);
  res.render(view, {
    title,
    [dataKey]: rows,
    pagination,
    buildPageUrl: (page) => buildPageUrl(req, page)
  });
}

router.get('/dashboard', async (req, res, next) => {
  try {
    const [[stats]] = await db.query('SELECT total_views FROM site_stats WHERE id = 1');
    const [[bookCount]] = await db.query('SELECT COUNT(*) AS total FROM books');
    const [[userCount]] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [[commentCount]] = await db.query('SELECT COUNT(*) AS total FROM comments');
    const [[contactCount]] = await db.query('SELECT COUNT(*) AS total FROM contacts');
    const [[categoryCount]] = await db.query('SELECT COUNT(*) AS total FROM categories');

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats,
      bookCount,
      userCount,
      commentCount,
      contactCount,
      categoryCount
    });
  } catch (err) {
    next(err);
  }
});

router.get('/books', async (req, res, next) => {
  try {
    await renderPaginated(
      req,
      res,
      'admin/books',
      'Quản lý sách',
      'SELECT * FROM books ORDER BY updated_at DESC, created_at DESC',
      'SELECT COUNT(*) AS total FROM books',
      [],
      'books',
      8
    );
  } catch (err) {
    next(err);
  }
});

router.get('/books/create', async (req, res, next) => {
  try {
    res.render('admin/book-form', {
      title: 'Thêm sách',
      mode: 'create',
      book: {},
      categories: await getCategories(),
      error: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/books/create', async (req, res, next) => {
  try {
    const categories = await getCategories();
    const { errors, values } = validateBook(req.body, categories);

    if (errors.length) {
      return res.status(400).render('admin/book-form', {
        title: 'Thêm sách',
        mode: 'create',
        book: values,
        categories,
        error: errors.join(' ')
      });
    }

    await db.query(
      'INSERT INTO books (title, author, category, cover_image, description, review_content) VALUES (?, ?, ?, ?, ?, ?)',
      [values.title, values.author, values.category, values.cover_image, values.description, values.review_content]
    );
    setFlash(req, 'success', `Đã thêm sách "${values.title}".`);
    res.redirect('/admin/books');
  } catch (err) {
    next(err);
  }
});

router.get('/books/:id/edit', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!rows[0]) {
      setFlash(req, 'error', 'Không tìm thấy sách cần sửa.');
      return res.redirect('/admin/books');
    }
    res.render('admin/book-form', {
      title: 'Sửa sách',
      mode: 'edit',
      book: rows[0],
      categories: await getCategories(),
      error: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/books/:id/edit', async (req, res, next) => {
  try {
    const categories = await getCategories();
    const { errors, values } = validateBook(req.body, categories);

    if (errors.length) {
      return res.status(400).render('admin/book-form', {
        title: 'Sửa sách',
        mode: 'edit',
        book: { id: req.params.id, ...values },
        categories,
        error: errors.join(' ')
      });
    }

    const [result] = await db.query(
      `UPDATE books
       SET title = ?, author = ?, category = ?, cover_image = ?, description = ?, review_content = ?, updated_at = NOW()
       WHERE id = ?`,
      [values.title, values.author, values.category, values.cover_image, values.description, values.review_content, req.params.id]
    );

    setFlash(req, result.affectedRows ? 'success' : 'error', result.affectedRows ? 'Đã cập nhật sách.' : 'Không tìm thấy sách cần cập nhật.');
    res.redirect('/admin/books');
  } catch (err) {
    next(err);
  }
});

router.post('/books/:id/delete', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    setFlash(req, result.affectedRows ? 'success' : 'error', result.affectedRows ? 'Đã xóa sách và các bình luận liên quan.' : 'Không tìm thấy sách cần xóa.');
    res.redirect('/admin/books');
  } catch (err) {
    next(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const [categories] = await db.query(`
      SELECT cat.*, COUNT(b.id) AS book_count
      FROM categories cat
      LEFT JOIN books b ON b.category = cat.name
      GROUP BY cat.id
      ORDER BY cat.name ASC
    `);
    res.render('admin/categories', { title: 'Quản lý category', categories, error: null });
  } catch (err) {
    next(err);
  }
});

router.post('/categories/create', async (req, res, next) => {
  try {
    const { errors, name } = validateCategoryName(req.body.name);
    if (errors.length) {
      const [categories] = await db.query(`
        SELECT cat.*, COUNT(b.id) AS book_count
        FROM categories cat
        LEFT JOIN books b ON b.category = cat.name
        GROUP BY cat.id
        ORDER BY cat.name ASC
      `);
      return res.status(400).render('admin/categories', { title: 'Quản lý category', categories, error: errors.join(' ') });
    }

    await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
    setFlash(req, 'success', `Đã thêm category "${name}".`);
    res.redirect('/admin/categories');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      setFlash(req, 'error', 'Category này đã tồn tại.');
      return res.redirect('/admin/categories');
    }
    next(err);
  }
});

router.get('/categories/:id/edit', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!rows[0]) {
      setFlash(req, 'error', 'Không tìm thấy category cần sửa.');
      return res.redirect('/admin/categories');
    }

    res.render('admin/category-form', {
      title: 'Sửa category',
      category: rows[0],
      error: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/categories/:id/edit', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { errors, name } = validateCategoryName(req.body.name);
    const [rows] = await conn.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    const category = rows[0];

    if (!category) {
      conn.release();
      setFlash(req, 'error', 'Không tìm thấy category cần sửa.');
      return res.redirect('/admin/categories');
    }

    if (errors.length) {
      conn.release();
      return res.status(400).render('admin/category-form', {
        title: 'Sửa category',
        category: { id: req.params.id, name },
        error: errors.join(' ')
      });
    }

    await conn.beginTransaction();
    await conn.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
    await conn.query('UPDATE books SET category = ? WHERE category = ?', [name, category.name]);
    await conn.commit();
    conn.release();

    setFlash(req, 'success', `Đã đổi category "${category.name}" thành "${name}" và cập nhật các sách liên quan.`);
    res.redirect('/admin/categories');
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('admin/category-form', {
        title: 'Sửa category',
        category: { id: req.params.id, name: req.body.name },
        error: 'Category này đã tồn tại.'
      });
    }
    next(err);
  }
});

router.post('/categories/:id/delete', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT name FROM categories WHERE id = ?', [req.params.id]);
    const category = rows[0];
    if (!category) {
      conn.release();
      setFlash(req, 'error', 'Không tìm thấy category cần xóa.');
      return res.redirect('/admin/categories');
    }

    const [[bookCount]] = await conn.query('SELECT COUNT(*) AS total FROM books WHERE category = ?', [category.name]);
    const [fallbackRows] = await conn.query('SELECT name FROM categories WHERE id <> ? ORDER BY id ASC LIMIT 1', [req.params.id]);
    const fallback = fallbackRows[0];

    if (bookCount.total > 0 && !fallback) {
      conn.release();
      setFlash(req, 'error', `Không thể xóa category "${category.name}" vì đây là category duy nhất và đang có sách sử dụng.`);
      return res.redirect('/admin/categories');
    }

    await conn.beginTransaction();
    if (bookCount.total > 0) {
      await conn.query('UPDATE books SET category = ? WHERE category = ?', [fallback.name, category.name]);
    }
    await conn.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    await conn.commit();
    conn.release();

    const movedMessage = bookCount.total > 0 ? ` ${bookCount.total} sách liên quan đã được chuyển sang category "${fallback.name}".` : '';
    setFlash(req, 'success', `Đã xóa category "${category.name}".${movedMessage}`);
    res.redirect('/admin/categories');
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    await renderPaginated(
      req,
      res,
      'admin/users',
      'Người dùng',
      `SELECT id, username, email, role, last_seen_at, created_at,
        CASE WHEN last_seen_at IS NOT NULL AND last_seen_at >= (NOW() - INTERVAL 5 MINUTE) THEN 1 ELSE 0 END AS is_online
       FROM users
       ORDER BY created_at DESC`,
      'SELECT COUNT(*) AS total FROM users',
      [],
      'users',
      10
    );
  } catch (err) {
    next(err);
  }
});

router.get('/users/create', (req, res) => {
  res.render('admin/user-form', {
    title: 'Thêm người dùng',
    mode: 'create',
    user: { role: 'user' },
    error: null
  });
});

router.post('/users/create', async (req, res, next) => {
  try {
    const { errors, values } = validateUser(req.body, 'create');

    if (errors.length) {
      return res.status(400).render('admin/user-form', {
        title: 'Thêm người dùng',
        mode: 'create',
        user: values,
        error: errors.join(' ')
      });
    }

    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [values.username, values.email, hashPassword(values.password), values.role]
    );

    setFlash(req, 'success', `Đã thêm user "${values.username}".`);
    res.redirect('/admin/users');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('admin/user-form', {
        title: 'Thêm người dùng',
        mode: 'create',
        user: req.body,
        error: 'Username hoặc email đã tồn tại.'
      });
    }
    next(err);
  }
});

router.get('/users/:id/edit', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!rows[0]) {
      setFlash(req, 'error', 'Không tìm thấy user cần sửa.');
      return res.redirect('/admin/users');
    }
    res.render('admin/user-form', {
      title: 'Sửa người dùng',
      mode: 'edit',
      user: rows[0],
      error: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/edit', async (req, res, next) => {
  try {
    const { errors, values } = validateUser(req.body, 'edit');

    if (errors.length) {
      return res.status(400).render('admin/user-form', {
        title: 'Sửa người dùng',
        mode: 'edit',
        user: { id: req.params.id, ...values },
        error: errors.join(' ')
      });
    }

    if (values.password) {
      await db.query(
        'UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?',
        [values.username, values.email, hashPassword(values.password), values.role, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [values.username, values.email, values.role, req.params.id]
      );
    }

    if (req.session.user && Number(req.session.user.id) === Number(req.params.id)) {
      req.session.user.username = values.username;
      req.session.user.email = values.email;
      req.session.user.role = values.role;
    }

    setFlash(req, 'success', 'Đã cập nhật user.');
    res.redirect('/admin/users');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('admin/user-form', {
        title: 'Sửa người dùng',
        mode: 'edit',
        user: { id: req.params.id, ...req.body },
        error: 'Username hoặc email đã tồn tại.'
      });
    }
    next(err);
  }
});

router.post('/users/:id/delete', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [req.params.id]);
    const user = rows[0];

    if (!user) {
      setFlash(req, 'error', 'Không tìm thấy user cần xóa.');
      return res.redirect('/admin/users');
    }

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    if (req.session.user && Number(req.session.user.id) === Number(req.params.id)) {
      return req.session.destroy(() => {
        res.redirect('/login');
      });
    }

    setFlash(req, 'success', `Đã xóa tài khoản "${user.username}" (${user.role}). Các bình luận cũ vẫn được giữ lại.`);
    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
});

router.get('/comments', async (req, res, next) => {
  try {
    await renderPaginated(
      req,
      res,
      'admin/comments',
      'Bình luận',
      `SELECT c.*, b.title AS book_title
       FROM comments c
       JOIN books b ON b.id = c.book_id
       ORDER BY c.created_at DESC`,
      `SELECT COUNT(*) AS total
       FROM comments c
       JOIN books b ON b.id = c.book_id`,
      [],
      'comments',
      10
    );
  } catch (err) {
    next(err);
  }
});

router.post('/comments/:id/delete', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    setFlash(req, result.affectedRows ? 'success' : 'error', result.affectedRows ? 'Đã xóa bình luận.' : 'Không tìm thấy bình luận cần xóa.');
    res.redirect('/admin/comments');
  } catch (err) {
    next(err);
  }
});

router.get('/contacts', async (req, res, next) => {
  try {
    await renderPaginated(
      req,
      res,
      'admin/contacts',
      'Liên hệ',
      'SELECT * FROM contacts ORDER BY created_at DESC',
      'SELECT COUNT(*) AS total FROM contacts',
      [],
      'contacts',
      10
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
