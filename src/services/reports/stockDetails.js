import apiClient from "../../api/client";

export const getStockSubGroups = async () => {
  return await apiClient.get(`/api/StockSubGroup`);
};

export const getStockDetails = async () => {
  return await apiClient.get(`/api/StockDetail`);
};

export const getUnits = async () => {
  return await apiClient.get(`/api/Unit`);
};

export const getGSTSlabs = async () => {
  return await apiClient.get(`/api/GSTSlab`);
};

export const updateStockDetail = async (data) => {
  return await apiClient.put(`/api/StockDetail`, data);
};

export const createStockDetail = async (data) => {
  return await apiClient.post(`/api/StockDetail`, data);
};

export const deleteStockDetail = async (data) => {
  return await apiClient.post(`/api/DelStockDetail`, data);
};

export const getMaxStockNo = async () => {
  return await apiClient.get(`/api/MaxStockNo`);
};
