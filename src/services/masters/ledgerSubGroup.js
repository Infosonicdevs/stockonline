import apiClient from "../../api/client";



export const getPatrakTypes = async() =>{
    return await apiClient.get(`/api/PatrakMaster`)
}

export const getCrDR = async() =>{
    return await apiClient.get(`/api/CR_DR`)
}

export const getLedgerGroups = async() =>{
    return await apiClient.get(`/api/LedgerGroup`)
}

export const getLedgerGroupsByPatrakAndCrDr = (patrakId, crDrId) =>
  apiClient.get(`/api/LedgerGroup?patrak=${patrakId}&CrDr=${crDrId}`);
