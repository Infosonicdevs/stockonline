import apiClient from "../../api/client";



// GET ALL
export const getStockSubGroups = () =>
  apiClient.get(`/api/StockSubGroup`);

// GET BY ID
export const getStockSubGroupById = (id) =>
  apiClient.get(`/api/StockSubGroup?Subgroup_id=${id}`);

// CREATE
export const createStockSubGroup = (data) =>
  apiClient.post(`/api/StockSubGroup`, data);

// UPDATE
export const updateStockSubGroup = (data) =>
  apiClient.put(`/api/StockSubGroup`, data);

// DELETE
export const deleteStockSubGroup = (data) =>
  apiClient.post(`/api/DelStockSubGroup`, data);
