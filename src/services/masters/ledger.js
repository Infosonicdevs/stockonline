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

export const getLedgerSubGroups = async() =>{
    return await apiClient.get(`/api/LedgerSubGroup`)
}

export const getLedgerTypes = async() =>{
    return await apiClient.get(`/api/LedgerType`)
}

export const getCustomerTypes = async() =>{
    return await apiClient.get(`/api/PersonalLedType`)
}

export const getMaxLedgerNo = async() =>{
    return await apiClient.get(`/api/MaxLedgerNo`)
}

export const getLedgerSubGroupsByLedgerGroupId = async (ledgerGroupId) => {
  return await apiClient.get(`/api/LedgerSubGroupByGroup?id=${ledgerGroupId}`);
};

export const getLedgerGroupsByPatrakAndCrDr = (patrakId, crDrId) =>
  apiClient.get(`/api/LedgerGroup?patrak=${patrakId}&CrDr=${crDrId}`);
