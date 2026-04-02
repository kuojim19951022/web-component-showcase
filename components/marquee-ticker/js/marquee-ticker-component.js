class MarqueeTicker extends HTMLElement {
  static get observedAttributes() {
    return ["data-source", "data-url"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.container = null;
    this.content = null;
    this.speed = 50;
    this.gap = 30;
    this.padding = 10;
    this.direction = "slide-left";
    this._itemsHTML = "";
    this._resizeObserver = null;
    this._fetchSeq = 0;
  }

  _getStringAttr(name, fallback = "") {
    const raw = this.getAttribute(name);
    if (raw === null || raw === undefined) return fallback;
    const value = String(raw).trim();
    return value ? value : fallback;
  }

  _getNumberAttr(name, fallback) {
    const raw = this._getStringAttr(name, "");
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  connectedCallback() {
    this.speed = this._getNumberAttr("default-speed", 50);
    this.gap = this._getNumberAttr("item-gap", 30);
    this.padding = this._getNumberAttr("vertical-padding", 10);
    this.direction = this._getStringAttr("direction", "slide-left");
    this.render();
    this._load();
    this._observeResize();
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (!this.content) return;
    if (name !== "data-source" && name !== "data-url") return;
    if (!newValue || !String(newValue).trim()) {
      const hasSource = this._getDataSourceRaw();
      const hasUrl = this._getDataUrlRaw();
      if (!hasSource && !hasUrl) {
        this._clear();
        return;
      }
    }
    this._load();
  }

  disconnectedCallback() {
    if (this._resizeObserver && this.container) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  _observeResize() {
    if (!this.container || this._resizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      if (this._itemsHTML) this._applyMarqueeCopies();
    });
    this._resizeObserver.observe(this.container);
  }

  render() {
    const style = `
            :host { display: block; width: 100%; overflow: hidden; background: #fff; }
            .marquee-container { position: relative; width: 100%; white-space: nowrap; padding: ${this.padding}px 0; }
            .marquee-content { display: inline-block; animation: marquee linear infinite; }
            .marquee-item { display: inline-block; margin-right: ${this.gap}px; }
            .marquee-item a { text-decoration: none; color: #333; }
        `;
    this.shadowRoot.innerHTML = `<style>${style}</style><style id="marquee-keyframes"></style><div class="marquee-container"><div class="marquee-content" id="content"></div></div>`;
    this.container = this.shadowRoot.querySelector(".marquee-container");
    this.content = this.shadowRoot.getElementById("content");
  }

  _getDataSourceRaw() {
    return this._getStringAttr("data-source", "");
  }

  _getDataUrlRaw() {
    return this._getStringAttr("data-url", "");
  }

  _clear() {
    this._itemsHTML = "";
    if (this.content) this.content.innerHTML = "";
  }

  _load() {
    const sourceRaw = this._getDataSourceRaw();
    if (sourceRaw) {
      this._loadFromDataSource(sourceRaw);
      return;
    }
    const urlRaw = this._getDataUrlRaw();
    if (urlRaw) {
      this._loadFromDataUrl(urlRaw);
      return;
    }
    this._clear();
  }

  _loadFromDataSource(attrSource) {
    try {
      const data = JSON.parse(attrSource);
      if (Array.isArray(data) && data.length > 0) {
        this.updateContent(data);
      } else {
        this._clear();
      }
    } catch (e) {
      console.error("[Marquee Ticker] Failed to parse data-source:", e);
    }
  }

  async _loadFromDataUrl(url) {
    const seq = ++this._fetchSeq;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (this._getDataSourceRaw()) return;
      if (seq !== this._fetchSeq) return;

      if (Array.isArray(data) && data.length > 0) {
        this.updateContent(data);
      } else {
        this._clear();
      }
    } catch (e) {
      console.error("[Marquee Ticker] Failed to fetch data-url:", e);
    }
  }

  updateContent(data) {
    if (!Array.isArray(data) || !this.content) return;
    const itemsHTML = data
      .map((item) => {
        const text =
          item.marqueeText != null && item.marqueeText !== ""
            ? String(item.marqueeText)
            : "";
        const href =
          item.marqueeLink != null && item.marqueeLink !== ""
            ? String(item.marqueeLink)
            : "#";
        const safeHref = href.replace(/"/g, "&quot;");
        const safeText = text
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        return `<div class="marquee-item"><a href="${safeHref}">${safeText}</a></div>`;
      })
      .join("");
    this._itemsHTML = itemsHTML;
    this._applyMarqueeCopies();
  }

  _applyMarqueeCopies() {
    if (!this._itemsHTML || !this.content || !this.container) return;
    const containerWidth = this.container.offsetWidth;
    this.content.innerHTML = this._itemsHTML;
    const singleCopyWidth = this.content.offsetWidth;
    if (singleCopyWidth <= 0) return;
    const N = Math.max(2, Math.ceil(containerWidth / singleCopyWidth)) + 1;
    const copies = Array(N).fill(this._itemsHTML).join("");
    this.content.innerHTML = copies;
    const keyframesEl = this.shadowRoot.getElementById("marquee-keyframes");
    if (keyframesEl) {
      const pct = 100 / N;
      keyframesEl.textContent = `
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-${pct}%); }
                }
                :host([direction="slide-right"]) .marquee-content { animation-direction: reverse; }
            `;
    }
    const oneCopyWidth = this.content.offsetWidth / N;
    const duration = oneCopyWidth / this.speed;
    this.content.style.animationDuration = `${duration}s`;
  }
}
customElements.define("marquee-ticker", MarqueeTicker);
