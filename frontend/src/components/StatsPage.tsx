import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLinkStats, LinkStats } from '../utils/api';
import Toast from './Toast';

// Detailed statistics page for a single link
const StatsPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (code) {
      loadStats();
    }
  }, [code]);

  // Load statistics from API
  const loadStats = async () => {
    if (!code) return;

    try {
      setIsLoading(true);
      const data = await getLinkStats(code);
      setStats(data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast('Link not found', 'error');
        setTimeout(() => navigate('/'), 2000);
      } else {
        showToast('Failed to load statistics', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Copy short URL to clipboard
  const handleCopy = async () => {
    const shortUrl = `${baseUrl}/${code}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      showToast('Copied to clipboard! 📋', 'success');
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate sparkline visualization for click history
  const renderSparkline = () => {
    if (!stats || stats.click_history.length === 0) {
      return <div className="text-white opacity-50">No data yet</div>;
    }

    const maxClicks = Math.max(...stats.click_history.map(d => d.clicks), 1);
    
    return (
      <div className="flex items-end gap-1 h-24">
        {[...stats.click_history].reverse().map((day, idx) => {
          const height = (day.clicks / maxClicks) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-white rounded-t transition-all hover:bg-opacity-90"
                style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                title={`${day.date}: ${day.clicks} clicks`}
              />
              <span className="text-xs text-white opacity-60">
                {new Date(day.date).getDate()}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-2xl">Loading statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalDevices = Object.values(stats.device_breakdown).reduce((a: any, b: any) => a + b, 0);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="text-white hover:underline mb-6 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div className="glass rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white">
              📊 Link Statistics
            </h1>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-opacity-90 transition font-medium"
              aria-label="Copy short URL"
            >
              📋 Copy Link
            </button>
          </div>

          {/* Short Code */}
          <div className="mb-4">
            <p className="text-white opacity-75 mb-2">Short Code:</p>
            <p className="text-3xl font-bold text-white break-all">
              {baseUrl}/{stats.code}
            </p>
          </div>

          {/* Target URL */}
          <div>
            <p className="text-white opacity-75 mb-2">Target URL:</p>
            <a
              href={stats.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline break-all"
            >
              {stats.target_url}
            </a>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-5xl font-bold text-white mb-2">
              {stats.total_clicks}
            </p>
            <p className="text-white opacity-75">Total Clicks</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-white opacity-75 mb-2">Created</p>
            <p className="text-xl font-bold text-white">
              {formatDate(stats.created_at)}
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-white opacity-75 mb-2">Last Clicked</p>
            <p className="text-xl font-bold text-white">
              {stats.last_clicked ? formatDate(stats.last_clicked) : 'Never'}
            </p>
          </div>
        </div>

        {/* Click History (7-day sparkline) */}
        <div className="glass rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            📈 7-Day Click History
          </h2>
          {renderSparkline()}
        </div>

        {/* Top Referrers */}
        <div className="glass rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            🔗 Top Referrers
          </h2>
          {stats.top_referrers.length === 0 ? (
            <p className="text-white opacity-50">No referrer data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.top_referrers.map((referrer, idx) => {
                const percentage = stats.total_clicks > 0
                  ? (referrer.count / stats.total_clicks * 100).toFixed(1)
                  : 0;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-white font-medium">
                          {referrer.referrer}
                        </span>
                        <span className="text-white opacity-75">
                          {referrer.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                        <div
                          className="bg-white rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            📱 Device Breakdown
          </h2>
          {totalDevices === 0 ? (
            <p className="text-white opacity-50">No device data yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.device_breakdown).map(([device, count]) => {
                const percentage = totalDevices > 0
                  ? (count / totalDevices * 100).toFixed(1)
                  : 0;
                const icons: Record<string, string> = {
                  desktop: '🖥️',
                  mobile: '📱',
                  tablet: '📱',
                  other: '❓'
                };
                return (
                  <div key={device} className="text-center">
                    <p className="text-4xl mb-2">{icons[device]}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-white opacity-75 capitalize">{device}</p>
                    <p className="text-white opacity-50 text-sm">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-6 text-center">
          <a
            href={`${baseUrl}/api/links/${code}/export`}
            download
            className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-opacity-90 transition"
          >
            📥 Export Click Data (CSV)
          </a>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default StatsPage;
