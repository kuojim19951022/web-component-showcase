function getAutoBasePath(importMetaUrl) {
  try {
    return new URL('..', importMetaUrl).href;
  } catch (_) {
    return '';
  }
}

function normalizePath(path) {
  if (!path) return '';
  const isAbsolute = /^(https?:)?\/\//.test(path) || path.startsWith('/');
  const resolved = isAbsolute ? path : new URL(path, window.location.href).href;
  return resolved.replace(/\/+$/, '');
}

export function getBasePath(element, importMetaUrl) {
  const attrPath = element.getAttribute('base-path');
  const globalPath = window.YOUTUBE_MODAL_BASE_PATH;
  const fallback = getAutoBasePath(importMetaUrl);
  const basePath = attrPath || globalPath || fallback;
  return normalizePath(basePath);
}
