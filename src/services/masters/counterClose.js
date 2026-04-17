import apiClient from "../../api/client";

// Save counter close
export const saveCounterClose = (data) =>
  apiClient.post(`/api/CounterClose`, data);
