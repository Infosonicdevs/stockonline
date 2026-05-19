import apiClient from "../../api/client";

export const getVyapariPatrak = (fromDate, toDate) => {
  return apiClient.get(`/api/vyapari-patrak?FromDate=${fromDate}&ToDate=${toDate}`);
};
