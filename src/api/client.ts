import axios from "axios";

export const orchestrationClient = axios.create({
  baseURL: import.meta.env.VITE_ORCHESTRATION_URL ?? "http://localhost:8000"
});

export const dataClient = axios.create({
  baseURL: import.meta.env.VITE_DATA_URL ?? "http://localhost:8001"
});

export const profileClient = axios.create({
  baseURL: import.meta.env.VITE_PROFILE_URL ?? "http://localhost:8002"
});
