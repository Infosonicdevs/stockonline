import axios from "axios";

const BASE_URL = import.meta.env.VITE_APIURL;

export const getCrDr = () =>
  axios.get(`${BASE_URL}/api/CR_DR`);

export const getPatrak = () =>
  axios.get(`${BASE_URL}/api/PatrakMaster`);

export const getLedgerType = () =>
  axios.get(`${BASE_URL}/api/LedgerType`);

export const getPersonalLedgerType = () =>
  axios.get(`${BASE_URL}/api/PersonalLedType`);