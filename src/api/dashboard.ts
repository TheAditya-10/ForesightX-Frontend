import { dataClient, orchestrationClient, profileClient } from "./client";
import type { AnalyzeRequest, AnalyzeResponse, HistoryResponse, PortfolioResponse } from "../types";

export async function analyzeTicker(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await orchestrationClient.post<AnalyzeResponse>("/analyze", payload);
  return response.data;
}

export async function fetchPortfolio(userId: string): Promise<PortfolioResponse> {
  const response = await profileClient.get<PortfolioResponse>(`/portfolio/${userId}`);
  return response.data;
}

export async function fetchHistory(ticker: string): Promise<HistoryResponse> {
  const response = await dataClient.get<HistoryResponse>(`/history/${ticker}`, {
    params: { limit: 30 }
  });
  return response.data;
}
