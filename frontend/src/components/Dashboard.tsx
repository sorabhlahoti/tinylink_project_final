import React, { useState, useEffect } from 'react';
import { getLinks, deleteLink, Link } from '../utils/api';
import CreateLinkModal from './CreateLinkModal';
import Toast from './Toast';
import Confetti from './Confetti';

// Main dashboard component with link listing and management
const Dashboard: React.FC = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'clicks'>('created');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  // Load links on mount
  useEffect(() => {
    loadLinks();
  }, []);

  // Filter and sort links when search or sort changes
  useEffect(() => {
    let filtered = [...links];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (link) =>
          link.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.target_url.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'clicks') {
        return b.total_clicks - a.total_clicks;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredLinks(filtered);
  }, [links, searchQuery, sortBy]);

  // Fetch all links from API
  const loadLinks = async () => {
    try {
      setIsLoading(true);
      const data = await getLinks();
      setLinks(data);
    } catch (error) {
      showToast('Failed to load links', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle link creation success
  const handleCreateSuccess = () => {
    setShowConfetti(true);
    showToast('Link created successfully! 🎉', 'success');
    loadLinks();
  };

  // Handle link deletion
  const handleDelete = async (code: string) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      await deleteLink(code);
      showToast('Link deleted successfully', 'success');
      loadLinks();
    } catch (error) {
      showToast('Failed to delete link', 'error');
    }
  };

  // Copy link to clipboard
  const handleCopy = async (code: string) => {
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
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 animate-float">
            🔗 TinyLink
          </h1>
          <p className="text-xl text-white opacity-90">
            Simple, fast URL shortening for everyone
          </p>
        </div>

        {/* Create Link Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-purple-600 font-bold px-8 py-4 rounded-full text-lg hover:scale-105 transition-transform shadow-2xl"
            aria-label="Create new short link"
          >
            ➕ Create New Link
          </button>
        </div>

        {/* Search and Sort Controls */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="🔍 Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Search links"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'created' | 'clicks')}
              className="px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Sort links by"
            >
              <option value="created" className="text-gray-900">
                Latest First
              </option>
              <option value="clicks" className="text-gray-900">
                Most Clicks
              </option>
            </select>
          </div>
        </div>

        {/* Links List */}
        {isLoading ? (
          <div className="text-center text-white text-xl py-12">
            Loading links...
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-white text-xl mb-4">
              {searchQuery ? 'No links match your search' : 'No links yet! Create your first one.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-white underline hover:no-underline"
              >
                Create your first link →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLinks.map((link) => (
              <div
                key={link.code}
                className="glass rounded-xl p-6 hover:bg-opacity-20 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Link Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {/* FIXED: proper <a> tag */}
                      <a
                        href={`/code/${link.code}`}
                        className="text-2xl font-bold text-white hover:underline"
                      >
                        {link.code}
                      </a>
                      <button
                        onClick={() => handleCopy(link.code)}
                        className="text-white hover:scale-110 transition"
                        aria-label={`Copy ${link.code}`}
                        title="Copy link"
                      >
                        📋
                      </button>
                    </div>
                    <p className="text-white opacity-75 truncate mb-2">
                      → {link.target_url}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-white opacity-60">
                      <span>📅 {formatDate(link.created_at)}</span>
                      <span>👆 {link.total_clicks} clicks</span>
                      {link.last_clicked && (
                        <span>🕐 Last: {formatDate(link.last_clicked)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* FIXED: proper <a> tag */}
                    <a
                      href={`/code/${link.code}`}
                      className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition font-medium"
                    >
                      📊 Stats
                    </a>
                    <button
                      onClick={() => handleDelete(link.code)}
                      className="px-4 py-2 bg-red-500 bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition font-medium"
                      aria-label={`Delete ${link.code}`}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {links.length > 0 && (
          <div className="glass rounded-xl p-6 mt-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-4xl font-bold text-white mb-2">
                  {links.length}
                </p>
                <p className="text-white opacity-75">Total Links</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-2">
                  {links.reduce((sum, link) => sum + link.total_clicks, 0)}
                </p>
                <p className="text-white opacity-75">Total Clicks</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-2">
                  {Math.round(
                    links.reduce((sum, link) => sum + link.total_clicks, 0) /
                      links.length
                  )}
                </p>
                <p className="text-white opacity-75">Avg Clicks/Link</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals and Notifications */}
      <CreateLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
        onError={(msg) => showToast(msg, 'error')}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showConfetti && (
        <Confetti onComplete={() => setShowConfetti(false)} />
      )}
    </div>
  );
};

export default Dashboard;
