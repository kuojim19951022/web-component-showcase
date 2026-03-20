import { validateVideoData } from '../utils/helpers.js';

export class DataManager {
  #source = 'api';
  #endpoint = '';
  #staticData = null;

  configure({ source, endpoint } = {}) {
    this.#source = source || 'api';
    this.#endpoint = endpoint || '';
  }

  async loadStaticData(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`靜態資料載入失敗: HTTP ${res.status}`);
    this.#staticData = await res.json();
  }

  async resolve(videoId) {
    if (this.#source === 'static') {
      return this.#fromStatic(videoId);
    }
    return this.#fromAPI(videoId);
  }

  async #fromAPI(videoId) {
    if (!this.#endpoint) throw new Error('未設定 API endpoint');
    const res = await fetch(`${this.#endpoint}?id=${encodeURIComponent(videoId)}`);
    if (!res.ok) throw new Error(`API 請求失敗: HTTP ${res.status}`);
    const data = await res.json();
    validateVideoData(data);
    return data;
  }

  #fromStatic(videoId) {
    if (!this.#staticData) throw new Error('靜態資料未載入');
    const entry = this.#staticData.find(
      (item) => String(item.video?.id) === String(videoId),
    );
    if (!entry) throw new Error(`找不到影片 ID: ${videoId}`);
    validateVideoData(entry);
    return entry;
  }
}
