import apiClient from "../../../api/client";

export const getOutletCurrentStock = async (outletId) => {
    return await apiClient.get(`/api/GetOutletCurrentStock?outlet_id=${outletId}`);
};

export const insertStockSale = async (data) => {
    return await apiClient.post(`/api/SaleTransaction`, data);
};

export const updateStockSale = async (data) => {
    return await apiClient.put(`/api/SaleTransaction`, data);
};

export const getSaleTransactions = async () => {
    return await apiClient.get(`/api/SaleTransaction`);
};

export const getSaleTransactionDetails = async (saleId) => {
    return await apiClient.get(`/api/SaleTransaction/Details?Sale_id=${saleId}`);
};

export const deleteSaleTransaction = async (saleId, userName) => {
    return await apiClient.post(`/api/DeleteSale`, {
        Sale_id: saleId,
        User: userName
    });
};
