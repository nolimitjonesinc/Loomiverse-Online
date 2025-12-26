import { supabase, getCurrentUser } from './supabase.js';

/**
 * Error Logger for Loomiverse
 * Logs errors to Supabase with timestamps for tracking and debugging
 *
 * Table: loom_error_logs
 * - id: uuid
 * - created_at: timestamp (when the error occurred)
 * - user_id: uuid (optional, if user is logged in)
 * - error_type: string (e.g., 'ai_generation', 'sync', 'auth', 'network')
 * - error_message: string
 * - error_stack: string (optional)
 * - context: jsonb (additional data like genre, provider, etc.)
 * - resolved_at: timestamp (null until fixed, for tracking)
 * - user_agent: string
 * - app_version: string
 */

const APP_VERSION = '1.0.0';

// Error types enum for consistency
export const ErrorTypes = {
  AI_GENERATION: 'ai_generation',
  SYNC: 'sync',
  AUTH: 'auth',
  NETWORK: 'network',
  STORAGE: 'storage',
  IMAGE_GENERATION: 'image_generation',
  USER_REPORT: 'user_report',
  UNKNOWN: 'unknown'
};

/**
 * Log an error to Supabase
 * @param {string} errorType - One of ErrorTypes
 * @param {string} message - Human-readable error message
 * @param {Object} context - Additional context (provider, genre, etc.)
 * @param {Error} error - Optional Error object for stack trace
 */
export async function logError(errorType, message, context = {}, error = null) {
  try {
    const user = await getCurrentUser();

    const errorLog = {
      user_id: user?.id || null,
      error_type: errorType,
      error_message: message,
      error_stack: error?.stack || null,
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : null,
        timestamp_local: new Date().toISOString()
      },
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      app_version: APP_VERSION
    };

    const { error: insertError } = await supabase
      .from('loom_error_logs')
      .insert([errorLog]);

    if (insertError) {
      // Don't throw - just log to console as fallback
      console.error('[ErrorLogger] Failed to log error to Supabase:', insertError.message);
      console.error('[ErrorLogger] Original error:', errorType, message, context);
    } else {
      console.log('[ErrorLogger] Error logged successfully:', errorType);
    }
  } catch (e) {
    // Fallback to console if logging fails
    console.error('[ErrorLogger] Exception while logging:', e);
    console.error('[ErrorLogger] Original error:', errorType, message, context);
  }
}

/**
 * Log a user-submitted bug report
 * @param {string} description - User's description of the issue
 * @param {string} category - What feature had the problem
 * @param {Object} additionalContext - Any extra context
 */
export async function submitBugReport(description, category = 'general', additionalContext = {}) {
  return logError(
    ErrorTypes.USER_REPORT,
    description,
    {
      category,
      reported_by_user: true,
      ...additionalContext
    }
  );
}

/**
 * Retry wrapper with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts (default 3)
 * @param {number} baseDelay - Base delay in ms (default 1000)
 * @param {string} errorType - Error type for logging
 * @param {Object} context - Context for error logging
 * @returns {Promise} - Result of fn or throws after all retries fail
 */
export async function withRetry(fn, {
  maxRetries = 3,
  baseDelay = 1000,
  errorType = ErrorTypes.UNKNOWN,
  context = {}
} = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[Retry] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed - log the error
  await logError(
    errorType,
    lastError?.message || 'Unknown error after retries',
    {
      ...context,
      retries_attempted: maxRetries,
      final_failure: true
    },
    lastError
  );

  throw lastError;
}

/**
 * Get error logs for admin review (requires auth)
 * @param {Object} filters - Optional filters
 * @returns {Array} - Error logs
 */
export async function getErrorLogs({
  limit = 100,
  errorType = null,
  since = null,
  unresolvedOnly = false
} = {}) {
  let query = supabase
    .from('loom_error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (errorType) {
    query = query.eq('error_type', errorType);
  }

  if (since) {
    query = query.gte('created_at', since);
  }

  if (unresolvedOnly) {
    query = query.is('resolved_at', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[ErrorLogger] Failed to fetch error logs:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Mark an error as resolved
 * @param {string} errorId - The error log ID
 */
export async function resolveError(errorId) {
  const { error } = await supabase
    .from('loom_error_logs')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', errorId);

  if (error) {
    console.error('[ErrorLogger] Failed to resolve error:', error.message);
    return false;
  }

  return true;
}

export default {
  logError,
  submitBugReport,
  withRetry,
  getErrorLogs,
  resolveError,
  ErrorTypes
};
