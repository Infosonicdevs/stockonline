import apiClient from "../../../api/client";

export const getMaxBatchNo = async () => {
  return await apiClient.get(`/api/BatchNo`);
};

export const getOutlets = async () => {
  return await apiClient.get(`/api/Outlet`);
};

export const getStockDetailByNo = async (itemNo) => {
  return await apiClient.get(`/api/StockDetail/${itemNo}`);
};


export const getStockDetailByBarcode = async (barcode) => {
  return await apiClient.get(`/api/StockDetail/${barcode}`);
};

export const getStockDetails = async () => {
  return await apiClient.get(`/api/StockDetail`);
};

export const getMainBranchCurrentStock = async (itemNo) => {
  return await apiClient.get(`/api/GetMainBranchCurrentStock`);
};


export const insertStockDistribution = async (data) => {
  return await apiClient.post(`/api/StockDistribution`, data);
};

export const updateStockDistribution = async (data) => {
  return await apiClient.put(`/api/StockDistribution`, data);
};

export const getStockDistributionList = async (batchNo) => {
  return await apiClient.get(`/api/StockDist?BatchNo=${batchNo}`);
};
export const getStockDistList = async () => {
  return await apiClient.get(`/api/StockDistList`);
};

export const deleteStockDistribution = async (batchNo) => {
  return await apiClient.delete(`/api/DeleteStockDistribution?BatchNo=${batchNo}`);
};
