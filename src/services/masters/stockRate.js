import apiClient from "../../api/client";

export const getStockRates = () => apiClient.get(`/api/StockRate`);

export const createStockRate = (data) => apiClient.post(`/api/StockRate`, data);

export const updateStockRate = (data) => apiClient.put(`/api/StockRate`, data);

export const deleteStockRate = (data) => apiClient.post(`/api/DelStockRate`, data);
