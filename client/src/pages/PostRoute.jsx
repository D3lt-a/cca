import React, { useState } from "react";
import { createRoute } from "../services/api";

const PostRoute = () => {
  const [form, setForm] = useState({
    startPoint: "",
    destination: "",
    endPoint: "",
    price: "",
    availableSeats: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRoute(form);
      alert("Route created successfully!");
    } catch (err) {
      alert("Error creating route");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Post New Route</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="startPoint"
          value={form.startPoint}
          placeholder="Start Point"
          onChange={handleChange}
          className="w-full border p-2"
        />

        <input
          name="destination"
          value={form.destination}
          placeholder="Destination"
          onChange={handleChange}
          className="w-full border p-2"
        />

        <input
          name="endPoint"
          value={form.endPoint}
          placeholder="End Point"
          onChange={handleChange}
          className="w-full border p-2"
        />

        <input
          type="number"
          name="price"
          value={form.price}
          placeholder="Price"
          onChange={handleChange}
          className="w-full border p-2"
        />

        <input
          type="number"
          name="availableSeats"
          value={form.availableSeats}
          placeholder="Seats"
          onChange={handleChange}
          className="w-full border p-2"
        />

        <button className="bg-blue-500 text-white px-4 py-2 w-full">
          Create Route
        </button>
      </form>
    </div>
  );
};

export default PostRoute;