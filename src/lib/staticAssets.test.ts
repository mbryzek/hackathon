import { describe, it, expect } from 'vitest';
import { staticAsset, staticAssets } from './staticAssets';
import { photosY25 } from './data/photos-y25';
import { sponsorsY24 } from './data/sponsors-y24';
import { videosY25 } from './data/videos-y25';
import { urls } from './urls';

describe('staticAsset', () => {
  it('builds a raw.githubusercontent URL, never the blob redirect Chrome blocks', () => {
    expect(staticAsset(2024, 'jumping.jpg')).toBe(
      'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2024/jumping.jpg'
    );
  });

  it('leaves spaces in filenames unencoded, which is how they are published', () => {
    expect(staticAsset(2025, 'ambiance/IMG_3993 2.w640.JPG')).toBe(
      'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2025/ambiance/IMG_3993 2.w640.JPG'
    );
  });
});

describe('staticAssets', () => {
  it('builds one URL per filename, in order', () => {
    expect(staticAssets(2026, 'ambiance', ['a.jpg', 'b.jpg'])).toEqual([
      'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2026/ambiance/a.jpg',
      'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2026/ambiance/b.jpg'
    ]);
  });
});

describe('callers', () => {
  it('emits gallery URLs unchanged', () => {
    expect(photosY25[0]).toBe('https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2025/ambiance/IMG_8706.w640.JPG');
    expect(photosY25).toContain(
      'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2025/ambiance/Hackathon Group.w640.jpg'
    );
    expect(sponsorsY24[0]).toBe('https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2024/sponsors/mek-review.png');
    expect(videosY25[0]?.url).toBe('https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2025/demos/team5.mov');
  });

  it('emits the event summary and group photo URLs unchanged', () => {
    expect(urls.y24EventSummary).toBe(
      'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2024/2024-Event-Summary.pdf'
    );
    expect(urls.y24GroupPhoto).toBe('https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2024/jumping.jpg');
    expect(urls.y25EventSummary).toBe(
      'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2025/2025-Event-Summary.pdf'
    );
    expect(urls.y25GroupPhoto).toBe('https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2025/everybody.w640.jpg');
    expect(urls.y26EventSummary).toBe(
      'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2026/2026-BTCSP-Hackathon-Event-Summary.pdf'
    );
  });
});
