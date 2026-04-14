import React from "react";

const RouteCard = ({ route, onJoin }) => {
  const routeId = route.routerId || route.id || route._id;
  const driver = route.userName || route.driverName || route.driver || "Unknown";
  const seats = route.availableSeats ?? route.seats ?? "N/A";
  const price = route.price ?? "N/A";

  return (
    <div className="bg-white shadow-md rounded-xl p-4 mb-4 border">
      <h2 className="text-lg font-bold">
        {route.startPoint} ➜ {route.destination}
      </h2>

      <p className="text-gray-600">Driver: {driver}</p>

      <p className="text-sm text-gray-500">Price: {price} RWF</p>

      <p className="text-sm text-blue-600">Seats left: {seats}</p>

      <button
        onClick={() => routeId && onJoin?.(routeId)}
        disabled={!routeId}
        className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        Join Route
      </button>
    </div>
  );
};

export default RouteCard;