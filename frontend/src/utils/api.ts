import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API client instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Types
export interface Link {
  code: string;
  target_url: string;
  created_at: string;
  total_clicks: number;
  last_clicked: string | null;
  is_active: boolean;
}

export interface CreateLinkRequest {
  target_url: string;
  code?: string;
}

export interface CreateLinkResponse {
  code: string;
  target_url: string;
  short_url: string;
  created_at: string;
}

export interface LinkStats {
  code: string;
  target_url: string;
  total_clicks: number;
  created_at: string;
  last_clicked: string | null;
  click_history: Array<{ date: string; clicks: number }>;
  top_referrers: Array<{ referrer: string; count: number }>;
  device_breakdown: { desktop: number; mobile: number; tablet: number; other: number };
}

// API functions
export const createLink = async (data: CreateLinkRequest): Promise<CreateLinkResponse> => {
  const response = await api.post('/api/links', data);
  return response.data;
};

export const getLinks = async (): Promise<Link[]> => {
  const response = await api.get('/api/links');
  return response.data;
};

export const getLinkStats = async (code: string): Promise<LinkStats> => {
  const response = await api.get(`/api/links/${code}/stats`);
  return response.data;
};

export const deleteLink = async (code: string): Promise<void> => {
  await api.delete(`/api/links/${code}`);
};

export const suggestCodes = async (seed: string): Promise<{ suggestions: string[] }> => {
  const response = await api.post('/api/ai/suggest-code', { seed });
  return response.data;
};