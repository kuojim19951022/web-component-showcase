class MusicPlayer extends HTMLElement {
  // ========== 配置常數 ==========
  static CONFIG = {
    DEFAULT_RESOURCE_PATH: '/web/res/zh_TW/components/music-player',
    DEFAULT_VOLUME: 0.7,
    DEFAULT_REPEAT: false,
    DEFAULT_SHUFFLE: false,
    AUDIO_READY_STATE: 3, // HAVE_FUTURE_DATA
    MOBILE_REGEX:
      /iPhone|iPad|iPod|Android|Mobile|BlackBerry|IEMobile|Opera Mini/i,
    DEFAULT_ICONS: {
      'icon-music': 'icon-music.svg',
      'icon-repeat': 'icon-repeat.svg',
      'icon-prev': 'icon-prev.svg',
      'icon-play': 'icon-play.svg',
      'icon-pause': 'icon-pause.svg',
      'icon-next': 'icon-next.svg',
      'icon-shuffle': 'icon-shuffle.svg',
      'icon-volume': 'icon-volume.svg',
      'icon-volume-mute': 'icon-volume-mute.svg',
    },
  };

  static cssCache = null;
  static templateLoadPromise = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.CONFIG = {
      RESOURCE_PATH: MusicPlayer.CONFIG.DEFAULT_RESOURCE_PATH,
      ...MusicPlayer.CONFIG,
    };
    this.state = {
      currentMusicId: null, isPlaying: false, isShuffleMode: false, isRepeatMode: false,
      isDragging: false, isVolumeDragging: false, isHandlingVolumeEvent: false,
      isMuted: true, savedVolume: MusicPlayer.CONFIG.DEFAULT_VOLUME,
      currentVolume: MusicPlayer.CONFIG.DEFAULT_VOLUME, hasUserPlayed: false,
      isLoading: false, isSeeking: false, pendingPlayback: false,
      progressUpdateRequested: false, customIcons: {}, playHistory: [] 
    };
    this.musicList = [];
    this.audioContext = null;
    this.gainNode = null;
    this.mediaSource = null;
    this.useWebAudio = false;
    this.elements = {};
    this._mutePopup = null;
    this._interactionOverlay = null;
  }

  async connectedCallback() {
    this.#loadConfigFromAttributes();
    this.#initDeviceClass();
    await this.#render();
    this.#initElements();
    if (!this.#validateElements()) return;
    this.#initDefaultState();
    this.#loadDataFromAttribute();
    this.#initEventListeners();
    this.#updateAllIcons();
    this.#injectPortalStyles();
  }

  disconnectedCallback() {
    if (this.elements.audio) {
      this.elements.audio.pause();
      this.elements.audio.src = "";
    }
    this.#hideMutePopup();
    this.#hideInteractionPrompt();
  }

  // ========== 工具方法 ==========
  static isMobileDevice() { return MusicPlayer.CONFIG.MOBILE_REGEX.test(navigator.userAgent); }
  static isElementVisible(element) {
    if (!element) return false;
    return window.getComputedStyle(element).display !== "none";
  }
  static formatTime(seconds) {
    if (isNaN(seconds) || seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  static normalizePath(path) { return path ? path.replace(/\/+/g, '/') : ''; }

  #handleKeyboardEvent(element, callback) {
    if (!element) return;
    element.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        callback();
      }
    });
  }

  #setupDrag(element, stateKey, onUpdate) {
    const handlePointerMove = (e) => {
      if (this.state[stateKey]) {
        onUpdate(e);
      }
    };

    const stopDrag = (e) => {
      if (this.state[stateKey]) {
        this.state[stateKey] = false;
        element.classList.remove("dragging");
        try { element.releasePointerCapture(e.pointerId); } catch (err) {}
        element.removeEventListener('pointermove', handlePointerMove);
        element.removeEventListener('pointerup', stopDrag);
        element.removeEventListener('pointercancel', stopDrag);
      }
    };

    element.onpointerdown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.state[stateKey] = true;
      element.classList.add("dragging");
      try { element.setPointerCapture(e.pointerId); } catch (err) {}
      onUpdate(e);
      element.addEventListener('pointermove', handlePointerMove);
      element.addEventListener('pointerup', stopDrag);
      element.addEventListener('pointercancel', stopDrag);
    };
  }

  // ========== Web Audio API (手機音量繞過) ==========
  #initWebAudio() {
    if (this.useWebAudio) return true;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      this.audioContext = new AudioContextClass();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.state.currentVolume;
      const { audio } = this.elements;
      this.mediaSource = this.audioContext.createMediaElementSource(audio);
      this.mediaSource.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      this.useWebAudio = true;
      return true;
    } catch (e) { return false; }
    }

  async #ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      try { await this.audioContext.resume(); } catch (e) {}
    }
  }

  #injectPortalStyles() {
    if (document.getElementById("music-player-portal-style")) return;
    const style = document.createElement("style");
    style.id = "music-player-portal-style";
    style.textContent = typeof getPortalStyles === 'function' ? getPortalStyles() : '';
    document.head.appendChild(style);
  }

  // ========== 核心方法 ==========
  #setMusicInfo(id) {
    if (!id) return;
    const music = this.musicList.find(m => String(m.id) === String(id));
    if (!music) return;
    if (String(this.state.currentMusicId) === String(id) && this.elements.audio.src) {
      return;
    }

    this.state.isSeeking = false;
    this.state.currentMusicId = music.id;
    
    const resolvedSrc = this.#resolveResourcePath(music.src);
    this.elements.audio.src = resolvedSrc;
    this.elements.audio.load();
    this.#updateMusicUI(music);
      }

  #loadConfigFromAttributes() {
    const getAttr = (name) => this.getAttribute(name);
    this.CONFIG = {
      ...MusicPlayer.CONFIG,
      RESOURCE_PATH: getAttr("resource-path") || MusicPlayer.CONFIG.DEFAULT_RESOURCE_PATH,
      DEFAULT_VOLUME: this.#parseFloat(getAttr("default-volume"), MusicPlayer.CONFIG.DEFAULT_VOLUME, true),
      DEFAULT_REPEAT: this.#parseBoolean(getAttr("default-repeat"), MusicPlayer.CONFIG.DEFAULT_REPEAT),
      DEFAULT_SHUFFLE: this.#parseBoolean(getAttr("default-shuffle"), MusicPlayer.CONFIG.DEFAULT_SHUFFLE),
    };
    this.state.savedVolume = this.state.currentVolume = this.CONFIG.DEFAULT_VOLUME;
    this.state.isRepeatMode = this.CONFIG.DEFAULT_REPEAT;
    this.state.isShuffleMode = this.CONFIG.DEFAULT_SHUFFLE;
    
    const customIconsAttr = getAttr("custom-icons");
    if (customIconsAttr) {
      try { this.setCustomIcons(JSON.parse(customIconsAttr)); } catch (e) { console.warn('Icons parse error', e); }
    }
  }

  #parseFloat(v, d, isVol) {
    const p = parseFloat(v);
    if (isNaN(p)) return d;
    return isVol ? Math.max(0, Math.min(1, p)) : p;
  }
  #parseBoolean(v, d) {
    if (!v) return d;
    return ['true', '1', 'yes', 'on'].includes(String(v).toLowerCase());
    }

  async #loadCSS() {
    if (MusicPlayer.cssCache) return MusicPlayer.cssCache;
    const path = MusicPlayer.normalizePath(`${this.CONFIG.RESOURCE_PATH}/css/music-player.css`);
    try {
      const res = await fetch(path);
      return MusicPlayer.cssCache = res.ok ? await res.text() : '';
    } catch (e) { return ''; }
  }

  async #loadTemplate() {
    if (typeof getMusicPlayerHTML === 'function') return true;
    if (MusicPlayer.templateLoadPromise) return await MusicPlayer.templateLoadPromise;
    const path = MusicPlayer.normalizePath(`${this.CONFIG.RESOURCE_PATH}/js/music-player-template.js`);
    return MusicPlayer.templateLoadPromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = path;
      s.onload = () => setTimeout(() => resolve(typeof getMusicPlayerHTML === 'function'), 10);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  async #render() {
    const css = await this.#loadCSS();
    const loaded = await this.#loadTemplate();
    const html = loaded ? getMusicPlayerHTML(this.CONFIG.RESOURCE_PATH) : '<div style="color:red">Load Error</div>';
    this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
  }

  #initElements() {
    const root = this.shadowRoot;
    const get = (id) => root.getElementById(id);
    this.elements = {
      audio: get("background-audio"),
      playPauseBtn: get("play-pause-btn"),
      prevBtn: get("prev-btn"), nextBtn: get("next-btn"),
      shuffleBtn: get("shuffle-btn"), repeatBtn: get("repeat-btn"),
      volumeProgressBar: get("volume-progress-bar"),
      volumeProgressFill: get("volume-progress-fill"),
      volumeToggleBtn: get("volume-toggle-btn"), volumeIcon: get("volume-icon"),
      progressFill: get("progress-fill"),
      currentTimeDisplay: get("current-time"), totalTimeDisplay: get("total-time"),
      currentSongTitle: get("current-song-title"),
      currentSongCover: get("current-song-cover"),
      currentSongDefaultCover: get("current-song-default-cover"),
      progressBar: root.querySelector(".progress-bar"),
      musicListContainer: get("music-list"),
    };
  }

  #validateElements() { return !!(this.elements.audio && this.elements.playPauseBtn); }
  #initDeviceClass() { if (MusicPlayer.isMobileDevice()) document.body.classList.add("mobile-device"); }

  #initDefaultState() {
    const { audio, repeatBtn, shuffleBtn } = this.elements;
    audio.preload = "metadata";
    audio.muted = true;
    if (!MusicPlayer.isMobileDevice()) audio.volume = this.CONFIG.DEFAULT_VOLUME;
    if (repeatBtn) repeatBtn.classList.toggle("active", this.state.isRepeatMode);
    if (shuffleBtn) shuffleBtn.classList.toggle("active", this.state.isShuffleMode);
    this.#updateVolumeProgress();
    this.#updateMuteUI();
  }

  // ========== 圖示與路徑 ==========
  #getIconPath(name) {
    const key = name.replace(/\.svg$/, '');
    const custom = this.state.customIcons[key];
    if (custom) {
      if (/^(?:\/|https?:\/\/|\/\/)/.test(custom)) {
        return custom;
      }
      const imageExtensions = /\.(svg|png|jpg|jpeg|gif|webp)$/i;
      const customFileName = imageExtensions.test(custom) ? custom : `${custom}.svg`;
      return MusicPlayer.normalizePath(`${this.CONFIG.RESOURCE_PATH}/images/${customFileName}`);
  }
    const fileName = MusicPlayer.CONFIG.DEFAULT_ICONS[key] || name;
    return MusicPlayer.normalizePath(`${this.CONFIG.RESOURCE_PATH}/images/${fileName}`);
  }

  #resolveResourcePath(path) {
    if (!path || /^(?:\/|https?:\/\/|\/\/)/.test(path)) return path;
    const base = this.CONFIG.RESOURCE_PATH.replace(/\/$/, "");
    const rel = path.startsWith("./") ? path.substring(2) : path;
    return MusicPlayer.normalizePath(`${base}/${rel}`);
  }

  // ========== UI 更新 ==========
  #updatePlayPauseButton() {
    const btn = this.elements.playPauseBtn;
    const icon = btn?.querySelector("img");
    if (!icon) return;
    btn.classList.toggle("loading", this.state.isLoading);
    icon.src = this.#getIconPath(this.state.isPlaying ? 'icon-pause.svg' : 'icon-play.svg');
  }

  #updateMuteUI() {
    if (this.elements.volumeIcon) {
      this.elements.volumeIcon.src = this.#getIconPath(this.state.isMuted ? 'icon-volume-mute.svg' : 'icon-volume.svg');
    }
  }

  #updateVolumeProgress() {
    if (this.elements.volumeProgressFill) {
      this.elements.volumeProgressFill.style.width = `${this.state.currentVolume * 100}%`;
    }
  }

  #updateProgress = () => {
    const { audio, progressFill, currentTimeDisplay, totalTimeDisplay } = this.elements;
    if (!audio.duration || this.state.progressUpdateRequested) return;
    this.state.progressUpdateRequested = true;
    requestAnimationFrame(() => {
      progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
      currentTimeDisplay.textContent = MusicPlayer.formatTime(audio.currentTime);
      totalTimeDisplay.textContent = MusicPlayer.formatTime(audio.duration);
      this.state.progressUpdateRequested = false;
    });
  };

  #updateMusicUI(music) {
    const { currentSongTitle, currentSongCover, currentSongDefaultCover } = this.elements;
    currentSongTitle.textContent = music.title;
    const hasImg = !!music.image;
    currentSongCover.src = music.image || "";
    currentSongCover.style.display = hasImg ? "block" : "none";
    currentSongDefaultCover.style.display = hasImg ? "none" : "flex";
    this.shadowRoot.querySelectorAll(".music-item").forEach(item => {
      item.classList.toggle("playing", String(item.getAttribute('data-id')) === String(music.id));
    });
  }

  #updateAllIcons() {
    const selectors = {
      '#current-song-default-cover .icon-music': 'icon-music.svg',
      '#repeat-btn .control-icon': 'icon-repeat.svg',
      '#prev-btn .control-icon': 'icon-prev.svg',
      '#next-btn .control-icon': 'icon-next.svg',
      '#shuffle-btn .control-icon': 'icon-shuffle.svg',
      '.list-title-icon': 'icon-music.svg'
    };
    Object.entries(selectors).forEach(([sel, icon]) => {
      const el = this.shadowRoot.querySelector(sel);
      if (el) el.src = this.#getIconPath(icon);
    });
    this.#updatePlayPauseButton();
    this.#updateMuteUI();
  }

  // ========== 播放邏輯 ==========
  #playMusic(id) {
    const music = this.musicList.find(m => String(m.id) === String(id));
    if (!music) return;
    if (this.state.currentMusicId && String(this.state.currentMusicId) !== String(id)) {
      this.state.playHistory.push(this.state.currentMusicId);
      if (this.state.playHistory.length > 50) this.state.playHistory.shift();
      sessionStorage.setItem('musicPlayHistory', JSON.stringify(this.state.playHistory));
    }
    this.#setMusicInfo(id);
    this.#tryPlayAudio();
  }

  #tryPlayAudio() {
    const { audio } = this.elements;
    const play = async () => {
      await this.#ensureAudioContext();
      audio.play().then(() => {
          this.state.isPlaying = true;
          this.state.hasUserPlayed = true;
          this.#updatePlayPauseButton();
      }).catch(e => console.warn('Play error', e));
    };
    
    if (audio.readyState >= this.CONFIG.AUDIO_READY_STATE) play();
    else audio.addEventListener("canplay", play, { once: true });
  }

  #togglePlayPause = async () => {
    await this.#ensureAudioContext();
    if (!this.state.currentMusicId && this.musicList.length > 0) {
      this.#playMusic(this.#getDefaultMusic().id);
      return;
    }
    if (this.state.isPlaying) this.elements.audio.pause();
    else this.elements.audio.play();
  };

  #getDefaultMusic() { return this.musicList.find(m => m.isDefault) || this.musicList[0]; }
  
  #playNext = () => {
    const list = this.musicList;
    let nextId;
    if (this.state.isShuffleMode) {
      const other = list.filter(m => String(m.id) !== String(this.state.currentMusicId));
      nextId = other[Math.floor(Math.random() * other.length)].id;
    } else {
      const idx = list.findIndex(m => String(m.id) === String(this.state.currentMusicId));
      nextId = list[(idx + 1) % list.length].id;
    }
    this.#playMusic(nextId);
  };

  #playPrevious = () => {
    if (this.musicList.length === 0) return;
    
    let prevId;
    if (this.state.playHistory.length > 0) {
      prevId = this.state.playHistory.pop();
      sessionStorage.setItem('musicPlayHistory', JSON.stringify(this.state.playHistory));
      this.#setMusicInfo(prevId);
      this.#tryPlayAudio();
    } else {
      const list = this.musicList;
      const idx = list.findIndex(m => String(m.id) === String(this.state.currentMusicId));
      const prevIdx = (idx - 1 + list.length) % list.length;
      prevId = list[prevIdx].id;
      this.#playMusic(prevId);
    }
  };

  // ========== 音量與彈窗 ==========
  #unmute(tryPlay) {
    this.elements.audio.muted = false;
    this.#setVolume(this.state.savedVolume);
    this.state.isMuted = false;
    this.#updateMuteUI();
    sessionStorage.setItem("musicPlayerUnmuted", "true");
    if (tryPlay && !this.state.isPlaying) this.#tryPlayAudio();
  }

  #setVolume(v) {
    this.state.currentVolume = v;
    if (this.useWebAudio && this.gainNode) {
      this.gainNode.gain.value = v;
    } else {
      this.elements.audio.volume = v;
    }
    this.#updateVolumeProgress();
  }

  #toggleMute = () => {
    if (this.state.isMuted) {
      this.#unmute(!!this._mutePopup);
      this.#hideMutePopup();
    } else {
      this.#hideMutePopup();
      this.state.savedVolume = this.state.currentVolume;
      this.elements.audio.muted = true;
      this.state.isMuted = true;
      this.#updateMuteUI();
    }
  };

  #showMutePopup() {
    if (this._mutePopup) return;
    const p = document.createElement("div");
    p.id = "volume-mute-portal";
    p.innerHTML = getMutePopupHTML(this.#getIconPath('icon-volume-mute.svg'));
    document.body.appendChild(p);
    this._mutePopup = p;
    setTimeout(() => p.style.opacity = "1", 10);
    
    const confirmBtn = p.querySelector(".volume-mute-popup-confirm");
    const cancelBtn = p.querySelector(".volume-mute-popup-cancel");
    
    confirmBtn.onclick = () => { this.#unmute(true); this.#hideMutePopup(); };
    cancelBtn.onclick = () => this.#hideMutePopup();
    
    this.#handleKeyboardEvent(confirmBtn, () => { this.#unmute(true); this.#hideMutePopup(); });
    this.#handleKeyboardEvent(cancelBtn, () => this.#hideMutePopup());

    setTimeout(() => confirmBtn.focus(), 100);
  }

  #hideMutePopup() {
    if (this._mutePopup) {
      const target = this._mutePopup;
      target.style.opacity = "0";
      this._mutePopup = null;
      setTimeout(() => target.remove(), 300);
    }
  }

  #showInteractionPrompt() {
    const hasUnmuted = sessionStorage.getItem("musicPlayerUnmuted") === "true";
    const o = document.createElement("div");
    o.id = "interaction-overlay";
    o.innerHTML = getInteractionPromptHTML(hasUnmuted);
    document.body.appendChild(o);
    this._interactionOverlay = o;
    setTimeout(() => o.style.opacity = "1", 10);
    
    o.onclick = async () => {
          this.#initWebAudio();
      await this.#ensureAudioContext();
      const targetId = this.#getDefaultMusic().id;
      if (String(this.state.currentMusicId) === String(targetId) && this.elements.audio.src) {
        this.#tryPlayAudio();
      } else {
        this.#playMusic(targetId);
      }
      if (sessionStorage.getItem("musicPlayerUnmuted") === "true") this.#unmute(false);
      this.#hideInteractionPrompt();
      if (sessionStorage.getItem("musicPlayerUnmuted") !== "true") setTimeout(() => this.#showMutePopup(), 500);
    };
  }

  #hideInteractionPrompt() {
    if (this._interactionOverlay) {
      const target = this._interactionOverlay;
      target.style.opacity = "0";
      this._interactionOverlay = null;
      setTimeout(() => target.remove(), 300);
        }
  }

  // ========== 事件監聽 ==========
  #initEventListeners() {
    const { playPauseBtn, prevBtn, nextBtn, shuffleBtn, repeatBtn, volumeToggleBtn, audio, volumeProgressBar, progressBar } = this.elements;
    playPauseBtn.onclick = this.#togglePlayPause;
    prevBtn.onclick = this.#playPrevious;
    nextBtn.onclick = this.#playNext;
    shuffleBtn.onclick = () => { this.state.isShuffleMode = !this.state.isShuffleMode; shuffleBtn.classList.toggle("active", this.state.isShuffleMode); };
    repeatBtn.onclick = () => { this.state.isRepeatMode = !this.state.isRepeatMode; repeatBtn.classList.toggle("active", this.state.isRepeatMode); };
    volumeToggleBtn.onclick = this.#toggleMute;
    this.#handleKeyboardEvent(volumeToggleBtn, this.#toggleMute);
    
    audio.ontimeupdate = this.#updateProgress;
    audio.onwaiting = () => { if (!this.state.isSeeking) { this.state.isLoading = true; this.#updatePlayPauseButton(); } };
    audio.onplaying = audio.oncanplay = audio.onplay = () => { this.state.isLoading = false; this.state.isPlaying = true; this.#updatePlayPauseButton(); };
    audio.onpause = () => { this.state.isPlaying = false; this.#updatePlayPauseButton(); };
    audio.onended = () => this.state.isRepeatMode ? (audio.currentTime = 0, audio.play()) : this.#playNext();

    this.#setupDrag(progressBar, 'isDragging', (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.state.isSeeking = true;
      audio.currentTime = p * audio.duration;
      this.#updateProgress();
    });

    this.#setupDrag(volumeProgressBar, 'isVolumeDragging', (e) => {
      const rect = volumeProgressBar.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.#setVolume(p);
      if (this.state.isMuted) {
        const hasPopup = !!this._mutePopup;
        this.#unmute(hasPopup);
        if (hasPopup) this.#hideMutePopup();
      }
      this.state.savedVolume = p;
    });
  }

  // ========== 清單渲染 ==========
  #renderMusicListDOM() {
    const container = this.elements.musicListContainer;
    if (!container) return;
    const iconPath = this.#getIconPath('icon-music.svg');
    const playIconPath = this.#getIconPath('icon-play.svg');
    container.innerHTML = this.musicList.map(music => {
      return getMusicItemHTML(music, iconPath, playIconPath, MusicPlayer.formatTime(music.lengthSeconds));
    }).join("");

    container.onpointerdown = (e) => {
      const item = e.target.closest('.music-item');
      if (item) {
        e.stopPropagation();
        const id = item.getAttribute('data-id');
        this.#playMusic(id);
  }
    };
  }

  #loadDataFromAttribute() {
    const endpoint = this.#getEndpoint();
    if (endpoint) {
      fetch(endpoint)
        .then(res => res.json())
        .then(res => {
      if (res.state) this.setMusicData(res.data);
        })
        .catch(error => {
          console.error('[Music Player] 載入音樂資料失敗:', error);
        });
    }
  }

  #getEndpoint() {
    // 優先順序：HTML 屬性 > 全域變數
    const attrEndpoint = this.getAttribute('data-endpoint');
    const globalEndpoint = window.MUSIC_PLAYER_ENDPOINT;
    
    return attrEndpoint || globalEndpoint || '';
  }

  setMusicData(data) {
    this.musicList = data.map(m => ({
      ...m, 
      image: this.#resolveResourcePath(m.image)
    }));
    const savedHistory = sessionStorage.getItem('musicPlayHistory');
    if (savedHistory) {
      try {
        this.state.playHistory = JSON.parse(savedHistory);
      } catch (e) {
        console.error(`[Music Player] 歷史紀錄解析失敗:`, e);
        this.state.playHistory = [];
      }
    } else {
      this.state.playHistory = [];
      }

    this.#renderMusicListDOM();
    const def = this.#getDefaultMusic();
    if (def) { 
      this.#setMusicInfo(def.id); 
      this.#showInteractionPrompt(); 
    }
  }

  setCustomIcons(icons) { this.state.customIcons = { ...this.state.customIcons, ...icons }; this.#updateAllIcons(); }
}

customElements.define("music-player", MusicPlayer);
