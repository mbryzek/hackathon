// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { mountComponent } from '$lib/test/mount';
import PhotoGallery from './PhotoGallery.svelte';

const PHOTOS = ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg'];

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
