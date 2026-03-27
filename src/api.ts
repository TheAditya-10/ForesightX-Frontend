import axios from "axios";

import type {
  AnalysisJobListResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  AuthResponse,
  CreateProfileRequest,
  CreateProfileResponse,
  HistoricalPredictionResponse,
  HistoryResponse,
  IndicatorResponse,
  LoginRequest,
  LogoutRequest,
  MessageResponse,
  ModelListResponse,
  NewsResponse,
  PortfolioResponse,
  PredictionRequest,
  PredictionResponse,
  PriceResponse,
  RefreshTokenRequest,
  RiskResponse,
  ServiceHealth,
  SignalPredictionRequest,
  SignalPredictionResponse,
  UpdatePortfolioRequest,
  UserCreate,
  VerifyResponse,
} from "./types";

const authClient = axios.create({
  baseURL: "/api/auth",
  timeout: 10000,
});

const dataClient = axios.create({
  baseURL: "/api/data",
  timeout: 7000,
});

const orchestrationClient = axios.create({
  baseURL: "/api/orchestration",
  timeout: 12000,
});

const profileClient = axios.create({
  baseURL: "/api/profile",
  timeout: 7000,
});

const patternClient = axios.create({
  baseURL: "/api/pattern",
  timeout: 10000,
});

export async function register(payload: UserCreate) {
  const { data } = await authClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function login(payload: LoginRequest) {
  const { data } = await authClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function refreshSession(payload: RefreshTokenRequest) {
  const { data } = await authClient.post<AuthResponse>("/auth/refresh", payload);
  return data;
}

export async function logout(payload: LogoutRequest, accessToken?: string) {
  const { data } = await authClient.post<MessageResponse>("/auth/logout", payload, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return data;
}

export async function verifySession(accessToken: string) {
  const { data } = await authClient.get<VerifyResponse>("/auth/verify", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data;
}

export function buildGoogleLoginUrl() {
  return "/api/auth/oauth/google/login";
}

export async function fetchAuthHealth() {
  const { data } = await authClient.get<ServiceHealth>("/health");
  return data;
}

export async function fetchPrice(ticker: string) {
  const { data } = await dataClient.get<PriceResponse>(`/price/${ticker}`);
  return data;
}

export async function fetchIndicators(ticker: string) {
  const { data } = await dataClient.get<IndicatorResponse>(`/indicators/${ticker}`);
  return data;
}

export async function fetchHistory(ticker: string, limit = 30) {
  const { data } = await dataClient.get<HistoryResponse>(`/history/${ticker}`, {
    params: { limit },
  });
  return data;
}

export async function fetchNews(ticker: string) {
  const { data } = await dataClient.get<NewsResponse>(`/news/${ticker}`);
  return data;
}

export async function fetchDataHealth() {
  const { data } = await dataClient.get<ServiceHealth>("/health");
  return data;
}

export async function analyzeTicker(payload: AnalyzeRequest) {
  const { data } = await orchestrationClient.post<AnalyzeResponse>("/analyze", payload);
  return data;
}

export async function fetchAnalysisJobs(userId?: string, limit = 12) {
  const { data } = await orchestrationClient.get<AnalysisJobListResponse>("/analysis/jobs", {
    params: {
      user_id: userId,
      limit,
    },
  });
  return data;
}

export async function fetchOrchestrationHealth() {
  const { data } = await orchestrationClient.get<ServiceHealth>("/health");
  return data;
}

export async function fetchPortfolio(userId: string) {
  const { data } = await profileClient.get<PortfolioResponse>(`/portfolio/${userId}`);
  return data;
}

export async function updatePortfolioPosition(payload: UpdatePortfolioRequest) {
  const { data } = await profileClient.post<PortfolioResponse>("/portfolio/update", payload);
  return data;
}

export async function fetchRisk(userId: string) {
  const { data } = await profileClient.get<RiskResponse>(`/risk/${userId}`);
  return data;
}

export async function createProfile(payload: CreateProfileRequest) {
  const { data } = await profileClient.post<CreateProfileResponse>("/api/v1/profile/create", payload);
  return data;
}

export async function fetchProfileHealth() {
  const { data } = await profileClient.get<ServiceHealth>("/health");
  return data;
}

export async function fetchModels() {
  const { data } = await patternClient.get<ModelListResponse>("/models");
  return data;
}

export async function fetchLatestPrediction(payload: PredictionRequest) {
  const { data } = await patternClient.post<PredictionResponse>("/predictions/latest", payload);
  return data;
}

export async function fetchSignalPrediction(payload: SignalPredictionRequest) {
  const { data } = await patternClient.post<SignalPredictionResponse>("/predict", payload);
  return data;
}

export async function fetchPredictionHistory(symbol: string, limit = 20) {
  const { data } = await patternClient.get<HistoricalPredictionResponse>(`/predictions/${symbol}/history`, {
    params: { limit },
  });
  return data;
}

export async function fetchPatternHealth() {
  const { data } = await patternClient.get<ServiceHealth>("/health/ready");
  return data;
}
