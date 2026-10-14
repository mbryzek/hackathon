// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
  namespace App {
    interface Error {
      /** The id `handleError` logged this failure under; the error page shows it. */
      errorId?: string;
    }
  }
}

export {};
