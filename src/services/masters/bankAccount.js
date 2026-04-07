import apiClient from "../../api/client";



export const getBankAccounts = async () => {
    return await apiClient.get(`/api/BankAccSetting`);
};

export const saveBankAccount = async (data) => {
    return await apiClient.post(`/api/BankAccSetting`, data);
};

export const updateBankAccount = async (data) => {
    return await apiClient.put(`/api/BankAccSetting`, data);
};

export const deleteBankAccount = async (data) => {
    return await apiClient.post(`/api/DelBankAccSetting`, data);
};

