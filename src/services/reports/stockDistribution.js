import apiClient from "../../api/client";

// Fetch Stock Distribution Report
export const getStockDistributionReport = (fromDate, toDate) => {
  return apiClient.get(`/api/stock-distribution-report?FromDate=${fromDate}&ToDate=${toDate}`);
};
