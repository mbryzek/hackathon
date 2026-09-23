// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

export type AdminSession = {
  id: string;
};

declare global {
  namespace App {
    interface Error {
      /** The id `handleError` logged this failure under; the error page shows it. */
      errorId?: string;
    }
    interface Locals {
      /**
       * The admin session id from the httpOnly cookie. Server-side only, and never returned
       * as page data — see `$lib/server/adminSession` and ISS-788.
       */
      adminSession?: AdminSession | undefined;
    }
  }
}

export {};
