import apiClient from "../../api/client";

export const getLedgers = () =>
  apiClient.get(`/api/Ledger`);

export const saveLedger = (payload) =>
  apiClient.post(`/api/Ledger`, payload);

export const updateLedger = (payload) =>
  apiClient.put(`/api/Ledger`, payload);

export const deleteLedger = (ledgerId) =>
  apiClient.post(`/api/DelLedger`, {
    Ledger_id: ledgerId,
    Modified_by: "TRT"
  });

export const getLedgerGroup = (patrakId, crDrId) =>
  apiClient.get(`/api/LedgerGroup?patrak=${patrakId}&CrDr=${crDrId}`);

export const getLedgerSubGroup = (groupId) =>
  apiClient.get(`/api/LedgerSubGroupByGroup?id=${groupId}`);