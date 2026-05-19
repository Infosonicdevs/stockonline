import apiClient from "../../api/client";

// Fetch Purchase Register
export const getPurchaseRegister = (fromDate, toDate) => {
  return apiClient.get(`/api/purchase/register?FromDate=${fromDate}&ToDate=${toDate}`);
};
