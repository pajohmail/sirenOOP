import { z } from 'zod';
import { ConfigurationError } from '@/core/errors/ApplicationErrors';

/**
 * Environment variable schema
 * Validates all required configuration at startup
 */
const EnvSchema = z.object({
    // Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),

    // Google Cloud Configuration
    NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID: z.string().min(1, 'Google Cloud project ID is required'),
    NEXT_PUBLIC_GOOGLE_CLOUD_LOCATION: z.string().default('europe-north1'),

    // Gemini AI Configuration
    NEXT_PUBLIC_GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
    NEXT_PUBLIC_GEMINI_MODEL: z.string().default('gemini-2.0-flash-exp'),
    NEXT_PUBLIC_GEMINI_TEMPERATURE: z.string()
        .transform(val => parseFloat(val))
        .pipe(z.number().min(0).max(2))
        .default(0.7),
    NEXT_PUBLIC_GEMINI_MAX_TOKENS: z.string()
        .transform(val => parseInt(val, 10))
        .pipe(z.number().positive())
        .default(2048),
});

/**
 * Validates environment variables
 * @throws ConfigurationError if validation fails (except in test mode)
 */
function validateEnv() {
    // In test environment, use defaults to avoid breaking tests
    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

    try {
        return EnvSchema.parse({
            NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (isTest ? 'test-api-key' : undefined),
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (isTest ? 'test.firebaseapp.com' : undefined),
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (isTest ? 'test-project' : undefined),
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (isTest ? 'test.appspot.com' : undefined),
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || (isTest ? '123456' : undefined),
            NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || (isTest ? 'test-app-id' : undefined),
            NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID || (isTest ? 'test-project' : undefined),
            NEXT_PUBLIC_GOOGLE_CLOUD_LOCATION: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_LOCATION || 'europe-north1',
            NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || (isTest ? 'test-gemini-key' : undefined),
            NEXT_PUBLIC_GEMINI_MODEL: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-exp',
            NEXT_PUBLIC_GEMINI_TEMPERATURE: process.env.NEXT_PUBLIC_GEMINI_TEMPERATURE || '0.7',
            NEXT_PUBLIC_GEMINI_MAX_TOKENS: process.env.NEXT_PUBLIC_GEMINI_MAX_TOKENS || '2048',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const zodError = error as any;
            const errorMessages = zodError.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Unknown validation error';
            throw new ConfigurationError(
                `Environment validation failed: ${errorMessages}`,
                { zodErrors: zodError.errors }
            );
        }
        throw error;
    }
}

// Validate on module load (will use test defaults in test mode)
const validatedEnv = validateEnv();

/**
 * Application configuration
 * All configuration values are validated and type-safe
 */
export const config = {
    firebase: {
        apiKey: validatedEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: validatedEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: validatedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: validatedEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: validatedEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: validatedEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    googleCloud: {
        projectId: validatedEnv.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID,
        location: validatedEnv.NEXT_PUBLIC_GOOGLE_CLOUD_LOCATION,
    },
    gemini: {
        apiKey: validatedEnv.NEXT_PUBLIC_GEMINI_API_KEY,
        model: validatedEnv.NEXT_PUBLIC_GEMINI_MODEL,
        temperature: validatedEnv.NEXT_PUBLIC_GEMINI_TEMPERATURE,
        maxTokens: validatedEnv.NEXT_PUBLIC_GEMINI_MAX_TOKENS,
    },
} as const;

// Type-safe config object
export type AppConfig = typeof config;
