// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { flushSync } from 'svelte';
import { mountComponent } from '#lib/test/mount.ts';
import PhotoGallery from './PhotoGallery.svelte';

const URLS = ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg'];
const PHOTOS = URLS.map((url) => ({ url, width: 640, height: 480 }));

function openLightbox(): HTMLElement {
  const { target } = mountComponent(PhotoGallery, { photos: PHOTOS });
  (target.querySelector('button[aria-label="View photo in lightbox"]') as HTMLElement).click();
  flushSync();
  return target;
}

function viewer(): HTMLElement {
  return document.querySelector('[aria-label="Photo viewer, swipe to navigate"]') as HTMLElement;
}

function counter(): string {
  return (viewer().querySelector('.bottom-4') as HTMLElement).textContent?.trim() ?? '';
}

/** jsdom has no `Touch` constructor, so the coordinates ride on a plain `touches` list. */
function touch(type: 'touchstart' | 'touchmove' | 'touchend', clientX?: number): void {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'touches', { value: clientX === undefined ? [] : [{ clientX }] });
  viewer().dispatchEvent(event);
  flushSync();
}

/** What a touch device does for a tap on the Next button: touchstart, touchend, then click. */
function tapNext(clientX: number): void {
  touch('touchstart', clientX);
  touch('touchend');
  (viewer().querySelector('button[aria-label="Next photo"]') as HTMLElement).click();
  flushSync();
}

describe('PhotoGallery thumbnails', () => {
  it('reserves each lazy thumbnail its space, which is what lets the browser defer the ones below the fold', () => {
    const { target } = mountComponent(PhotoGallery, { photos: [{ url: '/portrait.jpg', width: 360, height: 640 }] });
    const image = target.querySelector('img') as HTMLImageElement;

    expect(image.getAttribute('src')).toBe('/portrait.jpg');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('width')).toBe('360');
    expect(image.getAttribute('height')).toBe('640');
  });
});

describe('PhotoGallery lightbox touch navigation', () => {
  it('moves one photo per tap on Next, including the first tap', () => {
    openLightbox();
    expect(counter()).toBe('1 / 5');

    tapNext(350);
    expect(counter()).toBe('2 / 5');
  });

  it('does not replay the previous swipe on the next tap', () => {
    openLightbox();

    touch('touchstart', 300);
    touch('touchmove', 100);
    touch('touchend');
    expect(counter()).toBe('2 / 5');

    tapNext(350);
    expect(counter()).toBe('3 / 5');
  });

  it('navigates on a swipe in either direction', () => {
    openLightbox();

    touch('touchstart', 300);
    touch('touchmove', 100);
    touch('touchend');
    expect(counter()).toBe('2 / 5');

    touch('touchstart', 100);
    touch('touchmove', 300);
    touch('touchend');
    expect(counter()).toBe('1 / 5');
  });
});

describe('PhotoGallery shuffle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const thumbnails = (target: HTMLElement) =>
    [...target.querySelectorAll('button[aria-label="View photo in lightbox"] img')].map((img) => img.getAttribute('src'));

  it('renders the given order first, which is the order prerender writes and hydration must match', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { target } = mountComponent(PhotoGallery, { photos: PHOTOS, shuffleOnMount: true });
    expect(thumbnails(target)).toEqual(URLS);
  });

  it('opens the photo that was clicked once the shuffle has moved it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { target } = mountComponent(PhotoGallery, { photos: PHOTOS, shuffleOnMount: true });
    flushSync();

    const shown = thumbnails(target);
    expect(shown).not.toEqual(URLS);

    (target.querySelectorAll('button[aria-label="View photo in lightbox"]')[2] as HTMLElement).click();
    flushSync();
    expect(viewer().querySelector('img')?.getAttribute('src')).toBe(shown[2]);
  });
});
