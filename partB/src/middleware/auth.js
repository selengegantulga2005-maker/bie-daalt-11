/**
 * Энгийн токен баталгаажуулалт.
 * Бодит системд JWT ашиглана.
 */

const { getMemberById } = require('../data/store');
const { problemDetails } = require('./errors');

// Энгийн in-memory токен хадгалагч
const tokens = new Map();

function generateToken(memberId) {
  const token = `tok_${memberId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  tokens.set(token, memberId);
  return token;
}

function authenticate(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return problemDetails(res, 401, 'unauthorized', 'Unauthorized', 'Authorization токен шаардлагатай.');
  }
  const memberId = tokens.get(token);
  if (!memberId) {
    return problemDetails(res, 401, 'unauthorized', 'Unauthorized', 'Токен хүчингүй эсвэл дууссан.');
  }
  req.currentUser = getMemberById(memberId);
  if (!req.currentUser) {
    return problemDetails(res, 401, 'unauthorized', 'Unauthorized', 'Хэрэглэгч олдсонгүй.');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.currentUser?.role !== 'admin') {
    return problemDetails(res, 403, 'forbidden', 'Forbidden', 'Зөвхөн админ хандах эрхтэй.');
  }
  next();
}

module.exports = { generateToken, authenticate, requireAdmin, tokens };
