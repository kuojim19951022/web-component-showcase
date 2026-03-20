const cssCache = new Map();

function withCacheBuster(url, timestamp) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(String(timestamp))}`;
}

// 載入單一 CSS 文字內容（含快取、避免快取殘留）
export async function loadCss(url) {
  if (!url) return "";
  if (cssCache.has(url)) return cssCache.get(url);
  const timestamp = window.APP_TIMESTAMP || Date.now();
  try {
    const res = await fetch(withCacheBuster(url, timestamp));
    const text = res.ok ? await res.text() : "";
    cssCache.set(url, text);
    return text;
  } catch {
    cssCache.set(url, "");
    return "";
  }
}

// 載入一組 CSS 並合併字串（使用 loadCss 統一行為）
export async function loadCssBundle(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const texts = await Promise.all(list.map((u) => loadCss(u)));
  return texts.join("\n");
}
