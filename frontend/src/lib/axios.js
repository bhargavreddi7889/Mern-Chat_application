import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
  // Removed default Content-Type header to let axios set it automatically for FormData
});

// Add response interceptor to handle errors consistently
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network Error:", error.message);
      return Promise.reject({ error: "Network error. Please check your connection." });
    }

    // Handle API errors
    const errorResponse = error.response?.data;
    console.error("API Error:", errorResponse);
    
    // If token is invalid or expired, clear auth state
    if (error.response?.status === 401) {
      // You can dispatch a logout action here if needed
      console.log("Authentication error, redirecting to login...");
    }
    
    return Promise.reject(errorResponse);
  }
);

// Add request interceptor to handle request errors
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if the request contains FormData
    const isFormData = config.data instanceof FormData;
    
    // Don't modify content-type for FormData, let the browser set it with the boundary
    if (isFormData) {
      // Ensure we're not setting Content-Type for FormData
      delete config.headers['Content-Type'];
      console.log('FormData detected, removed Content-Type header');
    }
    
    // Add /api prefix to all requests that don't already have it
    // But make sure we're not adding it twice
    if (!config.url.startsWith('/api/') && !config.url.startsWith('api/')) {
      config.url = '/api' + (config.url.startsWith('/') ? '' : '/') + config.url;
    }
    
    // Log request for debugging
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    if (isFormData) {
      console.log('Request contains FormData');
      
      // Log FormData contents for debugging
      if (config.data instanceof FormData) {
        for (const pair of config.data.entries()) {
          if (pair[0] === 'profilePic' && pair[1] instanceof File) {
            console.log(`FormData field: ${pair[0]}, File: ${pair[1].name}, Type: ${pair[1].type}, Size: ${pair[1].size} bytes`);
          } else {
            console.log(`FormData field: ${pair[0]}, Value: ${pair[1]}`);
          }
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);
