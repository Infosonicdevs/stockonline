import apiClient from "../../api/client";

export const getAssignedCounters = async () => {
    return await apiClient.get(`/api/AssignCounter`);
};

export const saveAssignedCounter = async (data) => {
    return await apiClient.post(`/api/AssignCounter`, data);
};

export const updateAssignedCounter = async (data) => {
    return await apiClient.put(`/api/AssignCounter`, data);
};

export const deleteAssignedCounter = async (data) => {
    return await apiClient.post(`/api/DelAssignCounter`, data);
};
