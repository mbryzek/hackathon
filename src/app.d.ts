// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from '$generated/vote-admin/vote-admin';

export type AdminSession = {
	id: string;
	user: User;
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
