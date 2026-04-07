import apiClient from "../../api/client";



// Get
export const getOutlets = () =>
  apiClient.get(`/api/Outlet`);

// Save
export const saveOutlet = (data) =>
  apiClient.post(`/api/Outlet`, data);

// Update
export const updateOutlet = (data) =>
  apiClient.put(`/api/Outlet`, data);

// Delete
export const deleteOutlet = (data) =>
  apiClient.post(`/api/DelOutlet`, data);


