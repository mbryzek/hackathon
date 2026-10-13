// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

export type AdminSession = {
  id: string;
  /** The signed-in admin's name and email, as the API confirmed them. Absent when it could not say. */
  name?: string | undefined;
  email?: string | undefined;
};

declare global {
  namespace App {
    interface Error {
      /** The id `handleError` logged this failure under; the error page shows it. */
      errorId?: string;
    }
    interface Locals {
      /**
       * The admin session id from the httpOnly cookie, with the name and email of the admin it
       * belongs to. The id is server-side only and never returned as page data — see
       * `#lib/server/adminSession.ts` and ISS-788; the name and email are what the account menu shows.
       */
      adminSession?: AdminSession | undefined;
    }
  }
}

export {};
