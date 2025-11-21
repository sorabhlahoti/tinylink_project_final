import React, { useState } from 'react';
import { createLink, suggestCodes } from '../utils/api';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

// Modal for creating new short links with validation and AI suggestions
const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shortUrl, setShortUrl] = useState('');
  const [showResult, setShowResult] = useState(false);

  if (!isOpen) return null;

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Validate custom code format
  const isValidCode = (code: string): boolean => {
    return /^[A-Za-z0-9]{6,8}$/.test(code);
  };

  // Get AI-powered code suggestions
  const handleGetSuggestions = async () => {
    if (!targetUrl) {
      onError('Please enter a URL first');
      return;
    }

    try {
      const hostname = new URL(targetUrl).hostname.replace('www.', '');
      const result = await suggestCodes(hostname);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  // Create the short link
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!targetUrl || !isValidUrl(targetUrl)) {
      onError('Please enter a valid URL (http or https)');
      return;
    }

    if (customCode && !isValidCode(customCode)) {
      onError('Custom code must be 6-8 alphanumeric characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createLink({
        target_url: targetUrl,
        code: customCode || undefined
      });

      setShortUrl(result.short_url);
      setShowResult(true);
      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 409) {
        onError('This code is already taken. Try another one!');
      } else {
        onError(error.response?.data?.error || 'Failed to create link');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      onError('Copied to clipboard! 📋');
    } catch (error) {
      onError('Failed to copy');
    }
  };

  // Reset and close modal
  const handleClose = () => {
    setTargetUrl('');
    setCustomCode('');
    setSuggestions([]);
    setShortUrl('');
    setShowResult(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!showResult ? (
          <>
            <h2 id="modal-title" className="text-3xl font-bold text-white mb-6">
              🔗 Create Short Link
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target URL Input */}
              <div>
                <label htmlFor="target-url" className="block text-white mb-2 font-medium">
                  Target URL *
                </label>
                <input
                  id="target-url"
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
                  required
                  aria-required="true"
                />
              </div>

              {/* Custom Code Input */}
              <div>
                <label htmlFor="custom-code" className="block text-white mb-2 font-medium">
                  Custom Code (optional)
                </label>
                <input
                  id="custom-code"
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="mycustom"
                  pattern="[A-Za-z0-9]{6,8}"
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-describedby="code-help"
                />
                <p id="code-help" className="text-sm text-gray-200 mt-1">
                  6-8 alphanumeric characters
                </p>
              </div>

              {/* AI Suggestions */}
              <button
                type="button"
                onClick={handleGetSuggestions}
                className="text-white hover:underline text-sm"
              >
                ✨ Get AI suggestions
              </button>

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setCustomCode(suggestion)}
                      className="px-3 py-1 bg-white bg-opacity-30 text-white rounded-full text-sm hover:bg-opacity-40 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-white text-purple-600 font-bold py-3 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
                  aria-busy={isLoading}
                >
                  {isLoading ? 'Creating...' : '🚀 Create Link'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 bg-white bg-opacity-20 text-white font-bold py-3 rounded-lg hover:bg-opacity-30 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-white mb-6">🎉 Link Created!</h2>

            <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
              <p className="text-white text-sm mb-2">Your short link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shortUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded bg-white bg-opacity-30 text-white"
                  aria-label="Generated short URL"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-white text-purple-600 rounded hover:bg-opacity-90 transition font-medium"
                  aria-label="Copy to clipboard"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-white text-purple-600 font-bold py-3 rounded-lg hover:bg-opacity-90 transition"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateLinkModal;