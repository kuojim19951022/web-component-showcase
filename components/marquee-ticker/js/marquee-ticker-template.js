function getMarqueeTickerHTML(resourcePath = '') {
  return `
    <div class="marquee-ticker-container">
      <div class="marquee-ticker-wrapper">
        <div class="marquee-ticker-content" id="marquee-ticker-content">
          <!-- 跑馬燈內容將動態渲染 -->
        </div>
      </div>
    </div>
  `;
}