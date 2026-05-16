function toPositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPagination(req, totalItems, perPage = 6) {
  const requestedPage = toPositiveInt(req.query.page, 1);
  const totalPages = Math.ceil(totalItems / perPage);
  const currentPage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
  const offset = totalPages === 0 ? 0 : (currentPage - 1) * perPage;

  return {
    requestedPage,
    currentPage,
    totalPages,
    totalItems,
    perPage,
    offset,
    hasPagination: totalPages > 1,
    hasPrevious: totalPages > 1 && currentPage > 1,
    hasNext: totalPages > 1 && currentPage < totalPages,
    isOutOfRange: totalPages > 0 && requestedPage > totalPages
  };
}

function buildPageUrl(req, page) {
  const query = new URLSearchParams(req.query || {});
  query.set('page', String(page));
  const qs = query.toString();
  return `${req.path}${qs ? `?${qs}` : ''}`;
}

module.exports = {
  getPagination,
  buildPageUrl
};
