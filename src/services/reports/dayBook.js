import apiClient from "../../api/client";

export const getDayBookMain = (fromDate, outletId) => {
  const branchName = localStorage.getItem("branch") || "";
  const isMainBranch = String(outletId) === "1" || branchName.toLowerCase().includes("main");

  if (!isMainBranch) {
    return apiClient.get(`/api/DayBook/general?FromDate=${fromDate}&Outlet_id=${outletId}`);
  }

  return apiClient.get(`/api/DayBook/Main?FromDate=${fromDate}&Outlet_id=${outletId}`);
};

export const getDayBookDetail = (fromDate, outletId) => {
  return apiClient.get(`/api/DayBook/details?FromDate=${fromDate}&Outlet_id=${outletId}`);
};
