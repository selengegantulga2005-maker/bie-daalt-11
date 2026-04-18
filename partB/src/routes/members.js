const express = require('express');
const router  = express.Router();

const store   = require('../data/store');
const { generateToken } = require('../middleware/auth');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { problemDetails } = require('../middleware/errors');
const { paginate } = require('../middleware/paginate');

// POST /members/login — нэвтрэх, токен авах
router.post('/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return problemDetails(res, 422, 'validation-error', 'Validation Error', 'email шаардлагатай.');
  }
  const member = store.getMemberByEmail(email);
  if (!member) {
    return problemDetails(res, 401, 'unauthorized', 'Unauthorized', 'И-мэйл эсвэл нууц үг буруу.');
  }
  const token = generateToken(member.id);
  res.json({ accessToken: token, userId: member.id, role: member.role });
});

// POST /members/register — бүртгүүлэх
router.post('/register', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return problemDetails(res, 422, 'validation-error', 'Validation Error', 'name, email шаардлагатай.');
  }
  if (store.getMemberByEmail(email)) {
    return problemDetails(res, 409, 'conflict', 'Conflict', `${email} и-мэйл аль хэдийн бүртгэлтэй.`);
  }
  const member = store.createMember({ name, email, passwordHash: 'placeholder' });
  const { passwordHash, ...safe } = member;
  res.status(201).json(safe);
});

// GET /members — жагсаалт (admin)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const safeMembers = store.getAllMembers().map(({ passwordHash, ...m }) => m);
  const { data, meta } = paginate(safeMembers, req.query);
  res.json({ data, meta });
});

// GET /members/:id — дэлгэрэнгүй
router.get('/:id', authenticate, (req, res) => {
  const member = store.getMemberById(req.params.id);
  if (!member) {
    return problemDetails(res, 404, 'member-not-found', 'Member Not Found', `id=${req.params.id} гишүүн олдсонгүй.`);
  }
  const { passwordHash, ...safe } = member;
  res.json(safe);
});

module.exports = router;
