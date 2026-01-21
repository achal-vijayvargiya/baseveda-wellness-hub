/**
 * Application Configuration
 * 
 * This file contains configuration flags and settings for the application.
 */

/**
 * Platform-Only Mode
 * 
 * When enabled, this flag enforces that only Platform NCP APIs should be used.
 * Legacy APIs will throw errors if accessed when this is true.
 * 
 * Set to true to enforce Platform NCP workflow only.
 * Set to false to allow both legacy and platform APIs (during migration).
 */
export const PLATFORM_ONLY_MODE = false;

/**
 * Show Deprecation Warnings
 * 
 * When enabled, shows console warnings when deprecated APIs are used.
 */
export const SHOW_DEPRECATION_WARNINGS = true;

/**
 * API Base URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

