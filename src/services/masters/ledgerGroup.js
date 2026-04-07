import apiClient from "../../api/client";



export const getPatrakTypes = async() =>{
    return await apiClient.get(`/api/PatrakMaster`)
}

export const getCrDR = async() =>{
    return await apiClient.get(`/api/CR_DR`)
}
