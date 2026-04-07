import apiClient from "../../api/client";

// Get all counters
export const getCounters = () =>
  apiClient.get(`/api/Counter`);

// Save counter
export const saveCounter = (data) =>
  apiClient.post(`/api/Counter`, data);

// Update counter
export const updateCounter = (data) =>
  apiClient.put(`/api/Counter`, data);

// Delete counter
export const deleteCounter = (data) =>
  apiClient.post(`/api/DelCounter`, data);
