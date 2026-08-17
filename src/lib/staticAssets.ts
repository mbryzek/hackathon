// Static assets (photos, sponsor logos, demo videos, event summaries) live in the
// companion repo https://github.com/mbryzek/hackathon-static, organized by year.
//
// Filenames are emitted verbatim: several contain spaces and are deliberately not
// URL-encoded, which is what the published URLs already are.

const blobBase = 'https://github.com/mbryzek/hackathon-static/blob/main';
const rawBase = 'https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main';

/** An image or video, served through the blob viewer's raw redirect. */
export const staticAsset = (year: number, path: string): string => `${blobBase}/${year}/${path}?raw=true`;

/** Every file in one folder of a year, in the order given. */
export const staticAssets = (year: number, folder: string, filenames: string[]): string[] =>
  filenames.map((filename) => staticAsset(year, `${folder}/${filename}`));

/** A file served straight off raw.githubusercontent.com — used for the event summary PDFs. */
export const staticFile = (year: number, filename: string): string => `${rawBase}/${year}/${filename}`;
