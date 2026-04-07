import apiClient from "../../api/client";



export const getUsers = () => apiClient.get(`/api/UserLogin`);

export const getEmployees = () => apiClient.get(`/api/Employee`);

export const getRoles = () => apiClient.get(`/api/Role`);

export const saveUser = (data) => apiClient.post(`/api/UserLogin`, data);

export const updateUser = (data) => apiClient.put(`/api/UserLogin`, data);

export const deleteUser = (data) =>
  apiClient.post(`/api/DelUserLogin`, data);

export const getCustomers = async () => {
  return await apiClient.get(`/api/Customer`);
};

export const getCustomerByAccountNo = async(account_no) =>{
  const Cust_no = Number.parseInt(account_no);
  return await apiClient.get(`/api/CustomerByAccountNo?Cust_no=${Cust_no}`)
}
