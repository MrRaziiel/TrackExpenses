import axios from "axios";

const API_URL = "/api/Clients/getAllUsers"; // Agora é caminho relativo

export const getUsers = async () => {
  try {
    const response = await axios.get(API_URL);
    return response?.data?.$values || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
};