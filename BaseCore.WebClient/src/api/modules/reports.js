import api from "../httpClient";

export const reportApi = {
  getHealth: () => api.get("/reports/health"),
  getReady: () => api.get("/reports/ready"),
  getSummary: () => api.get("/reports/summary"),
  getCatalog: () => api.get("/reports"),
  exportEventsCsv: (limit = 1000) =>
    api.get("/reports/events.csv", {
      params: { limit },
      responseType: "blob",
    }),
  exportDonationsCsv: (limit = 1000) =>
    api.get("/reports/donations.csv", {
      params: { limit },
      responseType: "blob",
    }),
};
