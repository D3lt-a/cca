const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    secret: 'community-carpooling-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

app.get('/', (req, res) => {
  res.json({ message: 'Community Carpooling API is running' });
});

app.use('/api/bookings', bookingRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});