// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { mountComponent, settle } from '#lib/test/mount.ts';
import AccountMenu from './AccountMenu.svelte';

function render(props: { name?: string | null; email?: string | null } = {}): HTMLElement {
  return mountComponent(AccountMenu, {
    name: props.name === undefined ? 'Ada Lovelace' : props.name,
    email: props.email === undefined ? 'ada@example.com' : props.email,
    profileHref: '/vote/admin/profile',
    logoutAction: '/vote/admin/logout'
  }).target;
}

function chip(target: HTMLElement): HTMLButtonElement {
  return target.querySelector('button[aria-label="Account menu"]') as HTMLButtonElement;
}

function menu(target: HTMLElement): HTMLElement | null {
  return target.querySelector('[role="menu"]');
}

async function open(target: HTMLElement): Promise<void> {
  chip(target).click();
  await settle();
}

describe('AccountMenu', () => {
  it('shows the initials and the name on a closed chip', () => {
    const target = render();

    expect(chip(target).textContent).toContain('AL');
    expect(chip(target).textContent).toContain('Ada Lovelace');
    expect(chip(target).getAttribute('aria-haspopup')).toBe('menu');
    expect(chip(target).getAttribute('aria-expanded')).toBe('false');
    expect(menu(target)).toBeNull();
  });

  it('falls back to the email when the person has no name', () => {
    const target = render({ name: null });

    expect(chip(target).textContent).toContain('ada@example.com');
    expect(chip(target).textContent).toContain('AD');
  });

  it('opens on Your Profile and a Log out that POSTs to the logout route', async () => {
    const target = render();
    await open(target);

    const items = [...(menu(target)?.querySelectorAll('[role="menuitem"]') ?? [])];
    expect(items.map((item) => item.textContent?.trim())).toEqual(['Your Profile', 'Log out']);
    expect(items[0]?.getAttribute('href')).toBe('/vote/admin/profile');

    const form = items[1]?.closest('form');
    expect(form?.getAttribute('method')).toBe('POST');
    expect(form?.getAttribute('action')).toBe('/vote/admin/logout');
    expect(chip(target).getAttribute('aria-expanded')).toBe('true');
  });

  it('closes on Escape', async () => {
    const target = render();
    await open(target);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle();

    expect(menu(target)).toBeNull();
  });

  it('closes on a click outside it and stays open on a click inside it', async () => {
    const target = render();
    await open(target);

    menu(target)?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await settle();
    expect(menu(target)).not.toBeNull();

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await settle();
    expect(menu(target)).toBeNull();
  });

  it('closes when Your Profile is chosen', async () => {
    const target = render();
    await open(target);

    const profile = menu(target)?.querySelector('a[role="menuitem"]') as HTMLAnchorElement;
    profile.addEventListener('click', (event) => event.preventDefault());
    profile.click();
    await settle();

    expect(menu(target)).toBeNull();
  });
});
