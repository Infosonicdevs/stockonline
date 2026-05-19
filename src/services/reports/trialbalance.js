import apiClient from "../../api/client";

export const getTrialBalance = (fromDate, toDate) => {
  return apiClient.get(`/api/trialbalance?FromDate=${fromDate}&ToDate=${toDate}`);
};
