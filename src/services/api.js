import axios from "axios";

// Create axios instance with base URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry logout or token refresh endpoints
    const isLogoutOrRefresh =
      originalRequest.url?.includes("/auth/logout/") ||
      originalRequest.url?.includes("/auth/token/refresh/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLogoutOrRefresh
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          const newAccessToken = response.data.access;
          localStorage.setItem("accessToken", newAccessToken);

          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, clear storage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post("/auth/login/", { email, password }),

  register: (data) => api.post("/auth/register/", data),

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await axios.post(
          `${API_BASE_URL}/auth/logout/`,
          { refresh: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },
};

// Documents endpoints
export const documentsAPI = {
  getDocuments: (params) => api.get("/documents/", { params }),

  uploadDocument: (formData) =>
    api.post("/documents/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * Upload document to DocumentControl table with local storage
   * @param {FormData} formData - Must include: file, document_type, and optional reference fields
   * @returns {Promise} - Response with document details
   */
  uploadToDocumentControl: (formData) =>
    api.post("/documents/upload-to-control/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * Delete document from DocumentControl table and remove file from storage
   * @param {number} documentId - The ID of the document to delete
   * @returns {Promise} - Response with success message
   */
  deleteFromDocumentControl: (documentId) =>
    api.delete(`/documents/delete-from-control/${documentId}/`),

  getDocument: (id) => api.get(`/documents/${id}/`),

  deleteDocument: (id) => api.delete(`/documents/${id}/`),
};

// Submissions endpoints
export const submissionsAPI = {
  getSubmissions: (params) => api.get("/submissions/", { params }),

  createSubmission: (data) => {
    // If data is FormData, use multipart/form-data
    // If data is plain object, use application/json
    const config = {};
    if (data instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
    } else {
      config.headers = { "Content-Type": "application/json" };
    }
    return api.post("/submissions/create/", data, config);
  },

  getSubmission: (id) => api.get(`/submissions/${id}/`),

  updateSubmission: (id, data) => api.patch(`/submissions/${id}/`, data),

  generateQRCode: (submissionId) =>
    api.get(`/submissions/${submissionId}/generate_qr/`),
};

// Vehicles endpoints
export const vehiclesAPI = {
  getVehicles: (params) => api.get("/vehicles/", { params }),

  getMyVehicles: () => api.get("/vehicles/my-vehicles/"),

  createOrGetVehicle: (vehicleNumber) =>
    api.post("/vehicles/create/", { vehicle_number: vehicleNumber }),

  createVehicle: (data) => api.post("/vehicles/", data),

  getVehicle: (id) => api.get(`/vehicles/${id}/`),

  updateVehicle: (id, data) => api.patch(`/vehicles/${id}/`, data),

  lookupVehicle: (vehicleNumber) =>
    api.get(`/vehicles/${vehicleNumber}/lookup/`),

  getVehicleCompleteData: (vehicleRegNo) =>
    api.get(`/vehicles/vehicle-complete-data/`, {
      params: { vehicle_reg_no: vehicleRegNo },
    }),
};

// PO Details endpoints
export const poDetailsAPI = {
  getMyPOs: () => api.get("/po-details/my-pos/"),

  createOrGetPO: (poNumber) =>
    api.post("/po-details/create/", { po_number: poNumber }),

  getPO: (id) => api.get(`/po-details/${id}/`),
};

// Drivers endpoints
export const driversAPI = {
  getDrivers: (params) => api.get("/drivers/", { params }),

  createDriver: (data) => api.post("/drivers/", data),

  validateOrCreate: (data) => api.post("/drivers/validate-or-create/", data),

  getDriver: (id) => api.get(`/drivers/${id}/`),

  updateDriver: (id, data) => api.patch(`/drivers/${id}/`, data),

  getByVehicle: (vehicleId) => api.get("/drivers/by-vehicle/", {
    params: { vehicle_id: vehicleId }
  }),

  saveDriver: (data) => api.post("/drivers/validate-or-create/", {
    ...data,
    type: "Driver"
  }),

  saveHelper: (data) => api.post("/drivers/validate-or-create/", {
    ...data,
    type: "Helper"
  }),
};

export default api;
