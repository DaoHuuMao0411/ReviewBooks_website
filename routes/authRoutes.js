const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const { validateUser } = require('../utils/validation');
const { setFlash } = require('../middleware/flash');

const router = express.Router();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, originalHash] = stored.split(':');
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(testHash, 'hex'));
}

router.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Đăng nhập',
    error: null,
    next: req.query.next || ''
  });
});

router.post('/login', async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const nextUrl = req.body.next || '';

    if (!username || !password) {
      return res.status(400).render('pages/login', {
        title: 'Đăng nhập',
        error: 'Vui lòng nhập username và mật khẩu.',
        next: nextUrl
      });
    }

    const [rows] = await db.query('SELECT id, username, email, password, role FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).render('pages/login', {
        title: 'Đăng nhập',
        error: 'Tên đăng nhập hoặc mật khẩu không đúng.',
        next: nextUrl || ''
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    await db.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [user.id]);

    setFlash(req, 'success', `Đăng nhập thành công. Xin chào ${user.username}.`);
    if (nextUrl) return res.redirect(nextUrl);
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/');
  } catch (err) {
    next(err);
  }
});

router.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Đăng ký',
    error: null
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const { confirmPassword } = req.body;
    const { errors, values } = validateUser(req.body, 'create');

    if (values.password !== confirmPassword) {
      errors.push('Mật khẩu xác nhận không khớp.');
    }

    if (errors.length) {
      return res.status(400).render('pages/register', {
        title: 'Đăng ký',
        error: errors.join(' ')
      });
    }

    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [values.username, values.email, hashPassword(values.password), 'user']
    );

    setFlash(req, 'success', 'Đăng ký thành công. Bạn có thể đăng nhập ngay.');
    res.redirect('/login');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('pages/register', {
        title: 'Đăng ký',
        error: 'Username hoặc email đã tồn tại.'
      });
    }
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
