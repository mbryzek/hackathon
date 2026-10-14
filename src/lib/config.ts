export const config = {
  isProduction: import.meta.env['VITE_ENVIRONMENT'] === 'production' || import.meta.env.PROD
} as const;
