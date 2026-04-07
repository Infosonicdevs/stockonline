import axios from "axios";

const BASE_URL = import.meta.env.VITE_APIURL;

export const getLedgers = () =>
  axios.get(`${BASE_URL}/api/Ledger`);

export const saveLedger = (payload) =>
  axios.post(`${BASE_URL}/api/Ledger`, payload);

export const updateLedger = (payload) =>
  axios.put(`${BASE_URL}/api/Ledger`, payload);

export const deleteLedger = (ledgerId) =>
  axios.post(`${BASE_URL}/api/DelLedger`, {
    Ledger_id: ledgerId,
    Modified_by: "TRT"
  });

export const getLedgerGroup = (patrakId, crDrId) =>
  axios.get(`${BASE_URL}/api/LedgerGroup?patrak=${patrakId}&CrDr=${crDrId}`);

export const getLedgerSubGroup = (groupId) =>
  axios.get(`${BASE_URL}/api/LedgerSubGroupByGroup?id=${groupId}`);