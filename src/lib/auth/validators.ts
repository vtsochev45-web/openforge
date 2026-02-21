/**
 * Authentication Input Validators
 * 
 * Email and password validation utilities for secure authentication.
 * 
 * @module lib/auth/validators
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
}

// Email regex pattern (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Password requirements
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  
  if (normalizedEmail.length > 254) {
    return false;
  }
  
  return EMAIL_REGEX.test(normalizedEmail);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  
  // Check length
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  
  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }
  
  // Check complexity
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSpecialChars) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common patterns
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common');
  }
  
  // Check for sequential characters
  if (hasSequentialChars(password)) {
    errors.push('Password cannot contain sequential characters (e.g., "abc", "123")');
  }
  
  // Check for repeated characters
  if (hasRepeatedChars(password)) {
    errors.push('Password cannot contain repeated characters (e.g., "aaa", "111")');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength score
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];
  
  if (!password) {
    return { score: 0, feedback: ['Enter a password'] };
  }
  
  // Length scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  // Complexity scoring
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const complexityScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars]
    .filter(Boolean).length;
  
  if (complexityScore >= 3) score++;
  if (complexityScore === 4) score++;
  
  // Generate feedback
  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  }
  if (!hasUpperCase || !hasLowerCase) {
    feedback.push('Mix uppercase and lowercase letters');
  }
  if (!hasNumbers) {
    feedback.push('Add numbers');
  }
  if (!hasSpecialChars) {
    feedback.push('Add special characters (!@#$%^&*)');
  }
  
  return { score, feedback };
}

/**
 * Check for sequential characters
 */
function hasSequentialChars(password: string): boolean {
  const sequences = ['abcdefghijklmnopqrstuvwxyz', '01234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const lowerPassword = password.toLowerCase();
  
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      if (lowerPassword.includes(seq.substring(i, i + 3))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check for repeated characters
 */
function hasRepeatedChars(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];
  
  if (!username || typeof username !== 'string') {
    return { valid: false, errors: ['Username is required'] };
  }
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  
  if (username.length > 30) {
    errors.push('Username must not exceed 30 characters');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  if (username.startsWith('-') || username.startsWith('_')) {
    errors.push('Username cannot start with a hyphen or underscore');
  }
  
  const reservedUsernames = ['admin', 'root', 'system', 'api', 'www', 'mail'];
  if (reservedUsernames.includes(username.toLowerCase())) {
    errors.push('This username is reserved');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate name (first/last name)
 */
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    return { valid: true, errors: [] }; // Name is optional
  }
  
  const sanitized = sanitizeInput(name);
  
  if (sanitized.length > 100) {
    errors.push('Name must not exceed 100 characters');
  }
  
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    errors.push('Name contains invalid characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Combined registration validation
 */
export function validateRegistration(data: {
  email: string;
  password: string;
  name?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  // Validate email
  if (!validateEmail(data.email)) {
    errors.push('Invalid email address');
  }
  
  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.push(...passwordValidation.errors);
  }
  
  // Validate name if provided
  if (data.name) {
    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
      errors.push(...nameValidation.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  validateEmail,
  validatePassword,
  checkPasswordStrength,
  validateUsername,
  validateName,
  validateRegistration,
  sanitizeInput,
};