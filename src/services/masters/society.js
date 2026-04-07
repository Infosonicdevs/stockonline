import apiClient from "../../api/client";



//Save Sanstha

// Create society
export const createSociety = async (data) => {
  return await apiClient.post(`/api/Sanstha`, data, {
    headers: {
      "Content-Type": "multipart/form-data", // important for file uploads
    },
  });
};

// Update society
export const updateSociety = async (data) => {
  return await apiClient.put(`/api/Sanstha`, data, {
    headers: {
      "Content-Type": "multipart/form-data", // important for file uploads
    },
  });
};

// Get Society
export const getSociety = async() =>{
  return await apiClient.get(`/api/Sanstha`)
}
