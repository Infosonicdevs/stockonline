// src/api/gstSlabApi.js
import apiClient from "../../api/client";



// GET ALL
export const getGSTSlabs = () =>
  apiClient.get(`/api/GSTSlab`);

// GET BY ID
export const getGSTSlabById = (id) =>
  apiClient.get(`/api/GSTSlab?GST_SLAB_Id=${id}`);

// ADD
export const addGSTSlab = (data) =>
  apiClient.post(`/api/GSTSlab`, data, {
    headers: { "Content-Type": "application/json" },
  });

// UPDATE
export const updateGSTSlab = (data) =>
  apiClient.put(`/api/GSTSlab`, data, {
    headers: { "Content-Type": "application/json" },
  });

// DELETE
export const deleteGSTSlab = (data) =>
  apiClient.post(`/api/DelGSTSlab`, data, {
    headers: { "Content-Type": "application/json" },
  });



export const getLedgers = () =>
  apiClient.get(`/api/Ledger`);
