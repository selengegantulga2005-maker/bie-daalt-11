/**
 * In-memory өгөгдлийн сан.
 * Бодит системд энийг DB-ээр солино.
 */

let bookIdCounter    = 1;
let memberIdCounter  = 1;
let loanIdCounter    = 1;
let reservationIdCounter = 1;

const books       = new Map();
const members     = new Map();
const loans       = new Map();
const reservations = new Map();

// ─── Жишээ өгөгдөл ───────────────────────────

const sampleBooks = [
  { id: 'b1', isbn: '978-0-13-468599-1', title: 'The Pragmatic Programmer', author: 'David Thomas', totalCopies: 3, availableCopies: 3 },
  { id: 'b2', isbn: '978-0-13-235088-4', title: 'Clean Code', author: 'Robert C. Martin', totalCopies: 2, availableCopies: 2 },
  { id: 'b3', isbn: '978-0-596-51774-8', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', totalCopies: 4, availableCopies: 4 },
];

const sampleMembers = [
  { id: 'm1', name: 'Батбаяр', email: 'bat@example.com', passwordHash: 'hash1', role: 'member' },
  { id: 'm2', name: 'Сарнай',  email: 'sar@example.com', passwordHash: 'hash2', role: 'member' },
  { id: 'm3', name: 'Admin',   email: 'admin@lib.mn',    passwordHash: 'adminhash', role: 'admin' },
];

sampleBooks.forEach(b => books.set(b.id, b));
sampleMembers.forEach(m => members.set(m.id, m));

// ─── CRUD тусламж функцүүд ───────────────────

function getAllBooks() { return [...books.values()]; }
function getBookById(id) { return books.get(id); }
function createBook(data) {
  const id = `b${bookIdCounter++}`;
  const book = { id, ...data, totalCopies: data.totalCopies ?? 1, availableCopies: data.totalCopies ?? 1 };
  books.set(id, book);
  return book;
}
function updateBook(id, data) {
  const book = books.get(id);
  if (!book) return null;
  Object.assign(book, data);
  return book;
}
function deleteBook(id) { return books.delete(id); }

function getAllMembers() { return [...members.values()]; }
function getMemberById(id) { return members.get(id); }
function getMemberByEmail(email) { return [...members.values()].find(m => m.email === email); }
function createMember(data) {
  const id = `m${memberIdCounter++}`;
  const member = { id, ...data, role: 'member' };
  members.set(id, member);
  return member;
}

function getAllLoans() { return [...loans.values()]; }
function getLoanById(id) { return loans.get(id); }
function createLoan(memberId, bookId) {
  const id = `l${loanIdCounter++}`;
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const loan = { id, memberId, bookId, borrowedAt: new Date().toISOString(), dueDate, returnedAt: null, extended: false };
  loans.set(id, loan);
  return loan;
}
function getActiveLoansByMember(memberId) {
  return [...loans.values()].filter(l => l.memberId === memberId && !l.returnedAt);
}
function returnLoan(loanId) {
  const loan = loans.get(loanId);
  if (!loan) return null;
  loan.returnedAt = new Date().toISOString();
  return loan;
}
function extendLoan(loanId) {
  const loan = loans.get(loanId);
  if (!loan || loan.extended) return null;
  loan.dueDate = new Date(new Date(loan.dueDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  loan.extended = true;
  return loan;
}

function getAllReservations() { return [...reservations.values()]; }
function getReservationById(id) { return reservations.get(id); }
function createReservation(memberId, bookId) {
  const id = `r${reservationIdCounter++}`;
  const res = { id, memberId, bookId, createdAt: new Date().toISOString(), status: 'pending' };
  reservations.set(id, res);
  return res;
}
function cancelReservation(id) {
  const res = reservations.get(id);
  if (!res) return null;
  res.status = 'cancelled';
  return res;
}

module.exports = {
  getAllBooks, getBookById, createBook, updateBook, deleteBook,
  getAllMembers, getMemberById, getMemberByEmail, createMember,
  getAllLoans, getLoanById, createLoan, getActiveLoansByMember, returnLoan, extendLoan,
  getAllReservations, getReservationById, createReservation, cancelReservation,
};
