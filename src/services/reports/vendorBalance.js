import apiClient from "../../api/client";


// Fetch all vendor balances
export const getSuppliers = () => apiClient.get(`/api/VendorBalance`);

// Fetch vendor list for dropdown
export const getSupplierList = () => apiClient.get(`/api/Supplier`);

// Create new supplier balance
export const saveSupplier = (payload) => apiClient.post(`/api/VendorBalance`, payload);

// Update existing supplier balance
export const updateSupplier = (payload) => apiClient.put(`/api/VendorBalance`, payload);

// Delete supplier balance
export const deleteSupplier = (payload) => apiClient.post(`/api/DelVendorBalance`, payload);
