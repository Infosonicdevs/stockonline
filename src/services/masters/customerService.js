import apiClient from "../../api/client";

 

export const getCustomers = () => apiClient.get(`/api/Customer`);
export const getStates = () => apiClient.get(`/api/State`);
export const getDistricts = () => apiClient.get(`/api/Dist`);
export const getTalukas = () => apiClient.get(`/api/Taluka`);
export const getCities = () => apiClient.get(`/api/City`);
export const getPrefixes = () => apiClient.get(`/api/Prifix`);
export const getMaxCustNo = () => apiClient.get(`/api/MaxCustNo`);

export const addCustomer = (customer) =>
  apiClient.post(`/api/Customer`, customer, {
    headers: { "Content-Type": "application/json" },
  });

export const updateCustomer = (customer) =>
  apiClient.put(`/api/Customer`, customer, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteCustomer = (payload) =>
  apiClient.delete(`/api/DelCustomer`, {
    data: payload,
    headers: { "Content-Type": "application/json" },
  });
