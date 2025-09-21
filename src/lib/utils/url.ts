/**
 * URL utility functions for consistent URL generation across the application
 */

/**
 * Get the base URL for the application
 * Uses NEXT_PUBLIC_SITE_URL in production, falls back to NEXTAUTH_URL, then localhost
 */
export function getBaseUrl(): string {
  // In production, use NEXT_PUBLIC_SITE_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""); // Remove trailing slash
  }

  // Fallback to NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, ""); // Remove trailing slash
  }

  // Development fallback
  return "http://localhost:3000";
}

/**
 * Generate invitation URL
 */
export function getInvitationUrl(token: string): string {
  return `${getBaseUrl()}/join/${token}`;
}

/**
 * Generate public file sharing URL
 */
export function getPublicFileUrl(token: string): string {
  return `${getBaseUrl()}/public/file/${token}`;
}

/**
 * Generate email verification URL
 */
export function getEmailVerificationUrl(token: string): string {
  return `${getBaseUrl()}/api/auth/verify-email?token=${token}`;
}

/**
 * Generate password reset URL
 */
export function getPasswordResetUrl(token: string): string {
  return `${getBaseUrl()}/forgot-password?token=${token}`;
}

/**
 * Generate email change confirmation URL
 */
export function getEmailChangeConfirmationUrl(token: string): string {
  return `${getBaseUrl()}/api/auth/confirm-email-change?token=${token}`;
}

/**
 * Generate client access URL (for external clients)
 */
export function getClientAccessUrl(token: string): string {
  return `${getBaseUrl()}/client/${token}`;
}
