import apiClient from "../../api/client";

export const getPatrakTypes = async () => {
  return await apiClient.get(`/api/PatrakMaster`);
};

export const getCrDR = async () => {
  return await apiClient.get(`/api/CR_DR`);
};

export const getLedgerGroups = async () => {
  return await apiClient.get(`/api/LedgerGroup`);
};

export const getLedgerGroupsByPatrakAndCrDr = (patrakId, crDrId) =>
  apiClient.get(`/api/LedgerGroup?patrak=${patrakId}&CrDr=${crDrId}`);

// Ledger SubGroup APIs
export const getLedgerSubGroups = async () => {
  return await apiClient.get(`/api/ledgerSubgroup`);
};

export const createLedgerSubGroup = async (body) => {
  return await apiClient.post(`/api/ledgerSubgroup`, body);
};

export const updateLedgerSubGroup = async (body) => {
  return await apiClient.put(`/api/ledgerSubgroup`, body);
};

export const deleteLedgerSubGroup = async (body) => {
  return await apiClient.post(`/api/DelLedgerSubGroup`, body);
};
