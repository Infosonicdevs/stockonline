import axios from "axios";

const apiURL = import.meta.env.VITE_APIURL;

// Normalize BASE_URL by stripping trailing /api or /api/
// This ensures that service calls starting with /api don't cause duplication
export const BASE_URL = apiURL.replace(/\/api\/?$/, "").replace(/\/$/, "");

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
