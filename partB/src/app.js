const express = require('express');
const app     = express();

app.use(express.json());

// Routes
app.use('/books',        require('./routes/books'));
app.use('/members',      require('./routes/members'));
app.use('/loans',        require('./routes/loans'));
app.use('/reservations', require('./routes/reservations'));

// 404 ба алдааны handler
const { notFound, errorHandler } = require('./middleware/errors');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Library API → http://localhost:${PORT}`));

module.exports = app;
