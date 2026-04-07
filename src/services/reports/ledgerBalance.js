import apiClient from "../../api/client";

const BASEURL =import.meta.env.VITE_APIURL;

const API = `${BASEURL}/api`;

export const getLedgers = () => {
  return apiClient.get(`${API}/Ledger`);
};

export const getLedgerByNo = (no) => {
  return apiClient.get(`${API}/Ledger?L_no=${no}`);
};

export const getLedgerBalances = () => {
  return apiClient.get(`${API}/LedgerBalance`);
};

export const saveLedgerBalance = (data) => {
  return apiClient.post(`${API}/LedgerBalance`, data);
};

export const updateLedgerBalance = (data) => {
  return apiClient.put(`${API}/LedgerBalance`, data);
};

export const deleteLedgerBalance = (data) => {
  return apiClient.post(`${API}/DelLedgerBalance`, data);
};
