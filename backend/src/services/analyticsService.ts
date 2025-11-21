import { pool } from '../config/database';
import { LinkStats, AnalyticsSummary, Click } from '../types';

/**
 * Get detailed statistics for a specific link
 */
export async function getLinkStats(code: string): Promise<LinkStats | null> {
  const client = await pool.connect();
  
  try {
    // Get link info
    const linkResult = await pool.query(
      'SELECT * FROM links WHERE code = $1 AND is_active = true',
      [code]
    );
    
    if (linkResult.rows.length === 0) {
      return null;
    }
    
    const link = linkResult.rows[0];
    
    // Get 7-day click history
    const historyResult = await pool.query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM clicks
       WHERE code = $1 
         AND clicked_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC`,
      [code]
    );
    
    // Get top referrers
    const referrersResult = await pool.query(
      `SELECT COALESCE(referrer, 'Direct') as referrer, COUNT(*) as count
       FROM clicks
       WHERE code = $1
       GROUP BY referrer
       ORDER BY count DESC
       LIMIT 5`,
      [code]
    );
    
    // Get device breakdown (simplified heuristic)
    const clicksResult = await pool.query<Click>(
      'SELECT user_agent FROM clicks WHERE code = $1',
      [code]
    );
    
    const deviceBreakdown = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      other: 0
    };
    
    clicksResult.rows.forEach(click => {
      const ua = (click.user_agent || '').toLowerCase();
      if (ua.includes('mobile')) {
        deviceBreakdown.mobile++;
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceBreakdown.tablet++;
      } else if (ua.includes('mozilla') || ua.includes('chrome')) {
        deviceBreakdown.desktop++;
      } else {
        deviceBreakdown.other++;
      }
    });
    
    return {
      code: link.code,
      target_url: link.target_url,
      total_clicks: link.total_clicks,
      created_at: link.created_at,
      last_clicked: link.last_clicked,
      click_history: historyResult.rows,
      top_referrers: referrersResult.rows,
      device_breakdown: deviceBreakdown
    };
  } finally {
    client.release();
  }
}

/**
 * Export clicks data as CSV
 */
export async function exportClicksCSV(code: string): Promise<string> {
  const result = await pool.query<Click>(
    `SELECT clicked_at, referrer, user_agent 
     FROM clicks 
     WHERE code = $1 
     ORDER BY clicked_at DESC`,
    [code]
  );
  
  if (result.rows.length === 0) {
    return 'clicked_at,referrer,user_agent\n';
  }
  
  const header = 'clicked_at,referrer,user_agent\n';
  const rows = result.rows.map(row => 
    `${row.clicked_at.toISOString()},${row.referrer || 'Direct'},"${row.user_agent || 'Unknown'}"`
  ).join('\n');
  
  return header + rows;
}

/**
 * Get overall analytics summary
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  // Total links and clicks
  const totalsResult = await pool.query(
    `SELECT 
       COUNT(*) as total_links,
       COALESCE(SUM(total_clicks), 0) as total_clicks
     FROM links 
     WHERE is_active = true`
  );
  
  // Top 5 links by clicks
  const topLinksResult = await pool.query(
    `SELECT code, target_url, total_clicks as clicks
     FROM links
     WHERE is_active = true
     ORDER BY total_clicks DESC
     LIMIT 5`
  );
  
  // Calculate average clicks per day
  const avgResult = await pool.query(
    `SELECT 
       COALESCE(COUNT(*)::float / NULLIF(COUNT(DISTINCT DATE(clicked_at)), 0), 0) as avg_per_day
     FROM clicks
     WHERE clicked_at >= NOW() - INTERVAL '30 days'`
  );
  
  // Trending links (most growth in last 7 days vs previous 7 days)
  const trendingResult = await pool.query(
    `WITH recent AS (
       SELECT code, COUNT(*) as recent_clicks
       FROM clicks
       WHERE clicked_at >= NOW() - INTERVAL '7 days'
       GROUP BY code
     ),
     previous AS (
       SELECT code, COUNT(*) as previous_clicks
       FROM clicks
       WHERE clicked_at >= NOW() - INTERVAL '14 days'
         AND clicked_at < NOW() - INTERVAL '7 days'
       GROUP BY code
     )
     SELECT 
       l.code,
       l.target_url,
       COALESCE(r.recent_clicks, 0)::float / NULLIF(COALESCE(p.previous_clicks, 1), 0) as growth_rate
     FROM links l
     LEFT JOIN recent r ON l.code = r.code
     LEFT JOIN previous p ON l.code = p.code
     WHERE l.is_active = true
       AND COALESCE(r.recent_clicks, 0) > 0
     ORDER BY growth_rate DESC
     LIMIT 5`
  );
  
  return {
    total_links: parseInt(totalsResult.rows[0].total_links),
    total_clicks: parseInt(totalsResult.rows[0].total_clicks),
    top_links: topLinksResult.rows,
    avg_clicks_per_day: parseFloat(avgResult.rows[0].avg_per_day),
    trending_links: trendingResult.rows
  };
}