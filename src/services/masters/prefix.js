import apiClient from "../../api/client";



export const getPrefixes = async () => {
  return await apiClient.get(`/api/Prifix`);
};

export const deletePrefix = async (data) => {
  return await apiClient.post(`/api/DelPrifix`, data);
};

export const createPrefix = async (data) => {
  return await apiClient.post(`/api/Prifix`, data);
};

export const updatePrefix = async (data) => {
  return await apiClient.put(`/api/Prifix`, data);
};

