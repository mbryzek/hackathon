import { redirect } from '@sveltejs/kit';
import { urls } from '#lib/urls.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  redirect(302, urls.y26Index);
};
