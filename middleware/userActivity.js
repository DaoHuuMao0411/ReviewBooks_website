const db = require('../config/db');

module.exports = async function userActivity(req, res, next) {
  if (!req.session.user) return next();

  try {
    const [result] = await db.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [req.session.user.id]);
    if (result.affectedRows === 0) {
      return req.session.destroy(() => {
        res.locals.currentUser = null;
        next();
      });
    }
  } catch (err) {
    return next(err);
  }

  next();
};
