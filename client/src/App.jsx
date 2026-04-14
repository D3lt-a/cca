import { useMemo, useState } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:3000/api/bookings';

function App() {
  const [sessionUserID, setSessionUserID] = useState('');
  const [loginUserID, setLoginUserID] = useState('');
  const [message, setMessage] = useState('');

  const [routeForm, setRouteForm] = useState({
    startPoint: '',
    endPoint: '',
    duration: '',
    price: '',
    availableSeats: '',
  });

  const [filters, setFilters] = useState({ startPoint: '', endPoint: '' });
  const [routes, setRoutes] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  const loggedIn = useMemo(() => Boolean(sessionUserID), [sessionUserID]);

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  };

  const handleLogin = async () => {
    try {
      const data = await request('/session/login', {
        method: 'POST',
        body: JSON.stringify({ userID: Number(loginUserID) }),
      });
      setSessionUserID(String(data.userID));
      setMessage(`Logged in as user ${data.userID}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleCreateRoute = async () => {
    try {
      await request('/routes', {
        method: 'POST',
        body: JSON.stringify({
          ...routeForm,
          price: Number(routeForm.price),
          availableSeats: Number(routeForm.availableSeats),
        }),
      });
      setMessage('Route created successfully.');
      setRouteForm({
        startPoint: '',
        endPoint: '',
        duration: '',
        price: '',
        availableSeats: '',
      });
      await handleSearchRoutes();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleSearchRoutes = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const data = await request(`/routes?${query}`);
      setRoutes(data);
      setMessage(`Found ${data.length} route(s).`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleJoinRoute = async (routeID) => {
    try {
      await request(`/routes/${routeID}/join`, { method: 'POST' });
      setMessage('Booking completed and seat decremented atomically.');
      await Promise.all([handleSearchRoutes(), loadMyBookings()]);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadMyBookings = async () => {
    try {
      const data = await request('/my');
      setMyBookings(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const cancelBooking = async (bookID) => {
    try {
      await request(`/${bookID}`, { method: 'DELETE' });
      setMessage('Booking cancelled and seat returned.');
      await Promise.all([handleSearchRoutes(), loadMyBookings()]);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="container">
      <h1>Community Carpooling - Bookings</h1>

      <section className="card">
        <h2>1) Start Session</h2>
        <div className="row">
          <input
            type="number"
            placeholder="Enter userID"
            value={loginUserID}
            onChange={(e) => setLoginUserID(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
        <p>Current session user: {sessionUserID || 'None'}</p>
      </section>

      <section className="card">
        <h2>2) Driver: Post Route</h2>
        <div className="grid">
          <input
            placeholder="Start point"
            value={routeForm.startPoint}
            onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
          />
          <input
            placeholder="End point"
            value={routeForm.endPoint}
            onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
          />
          <input
            placeholder="Duration (e.g. 35 mins)"
            value={routeForm.duration}
            onChange={(e) => setRouteForm({ ...routeForm, duration: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            value={routeForm.price}
            onChange={(e) => setRouteForm({ ...routeForm, price: e.target.value })}
          />
          <input
            type="number"
            placeholder="Available seats"
            value={routeForm.availableSeats}
            onChange={(e) => setRouteForm({ ...routeForm, availableSeats: e.target.value })}
          />
        </div>
        <button disabled={!loggedIn} onClick={handleCreateRoute}>
          Create Route (Owner from Session)
        </button>
      </section>

      <section className="card">
        <h2>3) Passenger: Search and Join</h2>
        <div className="row">
          <input
            placeholder="Filter start point"
            value={filters.startPoint}
            onChange={(e) => setFilters({ ...filters, startPoint: e.target.value })}
          />
          <input
            placeholder="Filter end point"
            value={filters.endPoint}
            onChange={(e) => setFilters({ ...filters, endPoint: e.target.value })}
          />
          <button onClick={handleSearchRoutes}>Search</button>
        </div>

        <div className="list">
          {routes.map((route) => (
            <article key={route.routeID} className="item">
              <p>
                <strong>Route #{route.routeID}</strong> | {route.startPoint} to {route.endPoint}
              </p>
              <p>
                Driver: {route.ownerUserID} | Duration: {route.duration} | Price: {route.price}
              </p>
              <p>
                Seats: {route.remainingSeats}/{route.availableSeats}
              </p>
              <button disabled={!loggedIn} onClick={() => handleJoinRoute(route.routeID)}>
                Join Route
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>4) My Bookings</h2>
        <div className="row">
          <button disabled={!loggedIn} onClick={loadMyBookings}>
            Refresh My Bookings
          </button>
        </div>
        <div className="list">
          {myBookings.map((booking) => (
            <article key={booking.bookID} className="item">
              <p>
                <strong>Booking #{booking.bookID}</strong> | Route #{booking.routeID}
              </p>
              <p>
                {booking.startPoint} to {booking.endPoint} | Remaining Seats: {booking.remainingSeats}
              </p>
              <button onClick={() => cancelBooking(booking.bookID)}>Cancel Booking</button>
            </article>
          ))}
        </div>
      </section>

      {message && <p className="message">{message}</p>}
    </main>
  );
}

export default App;
