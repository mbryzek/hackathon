// Static assets (photos, sponsor logos, demo videos, event summaries) live in the
// companion repo https://github.com/mbryzek/hackathon-static, organized by year.
//
// Filenames are emitted verbatim: several contain spaces and are deliberately not
// URL-encoded, which is what the published URLs already are.

// Every asset is addressed on raw.githubusercontent.com directly. Its github.com/.../blob/...?raw=true
// form answers through a redirect that Chrome's Opaque Response Blocking refuses often enough for a
// demo video to come up empty on any given page load, and a blocked <video> shows no error at all.
const rawBase = 'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main';

/** A photo, sponsor logo, video or PDF in one year's folder. */
export const staticAsset = (year: number, path: string): string => `${rawBase}/${year}/${path}`;

/** A photo file and the pixel size recorded for it, which lets a gallery reserve its space before it loads. */
export interface PhotoFile {
  filename: string;
  width: number;
  height: number;
}

export interface Photo {
  url: string;
  width: number;
  height: number;
}

/** Every photo in one folder of a year, in the order given. */
export const staticPhotos = (year: number, folder: string, files: PhotoFile[]): Photo[] =>
  files.map(({ filename, width, height }) => ({ url: staticAsset(year, `${folder}/${filename}`), width, height }));
