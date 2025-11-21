// Type definitions for TinyLink application

export interface Link {
  code: string;
  target_url: string;
  created_at: Date;
  deleted_at: Date | null;
  total_clicks: number;
  last_clicked: Date | null;
  owner_id: string | null;
  is_active: boolean;
}

export interface CreateLinkRequest {
  target_url: string;
  code?: string;
  owner_id?: string;
}

export interface CreateLinkResponse {
  code: string;
  target_url: string;
  short_url: string;
  created_at: Date;
}

export interface Click {
  id: number;
  code: string;
  clicked_at: Date;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
}

export interface LinkStats {
  code: string;
  target_url: string;
  total_clicks: number;
  created_at: Date;
  last_clicked: Date | null;
  click_history: Array<{ date: string; clicks: number }>;
  top_referrers: Array<{ referrer: string; count: number }>;
  device_breakdown: { desktop: number; mobile: number; tablet: number; other: number };
}

export interface AISuggestion {
  suggestions: string[];
}

export interface AICategorizationResult {
  tags: string[];
  description: string;
}

export interface AISafetyCheckResult {
  is_safe: boolean;
  risk_level: 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface AnalyticsSummary {
  total_links: number;
  total_clicks: number;
  top_links: Array<{ code: string; target_url: string; clicks: number }>;
  avg_clicks_per_day: number;
  trending_links: Array<{ code: string; target_url: string; growth_rate: number }>;
}