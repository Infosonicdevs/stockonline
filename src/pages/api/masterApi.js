import apiClient from "../../api/client";

export const getCrDr = () =>
  apiClient.get(`/api/CR_DR`);

export const getPatrak = () =>
  apiClient.get(`/api/PatrakMaster`);

export const getLedgerType = () =>
  apiClient.get(`/api/LedgerType`);

export const getPersonalLedgerType = () =>
  apiClient.get(`/api/PersonalLedType`);