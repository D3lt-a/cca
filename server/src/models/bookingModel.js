const pool = require('../config/db');

const mapRoute = (row) => ({
  routeID: row.routeID,
  ownerUserID: row.userID,
  startPoint: row.startPoint,
  endPoint: row.endPoint,
  duration: row.duration,
  price: row.price,
  availableSeats: row.availableSeats,
  remainingSeats: row.remainingSeats,
});

const loginSession = async (userID) => {
  const [rows] = await pool.execute('SELECT userID FROM users WHERE userID = ?', [userID]);
  return rows[0] || null;
};

const createRoute = async (routeData) => {
  const { userID, startPoint, endPoint, duration, price, availableSeats } = routeData;
  const [result] = await pool.execute(
    `INSERT INTO routes (userID, startPoint, endPoint, duration, price, availableSeats, remainingSeats)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userID, startPoint, endPoint, duration, price, availableSeats, availableSeats],
  );

  const [rows] = await pool.execute('SELECT * FROM routes WHERE routeID = ?', [result.insertId]);
  return mapRoute(rows[0]);
};

const searchRoutes = async (filters) => {
  const { startPoint = '', endPoint = '' } = filters;
  const [rows] = await pool.execute(
    `SELECT *
     FROM routes
     WHERE remainingSeats > 0
       AND startPoint LIKE ?
       AND endPoint LIKE ?
     ORDER BY routeID DESC`,
    [`%${startPoint}%`, `%${endPoint}%`],
  );
  return rows.map(mapRoute);
};

const joinRoute = async ({ routeID, passengerUserID }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [routeRows] = await connection.execute('SELECT * FROM routes WHERE routeID = ? FOR UPDATE', [
      routeID,
    ]);
    if (routeRows.length === 0) {
      throw new Error('ROUTE_NOT_FOUND');
    }

    const route = routeRows[0];
    if (route.userID === passengerUserID) {
      throw new Error('OWNER_CANNOT_JOIN_OWN_ROUTE');
    }

    if (route.remainingSeats <= 0) {
      throw new Error('NO_SEATS_AVAILABLE');
    }

    const [existingBookingRows] = await connection.execute(
      'SELECT bookID FROM bookings WHERE userID = ? AND routeID = ?',
      [passengerUserID, routeID],
    );
    if (existingBookingRows.length > 0) {
      throw new Error('ALREADY_JOINED');
    }

    const newRemainingSeats = route.remainingSeats - 1;

    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings (userID, routeID, available_seats, remaining_seats)
       VALUES (?, ?, ?, ?)`,
      [passengerUserID, routeID, route.availableSeats, newRemainingSeats],
    );

    await connection.execute('UPDATE routes SET remainingSeats = ? WHERE routeID = ?', [
      newRemainingSeats,
      routeID,
    ]);

    await connection.commit();

    return {
      bookID: bookingResult.insertId,
      routeID,
      userID: passengerUserID,
      remainingSeats: newRemainingSeats,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const cancelBooking = async ({ bookID, passengerUserID }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [bookingRows] = await connection.execute(
      'SELECT bookID, routeID FROM bookings WHERE bookID = ? AND userID = ?',
      [bookID, passengerUserID],
    );
    if (bookingRows.length === 0) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    const booking = bookingRows[0];
    const [routeRows] = await connection.execute('SELECT * FROM routes WHERE routeID = ? FOR UPDATE', [
      booking.routeID,
    ]);
    if (routeRows.length === 0) {
      throw new Error('ROUTE_NOT_FOUND');
    }

    const route = routeRows[0];
    const newRemainingSeats = Math.min(route.availableSeats, route.remainingSeats + 1);

    await connection.execute('DELETE FROM bookings WHERE bookID = ?', [bookID]);
    await connection.execute('UPDATE routes SET remainingSeats = ? WHERE routeID = ?', [
      newRemainingSeats,
      booking.routeID,
    ]);

    await connection.commit();
    return { bookID, routeID: booking.routeID, remainingSeats: newRemainingSeats };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getMyBookings = async (userID) => {
  const [rows] = await pool.execute(
    `SELECT
      b.bookID,
      b.routeID,
      b.userID,
      r.startPoint,
      r.endPoint,
      r.duration,
      r.price,
      r.remainingSeats
    FROM bookings b
    INNER JOIN routes r ON r.routeID = b.routeID
    WHERE b.userID = ?
    ORDER BY b.bookID DESC`,
    [userID],
  );
  return rows;
};

module.exports = {
  loginSession,
  createRoute,
  searchRoutes,
  joinRoute,
  cancelBooking,
  getMyBookings,
};
