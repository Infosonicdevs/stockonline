import apiClient from "../api/client";

// Fetch branches
export const getBranches = () => apiClient.get("/api/getBranches");

// Get current active financial year
export const getCurrentFinancialYear = () => apiClient.get("/api/CurrentYear");

// Get available years for dropdown (keeping this from my previous addition)
export const getFinancialYears = () => apiClient.get("/api/Year");

// Get latest system date selected by admin
export const getLatestSystemDateSelectedByAdmin = () =>
  apiClient.get("/api/getLatestSystemDateSelectedByAdmin");

// Get society info
export const getSociety = () => apiClient.get("/api/Sanstha");

// Get user role
export const getUserRole = (user) =>
  apiClient.post("/api/getUserRole", {
    User_name: user.username,
    Password: user.password,
  });

// Login user
export const loginUser = (user) =>
  apiClient.post("/api/loginUser", {
    User_name: user.username,
    Password: user.password,
  });

// Verify system user (Admin)
export const verifySystemUser = (user) => {
  const [year, month, day] = user.date.split("-");
  const formattedDate = `${day}-${month}-${year}`;
  return apiClient.post("/api/verifySystemUser", {
    Username: user.username,
    Password: user.password,
    Date: formattedDate,
    Emp_id: user.empId,
  });
};
