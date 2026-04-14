const bookingModel = require('../models/bookingModel');

const formatModelError = (error) => {
  const knownErrors = {
    ROUTE_NOT_FOUND: { status: 404, message: 'Route not found.' },
    OWNER_CANNOT_JOIN_OWN_ROUTE: { status: 400, message: 'Route owner cannot join their own route.' },
    NO_SEATS_AVAILABLE: { status: 409, message: 'No seats available for this route.' },
    ALREADY_JOINED: { status: 409, message: 'Passenger already joined this route.' },
    BOOKING_NOT_FOUND: { status: 404, message: 'Booking not found.' },
  };
  return knownErrors[error.message] || { status: 500, message: 'Unexpected server error.' };
};

const login = async (req, res) => {
  try {
    const userID = Number(req.body.userID);
    if (!userID) {
      return res.status(400).json({ error: 'Valid userID is required.' });
    }

    const user = await bookingModel.loginSession(userID);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    req.session.userID = userID;
    return res.json({ message: 'Session started.', userID });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createRoute = async (req, res) => {
  try {
    const sessionUserID = req.session.userID;
    if (!sessionUserID) {
      return res.status(401).json({ error: 'Please login first.' });
    }

    const { startPoint, endPoint, duration, price, availableSeats } = req.body;
    if (!startPoint || !endPoint || !duration || !price || !availableSeats) {
      return res.status(400).json({ error: 'All route fields are required.' });
    }

    const route = await bookingModel.createRoute({
      userID: sessionUserID,
      startPoint,
      endPoint,
      duration,
      price: Number(price),
      availableSeats: Number(availableSeats),
    });

    req.session.ownedRouteIDs = [...(req.session.ownedRouteIDs || []), route.routeID];
    return res.status(201).json(route);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const searchRoutes = async (req, res) => {
  try {
    const routes = await bookingModel.searchRoutes({
      startPoint: req.query.startPoint,
      endPoint: req.query.endPoint,
    });
    return res.json(routes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const joinRoute = async (req, res) => {
  try {
    const sessionUserID = req.session.userID;
    if (!sessionUserID) {
      return res.status(401).json({ error: 'Please login first.' });
    }

    const routeID = Number(req.params.routeID);
    const joined = await bookingModel.joinRoute({
      routeID,
      passengerUserID: sessionUserID,
    });

    return res.status(201).json(joined);
  } catch (error) {
    const formatted = formatModelError(error);
    return res.status(formatted.status).json({ error: formatted.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const sessionUserID = req.session.userID;
    if (!sessionUserID) {
      return res.status(401).json({ error: 'Please login first.' });
    }

    const bookID = Number(req.params.bookID);
    const cancelled = await bookingModel.cancelBooking({
      bookID,
      passengerUserID: sessionUserID,
    });

    return res.json(cancelled);
  } catch (error) {
    const formatted = formatModelError(error);
    return res.status(formatted.status).json({ error: formatted.message });
  }
};

const myBookings = async (req, res) => {
  try {
    const sessionUserID = req.session.userID;
    if (!sessionUserID) {
      return res.status(401).json({ error: 'Please login first.' });
    }
    const rows = await bookingModel.getMyBookings(sessionUserID);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login,
  createRoute,
  searchRoutes,
  joinRoute,
  cancelBooking,
  myBookings,
};
