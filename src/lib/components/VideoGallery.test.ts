// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { mountComponent } from '#lib/test/mount.ts';
import VideoGallery from './VideoGallery.svelte';

const VIDEOS = [
  { title: 'Team A', url: '/a.mp4' },
  { title: 'Team B', url: '/b.mp4' },
  { title: 'Team C', url: '/c.mp4' }
];

function rendered(target: HTMLElement): [string | null, string | null][] {
  return [...target.querySelectorAll('.video-container')].map((container) => [
    container.querySelector('source')?.getAttribute('src') ?? null,
    container.querySelector('p')?.textContent ?? null
  ]);
}

describe('VideoGallery shuffle', () => {
  // A draw of 0 always swaps with the first element, so three items never stay in order.
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the given order first, which is the order prerender writes and hydration must match', () => {
    const { target } = mountComponent(VideoGallery, { videos: VIDEOS, shuffleOnMount: true });
    expect(rendered(target)).toEqual([
      ['/a.mp4', 'Team A'],
      ['/b.mp4', 'Team B'],
      ['/c.mp4', 'Team C']
    ]);
  });

  it('shuffles after mount, each title still beside its own video', () => {
    const { target } = mountComponent(VideoGallery, { videos: VIDEOS, shuffleOnMount: true });
    flushSync();
    const after = rendered(target);
    expect(after.map(([src]) => src)).not.toEqual(['/a.mp4', '/b.mp4', '/c.mp4']);
    expect(after).toEqual(
      expect.arrayContaining([
        ['/a.mp4', 'Team A'],
        ['/b.mp4', 'Team B'],
        ['/c.mp4', 'Team C']
      ])
    );
  });

  it('leaves the order alone without shuffleOnMount', () => {
    const { target } = mountComponent(VideoGallery, { videos: VIDEOS });
    flushSync();
    expect(rendered(target).map(([src]) => src)).toEqual(['/a.mp4', '/b.mp4', '/c.mp4']);
  });
});
