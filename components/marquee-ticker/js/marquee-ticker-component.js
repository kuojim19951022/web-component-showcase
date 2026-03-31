class MarqueeTicker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.container = null;
        this.content = null;
        this.speed = 50;
        this.gap = 30;
        this.padding = 10;
        this.direction = 'slide-left';
        this._itemsHTML = '';
        this._resizeObserver = null;
    }

    connectedCallback() {
        this.speed = parseInt(this.getAttribute('default-speed')) || 50;
        this.gap = parseInt(this.getAttribute('item-gap')) || 30;
        this.padding = parseInt(this.getAttribute('vertical-padding')) || 10;
        this.direction = this.getAttribute('direction') || 'slide-left';
        this.render();
        this.loadData();
        this._observeResize();
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
        this.container = this.shadowRoot.querySelector('.marquee-container');
        this.content = this.shadowRoot.getElementById('content');
    }

    loadData() {
        const attrSource = this.getAttribute('data-source');
        if (!attrSource || !attrSource.trim()) return;
        try {
            const data = JSON.parse(attrSource);
            if (Array.isArray(data) && data.length > 0) {
                this.updateContent(data);
            }
        } catch (e) {
            console.error('[Marquee Ticker] Failed to parse data-source:', e);
        }
    }

    updateContent(data) {
        if (!Array.isArray(data) || !this.content) return;
        const itemsHTML = data.map(item => {
            const text = (item.marqueeText != null && item.marqueeText !== '') ? String(item.marqueeText) : '';
            const href = (item.marqueeLink != null && item.marqueeLink !== '') ? String(item.marqueeLink) : '#';
            const safeHref = href.replace(/"/g, '&quot;');
            const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            return `<div class="marquee-item"><a href="${safeHref}">${safeText}</a></div>`;
        }).join('');
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
        const copies = Array(N).fill(this._itemsHTML).join('');
        this.content.innerHTML = copies;
        const keyframesEl = this.shadowRoot.getElementById('marquee-keyframes');
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
customElements.define('marquee-ticker', MarqueeTicker);

