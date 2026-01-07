import { ApplicationError } from '../errors/ApplicationErrors';

/**
 * Converts unknown errors to ApplicationError instances
 * Ensures consistent error handling across the application
 */
export function handleError(error: unknown): ApplicationError {
    // Already an ApplicationError, return as-is
    if (error instanceof ApplicationError) {
        return error;
    }

    // Standard Error object
    if (error instanceof Error) {
        return new ApplicationError(
            error.message,
            'UNKNOWN_ERROR',
            500,
            {
                originalError: error.name,
                stack: error.stack,
            }
        );
    }

    // Primitive or unknown type
    return new ApplicationError(
        'An unknown error occurred',
        'UNKNOWN_ERROR',
        500,
        { error: String(error) }
    );
}

/**
 * Determines if an error is operational (expected) vs programmer error
 * Operational errors are expected and should be handled gracefully
 */
export function isOperationalError(error: Error): boolean {
    return error instanceof ApplicationError;
}

/**
 * Logs error with appropriate level based on type
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
    const appError = handleError(error);

    const logData = {
        ...appError.toJSON(),
        context,
        timestamp: new Date().toISOString(),
    };

    if (appError.statusCode >= 500) {
        console.error('[ERROR]', JSON.stringify(logData, null, 2));
    } else {
        console.warn('[WARN]', JSON.stringify(logData, null, 2));
    }
}
