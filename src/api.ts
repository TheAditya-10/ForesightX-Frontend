import axios from "axios";

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  HistoryResponse,
  IndicatorResponse,
  NewsResponse,
  PortfolioResponse,
  PriceResponse,
  RiskResponse,
} from "./types";

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

export async function analyzeTicker(payload: AnalyzeRequest) {
  const { data } = await orchestrationClient.post<AnalyzeResponse>("/analyze", payload);
  return data;
}

export async function fetchPortfolio(userId: string) {
  const { data } = await profileClient.get<PortfolioResponse>(`/portfolio/${userId}`);
  return data;
}

export async function fetchRisk(userId: string) {
  const { data } = await profileClient.get<RiskResponse>(`/risk/${userId}`);
  return data;
}
