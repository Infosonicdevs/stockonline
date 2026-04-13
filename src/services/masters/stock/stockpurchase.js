import apiClient from "../../../api/client";

export const insertStockPurchase = async (data) => {
    return await apiClient.post(`/api/StockPurchase`, data);
};

export const updateStockPurchase = async (data) => {
    return await apiClient.put(`/api/StockPurchase`, data);
};

export const getStockPurchaseList = async () => {
    return await apiClient.get(`/api/StockPurchaseList`);
};

export const getStockPurchaseByInvoice = async (invoiceNo) => {
    return await apiClient.get(`/api/StockPurchase?InvoiceNo=${invoiceNo}`);
};

export const deleteStockPurchase = async (data) => {
    return await apiClient.post(`/api/DelStockPurchase`, data);
};

export const insertPurchaseTransaction = async (data) => {
    return await apiClient.post(`/api/PurchaseTransaction`, data);
};

export const getPurchaseTransactions = async () => {
    return await apiClient.get(`/api/PurchaseTransaction`);
};

export const getPurchaseTransactionById = async (id) => {
    return await apiClient.get(`/api/PurchaseTransaction?Invoice_id=${id}`);
};

export const updatePurchaseTransaction = async (data) => {
    return await apiClient.put(`/api/PurchaseTransaction`, data);
};

export const deletePurchaseTransaction = async (data) => {
    return await apiClient.post(`/api/DelPurchaseTransaction`, data);
};
