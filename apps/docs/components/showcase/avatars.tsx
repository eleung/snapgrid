// Avatars via DiceBear's Lorelei style (https://www.dicebear.com/styles/lorelei/),
// generated locally with the @dicebear packages — no network/CDN dependency, works
// offline. Each avatar is a self-contained colored circle (radius=50 + a warm
// backgroundColor palette). Generated data URIs are cached per seed (the showcase
// reuses a handful of seeds), and `.sg-avatar` carries a soft fallback background.

import { lorelei } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

const AVATAR_BG = ["ffdfbf", "ffd5b4", "f8d7c4", "f6c9a8", "efd0b0", "e9c9a8"];

const cache = new Map<string, string>();

export function avatarUri(seed: string): string {
  let uri = cache.get(seed);
  if (uri === undefined) {
    uri = createAvatar(lorelei, { seed, radius: 50, backgroundColor: AVATAR_BG }).toDataUri();
    cache.set(seed, uri);
  }
  return uri;
}

const pngCache = new Map<string, string>();

/**
 * Rasterize an avatar to a PNG data URI once (cached). A PNG is a pre-decoded
 * bitmap, so moving it is a cheap GPU composite — whereas an inline SVG `<img>`
 * gets re-rasterized by WebKit/Safari on every transform, which tanks large
 * animated grids (the perf lab moves hundreds at once). Async: needs an image
 * decode. Falls back to the SVG URI if a canvas isn't available.
 */
export function avatarPng(seed: string, size = 256): Promise<string> {
  const key = `${seed}@${size}`;
  const hit = pngCache.get(key);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(avatarUri(seed));
      ctx.drawImage(img, 0, 0, size, size);
      const png = canvas.toDataURL("image/png");
      pngCache.set(key, png);
      resolve(png);
    };
    img.onerror = () => resolve(avatarUri(seed));
    img.src = avatarUri(seed);
  });
}

export function Avatar({ seed, size = 28 }: { seed: string; size?: number }) {
  return (
    <img
      className="sg-avatar"
      src={avatarUri(seed)}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}

/** Overlapping avatars with a `+N` overflow — a "who's here" presence row. */
export function AvatarStack({
  seeds,
  max = 4,
  size = 26,
}: {
  seeds: string[];
  max?: number;
  size?: number;
}) {
  const shown = seeds.slice(0, max);
  const extra = seeds.length - shown.length;
  return (
    <div className="sg-avstack">
      {shown.map((seed) => (
        <span key={seed} className="sg-avstack__item" title={seed}>
          <Avatar seed={seed} size={size} />
        </span>
      ))}
      {extra > 0 ? <span className="sg-avstack__more">+{extra}</span> : null}
    </div>
  );
}
