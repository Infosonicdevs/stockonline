import apiClient from "../../api/client";

// Fetch Sale Register
export const getSaleRegister = (fromDate, toDate, outletId) => {
  return apiClient.get(
    `/api/sale/register?FromDate=${fromDate}&ToDate=${toDate}&Outlet_id=${outletId}`
  );
};
