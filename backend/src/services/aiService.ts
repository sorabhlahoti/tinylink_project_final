import { AISuggestion, AICategorizationResult, AISafetyCheckResult } from '../types';
import { generateCodes } from '../utils/codeGenerator';

/**
 * Generate vanity code suggestions based on seed text
 * STUB: Replace with actual LLM API call (OpenAI, Anthropic, etc.)
 */
export async function suggestVanityCodes(seed: string): Promise<AISuggestion> {
  // TODO: Replace with real LLM call
  // Example with OpenAI:
  // const response = await openai.createCompletion({
  //   model: "text-davinci-003",
  //   prompt: `Generate 5 short, memorable URL codes based on: ${seed}`,
  //   max_tokens: 50
  // });
  
  // For now, use heuristics
  const cleanSeed = seed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
  const suggestions: string[] = [];
  
  // Add seed-based suggestions
  if (cleanSeed.length >= 6) {
    suggestions.push(cleanSeed.slice(0, 6));
    suggestions.push(cleanSeed.slice(0, 7));
  }
  
  // Add creative variations
  const prefixes = ['go', 'my', 'get'];
  prefixes.forEach(prefix => {
    if (cleanSeed.length >= 4) {
      suggestions.push(prefix + cleanSeed.slice(0, 5));
    }
  });
  
  // Fill remaining with random codes
  while (suggestions.length < 5) {
    suggestions.push(generateCodes(1, 6)[0]);
  }
  
  return { suggestions: suggestions.slice(0, 5) };
}

/**
 * Categorize URL and generate description
 * STUB: Replace with actual LLM API call
 */
export async function categorizeUrl(url: string): Promise<AICategorizationResult> {
  // TODO: Replace with real LLM call
  // Example with Anthropic:
  // const response = await anthropic.messages.create({
  //   model: "claude-3-sonnet-20240229",
  //   messages: [{ role: "user", content: `Categorize this URL: ${url}` }]
  // });
  
  // Basic heuristics for now
  const tags: string[] = [];
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('github.com')) {
    tags.push('code', 'development', 'repository');
  } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    tags.push('video', 'media', 'entertainment');
  } else if (urlLower.includes('blog') || urlLower.includes('medium.com')) {
    tags.push('blog', 'article', 'content');
  } else if (urlLower.includes('shop') || urlLower.includes('store')) {
    tags.push('shopping', 'ecommerce', 'retail');
  } else {
    tags.push('website', 'link', 'general');
  }
  
  const description = `A link to ${new URL(url).hostname}`;
  
  return { tags, description };
}

/**
 * Check URL safety for phishing/malware
 * STUB: Replace with actual safety API or LLM
 */
export async function checkUrlSafety(url: string): Promise<AISafetyCheckResult> {
  // TODO: Replace with real safety check API
  // Example: Google Safe Browsing API, VirusTotal, etc.
  
  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Basic suspicious patterns
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(hostname)) {
      reasons.push('URL uses IP address instead of domain');
      riskLevel = 'medium';
    }
    
    // Check for suspicious keywords
    const suspiciousKeywords = ['login', 'verify', 'account', 'secure', 'update', 'confirm'];
    if (suspiciousKeywords.some(keyword => hostname.includes(keyword))) {
      reasons.push('URL contains common phishing keywords');
      riskLevel = 'medium';
    }
    
    // Check for excessive subdomains
    const parts = hostname.split('.');
    if (parts.length > 4) {
      reasons.push('URL has unusual number of subdomains');
      riskLevel = 'medium';
    }
    
    // Check for port numbers (often suspicious)
    if (urlObj.port && urlObj.port !== '80' && urlObj.port !== '443') {
      reasons.push('URL uses non-standard port');
      riskLevel = 'medium';
    }
    
    const isSafe = riskLevel === 'low';
    
    return {
      is_safe: isSafe,
      risk_level: riskLevel,
      reasons: reasons.length > 0 ? reasons : ['No suspicious patterns detected']
    };
  } catch {
    return {
      is_safe: false,
      risk_level: 'high',
      reasons: ['Invalid URL format']
    };
  }
}

/**
 * Instructions for integrating real LLM providers:
 * 
 * OpenAI Integration:
 * 1. Install: npm install openai
 * 2. Import: import OpenAI from 'openai';
 * 3. Initialize: const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * 4. Use in functions above
 * 
 * Anthropic Integration:
 * 1. Install: npm install @anthropic-ai/sdk
 * 2. Import: import Anthropic from '@anthropic-ai/sdk';
 * 3. Initialize: const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * 4. Use in functions above
 * 
 * Example suggestVanityCodes with OpenAI:
 * 
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [{
 *     role: "user",
 *     content: `Generate 5 short, memorable 6-8 character URL codes for: ${seed}`
 *   }],
 *   temperature: 0.8
 * });
 * 
 * Parse response and return suggestions
 */