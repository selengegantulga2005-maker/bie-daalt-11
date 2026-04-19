const express = require('express');
const router  = express.Router();

const store   = require('../data/store');
const { authenticate } = require('../middleware/auth');
const { problemDetails } = require('../middleware/errors');
const { paginate } = require('../middleware/paginate');

const MAX_LOANS = 5;

// GET /loans — бүх зээл (өөрийнхөө зээл харна)
router.get('/', authenticate, (req, res) => {
  let all = store.getAllLoans();
  if (req.currentUser.role !== 'admin') {
    all = all.filter(l => l.memberId === req.currentUser.id);
  }
  const { data, meta } = paginate(all, req.query);
  res.json({ data, meta });
});

// GET /loans/:id
router.get('/:id', authenticate, (req, res) => {
  const loan = store.getLoanById(req.params.id);
  if (!loan) return problemDetails(res, 404, 'loan-not-found', 'Loan Not Found', `id=${req.params.id} зээл олдсонгүй.`);
  if (req.currentUser.role !== 'admin' && loan.memberId !== req.currentUser.id) {
    return problemDetails(res, 403, 'forbidden', 'Forbidden', 'Энэ зээлд хандах эрхгүй.');
  }
  res.json(loan);
});

// POST /loans — ном зээлэх
router.post('/', authenticate, (req, res) => {
  const { bookId } = req.body;
  if (!bookId) {
    return problemDetails(res, 422, 'validation-error', 'Validation Error', 'bookId шаардлагатай.');
  }

  const book = store.getBookById(bookId);
  if (!book) return problemDetails(res, 404, 'book-not-found', 'Book Not Found', `id=${bookId} ном олдсонгүй.`);

  if (book.availableCopies <= 0) {
    return problemDetails(res, 409, 'book-unavailable', 'Book Unavailable', 'Тухайн номын хуулбар байхгүй байна.');
  }

  const activeLoans = store.getActiveLoansByMember(req.currentUser.id);
  if (activeLoans.length >= MAX_LOANS) {
    return problemDetails(res, 409, 'loan-limit-exceeded', 'Loan Limit Exceeded',
      `Нэгэн зэрэг ${MAX_LOANS}-аас илүү ном зээлэх боломжгүй.`);
  }

  book.availableCopies--;
  const loan = store.createLoan(req.currentUser.id, bookId);
  res.status(201).json(loan);
});

// POST /loans/:id/return — ном буцаах
router.post('/:id/return', authenticate, (req, res) => {
  const loan = store.getLoanById(req.params.id);
  if (!loan) return problemDetails(res, 404, 'loan-not-found', 'Loan Not Found', `id=${req.params.id} зээл олдсонгүй.`);
  if (loan.returnedAt) return problemDetails(res, 409, 'already-returned', 'Already Returned', 'Ном аль хэдийн буцаагдсан.');
  if (req.currentUser.role !== 'admin' && loan.memberId !== req.currentUser.id) {
    return problemDetails(res, 403, 'forbidden', 'Forbidden', 'Энэ зээлд хандах эрхгүй.');
  }

  const book = store.getBookById(loan.bookId);
  if (book) book.availableCopies++;
  const updated = store.returnLoan(req.params.id);
  res.json(updated);
});

// POST /loans/:id/extend — хугацаа сунгах
router.post('/:id/extend', authenticate, (req, res) => {
  const loan = store.getLoanById(req.params.id);
  if (!loan) return problemDetails(res, 404, 'loan-not-found', 'Loan Not Found', `id=${req.params.id} зээл олдсонгүй.`);
  if (loan.returnedAt) return problemDetails(res, 409, 'already-returned', 'Already Returned', 'Буцаагдсан зээлийг сунгах боломжгүй.');
  if (loan.extended) return problemDetails(res, 409, 'already-extended', 'Already Extended', '1 удаагийн сунгалт аль хэдийн ашиглагдсан.');
  if (req.currentUser.role !== 'admin' && loan.memberId !== req.currentUser.id) {
    return problemDetails(res, 403, 'forbidden', 'Forbidden', 'Энэ зээлд хандах эрхгүй.');
  }

  const updated = store.extendLoan(req.params.id);
  res.json(updated);
});

module.exports = router;
