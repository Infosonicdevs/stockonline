// src/services/unit.js
import apiClient from "../../api/client";



// Fetch all units
export const getUnits = () => apiClient.get(`/api/Unit`);

// Fetch a single unit by Unit_id
export const getUnitById = (Unit_id) =>
  apiClient.get(`/api/Unit`, { params: { Unit_id } });

// Add a new unit
export const addUnit = (unit) =>
  apiClient.post(`/api/Unit`, unit, {
    headers: { "Content-Type": "application/json" },
  });

// Update an existing unit
export const updateUnit = (unit) =>
  apiClient.put(`/api/Unit`, unit, {
    headers: { "Content-Type": "application/json" },
  });

// Delete a unit
export const deleteUnit = (payload) =>
  apiClient.post(`/api/DelUnit`, payload, {
    headers: { "Content-Type": "application/json" },
  });
