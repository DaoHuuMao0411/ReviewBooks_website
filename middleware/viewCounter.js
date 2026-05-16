const db = require('../config/db');

async function viewCounter(req, res, next) {
  try {
    if (req.method === 'GET' && !req.path.startsWith('/css') && !req.path.startsWith('/js') && !req.path.startsWith('/images')) {
      await db.query('UPDATE site_stats SET total_views = total_views + 1, updated_at = NOW() WHERE id = 1');
    }
  } catch (err) {
    console.error('View counter error:', err.message);
  }
  next();
}

module.exports = viewCounter;
