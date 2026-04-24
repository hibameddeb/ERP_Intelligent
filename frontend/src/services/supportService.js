import API from "./api";

export const SupportService = {
  // Réclamations
  getReclamations: () => API.get("/support/reclamations/admin"),
  createReclamation: (data) => API.post("/support/reclamations", data),
  
  // Chat
  getMessages: (contactId) => API.get(`/support/messages/${contactId}`),
  sendMessage: (data) => API.post("/support/messages", data),
};