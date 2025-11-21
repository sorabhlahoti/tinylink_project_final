import validator from 'validator';

// Validate URL format and protocol
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check if it's a valid URL with http or https protocol
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true
  })) {
    return false;
  }
  
  return true;
}

// Validate short code format (6-8 alphanumeric characters)
export function isValidCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  const codeRegex = /^[A-Za-z0-9]{6,8}$/;
  return codeRegex.test(code);
}

// Sanitize URL to prevent injection attacks
export function sanitizeUrl(url: string): string {
  return url.trim();
}

// Check if domain is potentially malicious (basic heuristics)
export function isSuspiciousDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Basic suspicious patterns
    const suspiciousPatterns = [
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
      /[^a-z0-9.-]/, // Non-standard characters
      /(.)\1{4,}/, // Repeated characters (aaaa, 1111)
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(hostname));
  } catch {
    return true; // Invalid URL is suspicious
  }
}