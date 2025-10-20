import DOMPurify from "dompurify";

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[\d\s\-()]{10,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/
};

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  if (typeof input !== "string") return "";

  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_ATTR: [],
    ALLOWED_TAGS: []
  });
};

export const sanitizeHTML = (html: string): string => {
  if (typeof html !== "string") return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_ATTR: ["href", "title", "class"],
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre"
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
  });
};

export const sanitizeUrl = (url: string): string => {
  if (typeof url !== "string") return "";

  try {
    const parsedUrl = new URL(url);

    // Only allow safe protocols
    const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }

    return parsedUrl.toString();
  } catch {
    return "";
  }
};

// Validation functions
export const validateEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

export const validateUsername = (username: string): boolean => {
  return VALIDATION_PATTERNS.USERNAME.test(username);
};

export const validateEthAddress = (address: string): boolean => {
  return VALIDATION_PATTERNS.ETH_ADDRESS.test(address);
};

export const validateUrl = (url: string): boolean => {
  return VALIDATION_PATTERNS.URL.test(url);
};

export const validatePassword = (password: string): boolean => {
  return VALIDATION_PATTERNS.PASSWORD.test(password);
};

export const validatePhone = (phone: string): boolean => {
  return VALIDATION_PATTERNS.PHONE.test(phone);
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter((time) => now - time < this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    return true;
  }

  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;

    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// XSS Protection
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    "'": "&#039;",
    '"': "&quot;",
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// CSRF Token generation
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  "base-uri": ["'self'"],
  "connect-src": [
    "'self'",
    "https://api.lens.xyz",
    "https://gateway.pinata.cloud",
    "wss:"
  ],
  "default-src": ["'self'"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "frame-src": ["'none'"],
  "img-src": ["'self'", "data:", "https:", "blob:"],
  "object-src": ["'none'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://api.lens.xyz"
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "upgrade-insecure-requests": []
};

export const generateCSPHeader = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
};

// File upload security
export const validateFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

export const validateFileExtension = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
};

// Safe JSON parsing
export const safeJSONParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

// Input length validation
export const validateInputLength = (
  input: string,
  minLength = 0,
  maxLength: number = Number.POSITIVE_INFINITY
): boolean => {
  return input.length >= minLength && input.length <= maxLength;
};

// SQL injection prevention (for display purposes)
export const sanitizeForDisplay = (input: string): string => {
  return escapeHtml(sanitizeInput(input));
};

export default {
  escapeHtml,
  generateCSPHeader,
  generateCSRFToken,
  RateLimiter,
  safeJSONParse,
  sanitizeForDisplay,
  sanitizeHTML,
  sanitizeInput,
  sanitizeUrl,
  validateEmail,
  validateEthAddress,
  validateFileExtension,
  validateFileSize,
  validateFileType,
  validateInputLength,
  validatePassword,
  validatePhone,
  validateUrl,
  validateUsername
};
