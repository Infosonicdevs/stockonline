import apiClient from "../../api/client";

// Save day close
export const saveDayClose = (data) =>
  apiClient.post(`/api/DayClose`, data);

// Get day close status
export const getDayCloseStatus = (outletId, date) =>
  apiClient.get(`/api/DayClose?Outlet_id=${outletId}&Date=${date}`);

// Get all outlets status for day close
export const getDayCloseList = () =>
  apiClient.get(`/api/DayClose`);
// Finalize day close (PUT)
export const closeDay = (data) =>
  apiClient.put(`/api/DayClose/close`, data);
