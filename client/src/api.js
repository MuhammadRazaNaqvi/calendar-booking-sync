import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const client = axios.create({ baseURL: API_BASE });

export function getVehicles(signal) {
  return client.get("/api/vehicles", { signal }).then((res) => res.data);
}

export function getBookings(vehicleId, signal) {
  return client
    .get(`/api/vehicles/${vehicleId}/bookings`, { signal })
    .then((res) => res.data);
}

export function createBooking(payload) {
  return client.post("/api/bookings", payload).then((res) => res.data);
}

export function updateBooking(id, payload) {
  return client.put(`/api/bookings/${id}`, payload).then((res) => res.data);
}

export function deleteBooking(id) {
  return client.delete(`/api/bookings/${id}`).then((res) => res.data);
}

export function syncTuro(vehicleId) {
  return client
    .post(`/api/vehicles/${vehicleId}/sync-turo`)
    .then((res) => res.data);
}
