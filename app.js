const path = require('path');
const express = require('express');
const session = require('express-session');
const viewCounter = require('./middleware/viewCounter');
const flashMiddleware = require('./middleware/flash');
const userActivity = require('./middleware/userActivity');

const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'review-books-local-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2,
    sameSite: 'lax'
  }
}));

app.use(flashMiddleware);
app.use(userActivity);
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

app.use(viewCounter);
app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Không tìm thấy trang',
    message: 'Trang bạn yêu cầu không tồn tại.'
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('pages/error', {
    title: 'Lỗi hệ thống',
    message: 'Có lỗi xảy ra. Vui lòng kiểm tra cấu hình database hoặc server local.'
  });
});

app.listen(PORT, () => {
  console.log(`Review Books running at http://localhost:${PORT}`);
});
