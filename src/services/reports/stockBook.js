import apiClient from "../../api/client";

// Fetch Stockbook Report
export const getStockBookReport = (stockId, fromDate, toDate) => {
  return apiClient.get(`/api/stockbook?Stock_id=${stockId}&FromDate=${fromDate}&ToDate=${toDate}`);
};
