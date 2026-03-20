import { PLAYER_VARS } from '../config.js';

const THUMB_URL = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

export class IframePlayer {
  #container = null;
  #facade = null;
  #iframe = null;
  #youtubeId = '';
  #videoTitle = '';

  init(container, youtubeId, videoTitle = '') {
    if (!container || !youtubeId) return;
    this.#container = container;
    this.#youtubeId = youtubeId;
    this.#videoTitle = videoTitle || '播放影片';

    this.#facade = document.createElement('div');
    this.#facade.className = 'player-facade';
    this.#facade.setAttribute('role', 'button');
    this.#facade.setAttribute('tabindex', '0');
    this.#facade.setAttribute('aria-label', `播放：${this.#videoTitle}`);
    this.#facade.style.backgroundImage = `url("${THUMB_URL(youtubeId)}")`;
    this.#facade.innerHTML = '<div class="player-facade-playbtn" aria-hidden="true"></div>';

    const onPlay = () => this.#loadPlayer();
    this.#facade.addEventListener('click', onPlay);
    this.#facade.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPlay();
      }
    });

    container.appendChild(this.#facade);
  }

  #loadPlayer() {
    if (!this.#container || !this.#youtubeId) return;
    this.#facade?.remove();
    this.#facade = null;

    const iframe = document.createElement('iframe');
    iframe.className = 'youtube-iframe-player';
    const params = new URLSearchParams({ ...PLAYER_VARS }).toString();
    iframe.src = `https://www.youtube.com/embed/${this.#youtubeId}?${params}`;
    iframe.title = this.#videoTitle;
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    );
    this.#container.appendChild(iframe);
    this.#iframe = iframe;
  }

  destroy() {
    this.#facade?.remove();
    this.#iframe?.remove();
    this.#facade = null;
    this.#iframe = null;
    this.#container = null;
  }
}
