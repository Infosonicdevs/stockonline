import apiClient from "../../api/client";



export const getLedgerSettings = async () => {
  return await apiClient.get(`/api/LedgerSetting`);
};

export const getLedgers = async () => {
  return await apiClient.get(`/api/Ledger`);
};

export const postLedgerSetting = async (data) => {
  return await apiClient.post(`/api/LedgerSetting`, data);
};

export const putLedgerSetting = async (data) => {
  return await apiClient.put(`/api/LedgerSetting`, data);
};
