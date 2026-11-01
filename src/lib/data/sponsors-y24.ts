import { staticPhotos, type PhotoFile } from '#lib/staticAssets.ts';

const files: PhotoFile[] = [
  { filename: 'mek-review.png', width: 1126, height: 521 },
  { filename: 'carbon-sustain.png', width: 400, height: 388 },
  { filename: 'catalano-coffee.jpg', width: 605, height: 640 },
  { filename: 'francesca.jpg', width: 640, height: 204 },
  { filename: 'sunrise.png', width: 1988, height: 1019 },
  { filename: 'west-clinton.jpg', width: 640, height: 179 },
  { filename: 'pan.jpg', width: 640, height: 640 },
  { filename: 'bryzek.jpg', width: 640, height: 525 }
];

export const sponsorsY24 = staticPhotos(2024, 'sponsors', files);
