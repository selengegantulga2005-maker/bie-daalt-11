const express = require('express');
const router  = express.Router();

const store   = require('../data/store');
const { problemDetails } = require('../middleware/errors');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { paginate } = require('../middleware/paginate');

// GET /books — жагсаалт (pagination, search, sort)
router.get('/', (req, res) => {
  const { data, meta } = paginate(store.getAllBooks(), req.query);
  res.json({ data, meta });
});

// GET /books/:id — дэлгэрэнгүй
router.get('/:id', (req, res) => {
  const book = store.getBookById(req.params.id);
  if (!book) return problemDetails(res, 404, 'book-not-found', 'Book Not Found', `id=${req.params.id} ном олдсонгүй.`);
  res.json(book);
});

// POST /books — шинэ ном (admin)
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { isbn, title, author, totalCopies } = req.body;
  if (!isbn || !title || !author || isbn.trim() === '' || title.trim() === '' || author.trim() === '') {
    return problemDetails(res, 422, 'validation-error', 'Validation Error', 'isbn, title, author заавал шаардлагатай бөгөөд хоосон байж болохгүй.');
  }
  const book = store.createBook({ isbn, title, author, totalCopies: totalCopies ?? 1 });
  res.status(201).json(book);
});

// PUT /books/:id — засах (admin)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const book = store.updateBook(req.params.id, req.body);
  if (!book) return problemDetails(res, 404, 'book-not-found', 'Book Not Found', `id=${req.params.id} ном олдсонгүй.`);
  res.json(book);
});

// DELETE /books/:id — устгах (admin)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  if (!store.getBookById(req.params.id)) {
    return problemDetails(res, 404, 'book-not-found', 'Book Not Found', `id=${req.params.id} ном олдсонгүй.`);
  }
  store.deleteBook(req.params.id);
  res.status(204).end();
});

module.exports = router;
