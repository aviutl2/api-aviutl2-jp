import { env } from "cloudflare:workers";
import z from "zod";
import AsyncLock from "async-lock";

const throttleMutex = new AsyncLock();

export const aviutl2VersionSchema = z.object({
  version: z.string(),
  released_at: z.string(),
  downloads: z.object({
    zip: z.url(),
    exe: z.url(),
  }),
});
export type AviUtl2Version = z.infer<typeof aviutl2VersionSchema>;

export const versionsSchema = z.object({
  versions: z.array(aviutl2VersionSchema),
});

const timestampCacheVersion = 1;
async function fetchAviUtl2Timestamp(version: string): Promise<string> {
  const cacheKey = `aviutl2-version-${version}-timestamp-v${timestampCacheVersion}`;
  const cached = await env.released_at_cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const response = await throttleMutex.acquire("lock", async () =>
    fetch(`https://spring-fragrance.mints.ne.jp/aviutl/aviutl2${version}.zip`, {
      method: "HEAD",
      cf: {
        cacheTtl: 3600,
      },
    }),
  );
  const lastModified = response.headers.get("Last-Modified");
  if (!lastModified) {
    throw new Error(`Failed to get Last-Modified header for version ${version}`);
  }
  const releasedAt = new Date(lastModified).toISOString();
  // NOTE: Last-Modifiedは基本的には永久に変わらないはずなので、キャッシュの有効期限は特に設けない
  await env.released_at_cache.put(cacheKey, releasedAt);
  return releasedAt;
}

export async function fetchAviUtl2Versions(): Promise<AviUtl2Version[]> {
  const versions = await fetch("https://spring-fragrance.mints.ne.jp/aviutl/oldver2.php", {
    cf: {
      cacheTtl: 3600,
    },
  });
  const versionsHtml = await versions.text();
  const links = [...versionsHtml.matchAll(/<a href="aviutl2([\d+a-zA-Z]+?)\.zip">/g)].map(
    (m) => m[1],
  );
  links.sort((a, b) => {
    const segmentsA = a.split(/(\d+|[a-zA-Z]+)/).filter((s) => s.length > 0);
    const segmentsB = b.split(/(\d+|[a-zA-Z]+)/).filter((s) => s.length > 0);
    const len = Math.max(segmentsA.length, segmentsB.length);
    for (let i = 0; i < len; i++) {
      const segA = segmentsA[i];
      const segB = segmentsB[i];
      if (segA === undefined) return 1;
      if (segB === undefined) return -1;
      const isNumA = /^\d+$/.test(segA);
      const isNumB = /^\d+$/.test(segB);
      if (isNumA && isNumB) {
        const numA = parseInt(segA, 10);
        const numB = parseInt(segB, 10);
        if (numA !== numB) return numB - numA;
      } else if (!isNumA && !isNumB) {
        if (segA !== segB) return segB.localeCompare(segA);
      } else {
        return isNumA ? 1 : -1;
      }
    }
    return 0;
  });

  const result: AviUtl2Version[] = await Promise.all(
    links.map(async (link) => ({
      // TODO: 2.01になったら対応する
      version: `2.00${link}`,
      released_at: await fetchAviUtl2Timestamp(link),
      downloads: {
        zip: `https://spring-fragrance.mints.ne.jp/aviutl/aviutl2${link}.zip`,
        exe: `https://spring-fragrance.mints.ne.jp/aviutl/AviUtl2${link}_setup.exe`,
      },
    })),
  );
  return result;
}
