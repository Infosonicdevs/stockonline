import apiClient from "../../api/client";

const BASEURL = import.meta.env.VITE_APIURL;

const APIURL = `${BASEURL}/api`;

export const getRoles = () => apiClient.get(`/api/Role`);

export const saveRole = (data) => apiClient.post(`/api/Role`, data);

export const updateRole = (data) => apiClient.put(`/api/Role`, data);

export const deleteRole = (data) => apiClient.post(`/api/DelRole`, data);
