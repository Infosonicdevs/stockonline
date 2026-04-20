import apiClient from "../../api/client";

export const getLedgers = () => {
  return apiClient.get(`/api/Ledger`);
};

export const getLedgerByNo = (no) => {
  return apiClient.get(`/api/Ledger?L_no=${no}`);
};

export const getLedgerBalances = () => {
  return apiClient.get(`/api/LedgerBalance`);
};

export const saveLedgerBalance = (data) => {
  return apiClient.post(`/api/LedgerBalance`, data);
};

export const updateLedgerBalance = (data) => {
  return apiClient.put(`/api/LedgerBalance`, data);
};

export const deleteLedgerBalance = (data) => {
  return apiClient.post(`/api/DelLedgerBalance`, data);
};
