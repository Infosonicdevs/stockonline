import apiClient from "../../api/client";



// Get States
export const getStates = async () => {
  return await apiClient.get(`/api/State`);
};

// Get Districtss
export const getDistricts = async () => {
  return await apiClient.get(`/api/District`);
};

// Get Talukas
export const getTalukas = async () => {
  return await apiClient.get(`/api/Taluka`);
};

// Get Cities
export const getCities = async () => {
  return await apiClient.get(`/api/City`);
};

// Get Districts By State Id
export const getDistrictsByStateId = async (stateId) => {
  return await apiClient.get(`/api/GetDist?State_id=${stateId}`);
};


// Get Talukas By District Id
export const getTalukasByDistrictId = async (districtId) => {
  return await apiClient.get(`/api/GetTaluka?Dist_id=${districtId}`);
};

// Get Cities By Taluka Id
export const getCitiesByTalukaId = async (talukaId) => {
  return await apiClient.get(`/api/GetCity?Taluka_id=${talukaId}`);
};

// Delete State
export const deleteState = (data) =>
  apiClient.post(`/api/DelState`, data);

// Delete District
export const deleteDistrict = (data) =>
  apiClient.post(`/api/DelDist`, data);
