import apiClient from "../../api/client";

// Save counter close
export const saveCounterClose = (data) =>
  apiClient.post(`/api/CounterClose`, data);

// Get counter closures
export const getCounterClosures = () =>
  apiClient.get(`/api/CounterClose`);
