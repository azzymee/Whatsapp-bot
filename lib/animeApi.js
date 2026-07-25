// lib/animeApi.js
// Anime image/search wrappers. Exports exactly the same two functions
// as before — getReactionImage(category) and searchAnime(query) — so
// commands/waifu.js, neko.js, pat.js, hug.js, kiss.js, slap.js, and
// animesearch.js all keep working unmodified.
//
// Providers used:
// - nekos.best: primary source for reaction images. Supports every
//   category these commands use (waifu, neko, pat, hug, kiss, slap).
// - waifu.im: secondary fallback, used only for the "waifu" category
//   (the one tag it has that actually matches — it doesn't have
//   pat/hug/kiss/slap-style reaction gifs, just static character art).
// - Jikan (unofficial MyAnimeList API): anime title search/info.
//
// api.waifu.pics has been permanently retired (confirmed dead domain
// via DNS lookup, not a network issue) and is no longer referenced
// anywhere in this file.
//
// DNS note: Node's plain global fetch always resolves hostnames through
// the OS's own resolver (dns.lookup). On most networks that's fine and
// is what every other command in this bot relies on. On a minority of
// networks with a flaky/intercepted local resolver, that can cause
// intermittent ENOTFOUND errors — so as a *fallback only* (not the
// default), this file can retry through undici with a custom lookup
// forced via 8.8.8.8 / 1.1.1.1 using dns.resolve4(). Some networks (and
// ISPs, especially ones that hijack or block direct UDP:53 queries to
// public resolvers) fail the *forced* lookup even though the system
// resolver works fine — so forcing it unconditionally was making this
// file less reliable than the rest of the bot, not more. Trying the
// normal path first avoids that.

const dns = require('dns');
const { fetch: undiciFetch, Agent } = require('undici');

function customLookup(hostname, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'object' && options !== null ? options : {};

  dns.resolve4(hostname, function (err, addresses) {
    if (err) return cb(err);
    if (opts.all) {
      return cb(null, addresses.map(function (address) {
        return { address: address, family: 4 };
      }));
    }
    return cb(null, addresses[0], 4);
  });
}

let dnsAgent;
function getDnsAgent() {
  if (!dnsAgent) dnsAgent = new Agent({ connect: { lookup: customLookup } });
  return dnsAgent;
}

const NEKOS_BEST_BASE = 'https://nekos.best/api/v2';
const WAIFU_IM_BASE = 'https://api.waifu.im';
const JIKAN_BASE = 'https://api.jikan.moe/v4';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function tryFetch(url, timeoutMs, useDnsAgent) {
  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  try {
    const options = {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'Accept-Version': 'v5', // required by waifu.im, harmless elsewhere
      },
    };

    const res = useDnsAgent
      ? await undiciFetch(url, Object.assign({ dispatcher: getDnsAgent() }, options))
      : await fetch(url, options);

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs) {
  timeoutMs = timeoutMs || 10000;
  let lastErr;

  // Attempts 1-2: normal system DNS, same as every other command in
  // this bot. Attempt 3: fall back to the forced 8.8.8.8/1.1.1.1 path,
  // in case this specific network has a flaky local resolver (the
  // original reason this workaround existed).
  const plan = [false, false, true];

  for (let attempt = 0; attempt < plan.length; attempt++) {
    try {
      return await tryFetch(url, timeoutMs, plan[attempt]);
    } catch (err) {
      lastErr = err;
      if (attempt < plan.length - 1) {
        await new Promise(function (resolve) {
          setTimeout(resolve, 500 * (attempt + 1));
        });
      }
    }
  }

  throw lastErr;
}

async function fetchFromNekosBest(category) {
  const data = await fetchJson(NEKOS_BEST_BASE + '/' + category);
  const result = data && data.results && data.results[0];
  if (!result || !result.url) {
    throw new Error('No image returned by nekos.best for category "' + category + '"');
  }
  return result.url;
}

async function fetchFromWaifuIm() {
  const data = await fetchJson(WAIFU_IM_BASE + '/search?included_tags=waifu&is_nsfw=false');
  const image = data && data.images && data.images[0];
  if (!image || !image.url) {
    throw new Error('No image returned by waifu.im');
  }
  return image.url;
}

/**
 * Returns a direct image/gif URL for the given reaction category
 * (waifu, neko, pat, hug, kiss, slap). Tries nekos.best first; for the
 * "waifu" category specifically, falls back to waifu.im if nekos.best
 * fails (no fallback exists for the other categories, since waifu.im
 * doesn't have equivalent reaction tags).
 */
async function getReactionImage(category) {
  try {
    return await fetchFromNekosBest(category);
  } catch (err) {
    if (category === 'waifu') {
      return await fetchFromWaifuIm();
    }
    throw err;
  }
}

/**
 * Searches Jikan (MyAnimeList) for an anime by title and returns the
 * single best match's key details, or null if nothing was found.
 */
async function searchAnime(query) {
  const url = JIKAN_BASE + '/anime?q=' + encodeURIComponent(query) + '&limit=1&sfw';
  const data = await fetchJson(url);
  const anime = data && data.data && data.data[0];
  if (!anime) return null;

  return {
    title: anime.title,
    titleEnglish: anime.title_english || null,
    type: anime.type || 'Unknown',
    episodes: anime.episodes != null ? anime.episodes : 'Unknown',
    status: anime.status || 'Unknown',
    score: anime.score != null ? anime.score : 'N/A',
    synopsis: anime.synopsis || 'No synopsis available.',
    url: anime.url,
    imageUrl:
      (anime.images && anime.images.jpg && (anime.images.jpg.large_image_url || anime.images.jpg.image_url)) ||
      null,
  };
}

module.exports = { getReactionImage, searchAnime };