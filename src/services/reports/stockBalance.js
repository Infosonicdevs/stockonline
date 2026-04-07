// src/services/stockService.js
import apiClient from "../../api/client";


// Fetch all stock details
export const getStockDetails = () => apiClient.get(`/api/StockDetail`);

// Fetch stock balances
export const getStockBalance = () => apiClient.get(`/api/StockBalance`);

// Add a new stock balance
export const addStockBalance = (payload) =>
  apiClient.post(`/api/StockBalance`, payload, {
    headers: { "Content-Type": "application/json" },
  });

// Update existing stock balance
export const updateStockBalance = (payload) =>
  apiClient.put(`/api/StockBalance`, payload, {
    headers: { "Content-Type": "application/json" },
  });

// Delete a stock balance
export const deleteStockBalance = (payload) =>
  apiClient.post(`/api/DelStockBalance`, payload, {
    headers: { "Content-Type": "application/json" },
  });
