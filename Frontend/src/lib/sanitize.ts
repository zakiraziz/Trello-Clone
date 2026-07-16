/**
 * Input sanitization helpers for security.
 * Prevents XSS attacks by stripping dangerous HTML/script content.
 */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&',
  '<': '<',
  '>': '>',
  '"': '"',
  "'": '&#x27;',
  '/': '&#x2F;',
}

/**
 * Escape HTML special characters to prevent XSS
 */
export const escapeHtml = (str: string): string => {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Strip all HTML tags from a string
 */
export const stripHtml = (str: string): string => {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize a string for safe display: strip HTML, trim, limit length
 */
export const sanitizeText = (str: string, maxLength = 5000): string => {
  return stripHtml(str).trim().slice(0, maxLength)
}

/**
 * Sanitize user input for API submission: strip HTML, trim, remove excessive whitespace
 */
export const sanitizeInput = (str: string): string => {
  return stripHtml(str)
    .trim()
    .replace(/\s+/g, ' ') // normalize whitespace
}

/**
 * Validate that a string is not empty after sanitization
 */
export const isValidText = (str: string): boolean => {
  return sanitizeInput(str).length > 0
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export const truncateText = (str: string, maxLength: number): string => {
  const sanitized = sanitizeText(str, maxLength + 50)
  if (sanitized.length <= maxLength) return sanitized
  return sanitized.slice(0, maxLength).trimEnd() + '…'
}