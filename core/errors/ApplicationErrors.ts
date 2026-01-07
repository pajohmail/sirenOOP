/**
 * Base application error class with structured error information
 */
export class ApplicationError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public metadata?: Record<string, unknown>
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            metadata: this.metadata,
        };
    }
}

/**
 * Error thrown when AI generation fails
 */
export class AIGenerationError extends ApplicationError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super(message, 'AI_GENERATION_ERROR', 500, metadata);
    }
}

/**
 * Error thrown when validation fails (input or AI response)
 */
export class ValidationError extends ApplicationError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, metadata);
    }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends ApplicationError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super(message, 'AUTHENTICATION_ERROR', 401, metadata);
    }
}

/**
 * Error thrown when persistence operations fail
 */
export class PersistenceError extends ApplicationError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super(message, 'PERSISTENCE_ERROR', 500, metadata);
    }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigurationError extends ApplicationError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super(message, 'CONFIGURATION_ERROR', 500, metadata);
    }
}
