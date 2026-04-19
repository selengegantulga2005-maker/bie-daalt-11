const express = require('express');
const router  = express.Router();

const store   = require('../data/store');
const { authenticate } = require('../middleware/auth');
const { problemDetails } = require('../middleware/errors');
const { paginate } = require('../middleware/paginate');

// GET /reservations
router.get('/', authenticate, (req, res) => {
  let all = store.getAllReservations();
  if (req.currentUser.role !== 'admin') {
    all = all.filter(r => r.memberId === req.currentUser.id);
  }
  const { data, meta } = paginate(all, req.query);
  res.json({ data, meta });
});

// GET /reservations/:id
router.get('/:id', authenticate, (req, res) => {
  const res_ = store.getReservationById(req.params.id);
  if (!res_) return problemDetails(res, 404, 'reservation-not-found', 'Reservation Not Found', `id=${req.params.id} захиалга олдсонгүй.`);
  res.json(res_);
});

// POST /reservations — захиалах
router.post('/', authenticate, (req, res) => {
  const { bookId } = req.body;
  if (!bookId) return problemDetails(res, 422, 'validation-error', 'Validation Error', 'bookId шаардлагатай.');
  const book = store.getBookById(bookId);
  if (!book) return problemDetails(res, 404, 'book-not-found', 'Book Not Found', `id=${bookId} ном олдсонгүй.`);

  // Давхар захиалга шалгах
  const existing = store.getAllReservations().find(
    r => r.memberId === req.currentUser.id && r.bookId === bookId && r.status === 'pending'
  );
  if (existing) {
    return problemDetails(res, 409, 'duplicate-reservation', 'Duplicate Reservation',
      `Та энэ номыг аль хэдийн захиалсан байна (id=${existing.id}).`);
  }

  const reservation = store.createReservation(req.currentUser.id, bookId);
  res.status(201).json(reservation);
});

// DELETE /reservations/:id — цуцлах
router.delete('/:id', authenticate, (req, res) => {
  const reservation = store.getReservationById(req.params.id);
  if (!reservation) return problemDetails(res, 404, 'reservation-not-found', 'Reservation Not Found', `id=${req.params.id} захиалга олдсонгүй.`);
  if (req.currentUser.role !== 'admin' && reservation.memberId !== req.currentUser.id) {
    return problemDetails(res, 403, 'forbidden', 'Forbidden', 'Энэ захиалгад хандах эрхгүй.');
  }
  store.cancelReservation(req.params.id);
  res.status(204).end();
});

module.exports = router;
