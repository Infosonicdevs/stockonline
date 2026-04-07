import apiClient from "../../api/client";



// Get Suppliers
export const getSuppliers = () =>
  apiClient.get(`/api/Supplier`);

// Get Locations
export const getLocations = () =>
  apiClient.get(`/api/City`);

// Add Supplier
export const addSupplier = (data) =>
  apiClient.post(`/api/Supplier`, data);

// Update Supplier
export const updateSupplier = (data) =>
  apiClient.put(`/api/Supplier`, data);

// Delete Supplier
export const deleteSupplier = (data) =>
  apiClient.post(`/api/DelSupplier`, data);
