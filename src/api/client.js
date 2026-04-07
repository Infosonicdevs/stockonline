import axios from "axios";

const apiURL = import.meta.env.VITE_APIURL;

const apiClient = axios.create({
  baseURL: apiURL,
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
