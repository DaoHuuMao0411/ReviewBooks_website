function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function flashMiddleware(req, res, next) {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.setFlash = (type, message) => setFlash(req, type, message);
  next();
}

module.exports = flashMiddleware;
module.exports.setFlash = setFlash;
