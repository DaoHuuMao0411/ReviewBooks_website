function adminOnly(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }

  if (req.session.user.role !== 'admin') {
    return res.status(403).render('pages/error', {
      title: 'Không có quyền truy cập',
      message: 'Trang này chỉ dành cho quản trị viên.'
    });
  }

  next();
}

module.exports = adminOnly;
