  export function handleError(err: unknown): string {
    if (err instanceof Error) {
      return err.message; // Handle known Error objects
    }
    return String(err); // Fallback for unknown error types
  }

  export function getEnvValueOrFail(variableName: string): string {
    const value = process.env[variableName];
    if (!value) {
      console.error(`❌ ERROR: ${variableName} is not set in environment variables.`);
      process.exit(1);
    }
    return value;
  }