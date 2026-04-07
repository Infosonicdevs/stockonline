import apiClient from "../../api/client";


// Get all stock balances
export const getStockBalances = () => apiClient.get(`/api/StockBalance`);

// Get single stock balance by Bal_id
export const getStockBalanceById = (id) => apiClient.get(`/api/StockBalance?Bal_id=${id}`);

// Create new stock balance
export const createStockBalance = (data) => apiClient.post(`/api/StockBalance`, data);

// Update stock balance
export const updateStockBalance = (data) => apiClient.put(`/api/StockBalance`, data);

// Delete stock balance
export const deleteStockBalance = (data) => apiClient.post(`/api/DelStockBalance`, data);
