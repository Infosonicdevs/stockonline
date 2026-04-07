import apiClient from "../../api/client";



// GET ALL
export const getStockGroups = () =>
  apiClient.get(`/api/StockGroup`);

// GET BY ID
export const getStockGroupById = (id) =>
  apiClient.get(`/api/StockGroup?Group_id=${id}`);

// CREATE
export const createStockGroup = (data) =>
  apiClient.post(`/api/StockGroup`, data);

// UPDATE
export const updateStockGroup = (data) =>
  apiClient.put(`/api/StockGroup`, data);

// DELETE
export const deleteStockGroup = (data) =>
  apiClient.post(`/api/DelStockGroup`, data);
