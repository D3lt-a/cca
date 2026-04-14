import React, { useEffect, useState } from "react";
import { getRoutes, joinRoute } from "../services/api";
import RouteCard from "../components/RouteCard";

const SearchRoutes = () => {
  const [routes, setRoutes] = useState([]);

  const loadRoutes = async () => {
    try {
      const res = await getRoutes();
      setRoutes(res.data ?? res);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleJoin = async (id) => {
    try {
      await joinRoute(id);
      alert("Joined successfully!");
      loadRoutes(); // refresh seats
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join route");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available Routes</h1>

      {routes.map((route) => (
        <RouteCard
          key={route.routerId || route.id || route._id}
          route={route}
          onJoin={handleJoin}
        />
      ))}
    </div>
  );
};

export default SearchRoutes;