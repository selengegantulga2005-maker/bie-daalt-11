/**
 * Алдааны middleware — RFC 7807 Problem Details формат.
 */

function problemDetails(res, status, type, title, detail, extra = {}) {
  return res.status(status)
    .set('Content-Type', 'application/problem+json')
    .json({ type: `https://library.mn/problems/${type}`, title, status, detail, ...extra });
}

function notFound(req, res) {
  return problemDetails(res, 404, 'not-found', 'Not Found', `${req.method} ${req.path} олдсонгүй.`);
}

function errorHandler(err, req, res, _next) {
  console.error(err);
  return problemDetails(res, 500, 'internal-error', 'Internal Server Error', err.message);
}

module.exports = { problemDetails, notFound, errorHandler };
