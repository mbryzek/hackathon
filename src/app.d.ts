// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

export type AdminSession = {
	id: string;
};

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			adminSession?: AdminSession | undefined;
		}
		interface PageData {
			adminSession?: AdminSession | undefined;
		}
	}
}

export {};
