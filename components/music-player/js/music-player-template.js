function getMusicPlayerHTML(resourcePath = '') {
  const getIconPath = (iconName) => {
    if (!iconName) return '';
    const basePath = resourcePath ? resourcePath.replace(/\/$/, '') : '';
    return basePath ? `${basePath}/images/${iconName}` : `images/${iconName}`;
  };

  return `
    <div class="music-container">
      <div class="music-player-container">
        <!-- 音訊元素 -->
        <audio id="background-audio" preload="metadata"></audio>
        
        <!-- 播放器控制介面 -->
        <div class="player-controls">
          <div class="player-info">
            <div class="player-cover">
              <img id="current-song-cover" src="" alt="當前播放音樂封面">
              <div class="default-cover" id="current-song-default-cover">
                <img src="${getIconPath('icon-music.svg')}" alt="音樂圖示" class="icon-music">
              </div>
            </div>
            <h4 id="current-song-title">請選擇音樂</h4>
          </div>

          <div class="progress-container">
            <span id="current-time">00:00</span>
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <span id="total-time">00:00</span>
          </div>

          <div class="control-buttons">
            <button id="repeat-btn" class="control-btn" title="單曲循環">
              <img src="${getIconPath('icon-repeat.svg')}" alt="單曲循環" class="control-icon">
            </button>
            <button id="prev-btn" class="control-btn" title="上一首">
              <img src="${getIconPath('icon-prev.svg')}" alt="上一首" class="control-icon">
            </button>
            <button id="play-pause-btn" class="control-btn play-btn" title="播放">
              <img src="${getIconPath('icon-play.svg')}" alt="播放" class="control-icon" id="play-pause-icon">
            </button>
            <button id="next-btn" class="control-btn" title="下一首">
              <img src="${getIconPath('icon-next.svg')}" alt="下一首" class="control-icon">
            </button>
            <button id="shuffle-btn" class="control-btn" title="隨機播放">
              <img src="${getIconPath('icon-shuffle.svg')}" alt="隨機播放" class="control-icon">
            </button>
          </div>

          <div class="volume-control">
            <div class="volume-icon-btn" id="volume-toggle-btn" role="button" tabindex="0" title="切換靜音">
              <img src="${getIconPath('icon-volume.svg')}" alt="音量" class="volume-icon" id="volume-icon">
            </div>
            <div class="volume-progress-container">
              <div class="volume-progress-bar" id="volume-progress-bar">
                <div class="volume-progress-fill" id="volume-progress-fill"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 音樂清單 -->
      <div class="music-list-container">
        <div class="list-title-container">
          <img src="${getIconPath('icon-music.svg')}" alt="音樂" class="list-title-icon">
          <h3 class="list-title">音樂清單</h3>
        </div>
        <div class="music-list" id="music-list">
          <!-- 音樂清單項目將由getMusicItemHTML()動態生成 -->
        </div>
      </div>
    </div>
  `;
}

/**
 * 音樂清單項目
 */
function getMusicItemHTML(music, iconPath, playIconPath, formattedDuration) {
  const hasImg = !!music.image;
  const coverHTML = hasImg 
    ? `<img src="${music.image}" alt="${music.title}" loading="lazy">`
    : `<div class="default-cover"><img src="${iconPath}" alt="音樂圖示" class="icon-music"></div>`;
  
  const defaultBadge = music.isDefault 
    ? '<span class="default-badge">預設播放</span>' 
    : '';

  return `
    <div class="music-item" data-id="${music.id}">
      <div class="music-cover">
        ${coverHTML}
        <div class="play-overlay">
          <img src="${playIconPath}" alt="播放" class="play-icon">
        </div>
      </div>
      <div class="music-info">
        <h4 class="music-title">${music.title}</h4>
        <div class="music-meta">${defaultBadge}</div>
      </div>
      <div class="music-actions">
        <span class="music-duration">${formattedDuration}</span>
        <button class="action-btn play-music-btn" title="播放此音樂">
          <img src="${playIconPath}" alt="播放" class="play-icon">
        </button>
      </div>
    </div>
  `;
}

/**
 * [Portal 零件 1] 靜音彈窗
 */
function getMutePopupHTML(iconPath) {
  return `
    <div class="volume-mute-popup-content">
      <img src="${iconPath}" alt="靜音" class="volume-mute-popup-icon">
      <div class="volume-mute-popup-text">音樂已靜音，是否開啟聲音?</div>
    </div>
    <div class="volume-mute-popup-buttons">
      <div class="volume-mute-popup-confirm" role="button" tabindex="0">是</div>
      <div class="volume-mute-popup-cancel" role="button" tabindex="0">否</div>
    </div>
  `;
}

/**
 * [Portal 零件 2] 互動提示 (點擊頁面任意處)
 */
function getInteractionPromptHTML(hasUnmuted) {
  return `
    <div class="interaction-prompt">
      <p>請點擊任意處</p>
      <span>誦經音樂將以靜音模式開始播放，<br>您可隨時調整音量</span>
    </div>
  `;
}

/**
 * [Portal 樣式] 支持 Portal 元素在 body 下的顯示
 */
function getPortalStyles() {
  return `
    /* --- 靜音提示彈窗樣式 --- */
    #volume-mute-portal {
      position: fixed;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: white;
      padding: 20px;
      border: 1px solid #D9D9D9;
      border-radius: 20px;
      box-shadow: 0 10px 15px 0 rgba(0, 0, 0, 0.15);
      z-index: 100000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .volume-mute-popup-content { display: flex; align-items: center; gap: 6px; }
    .volume-mute-popup-icon { width: 24px; height: 24px; object-fit: contain; }
    .volume-mute-popup-text { font-size: 16px; color: #333; }
    .volume-mute-popup-buttons { display: flex; gap: 10px; justify-content: center; }
    .volume-mute-popup-confirm, .volume-mute-popup-cancel {
      padding: 10px 40px;
      border-radius: 100px;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      font-size: 14px;
      border: none;
    }
    .volume-mute-popup-confirm { background: #7158b4; animation: popup-glow 2s infinite; }
    .volume-mute-popup-cancel { background: #d0d0d0; }
    
    /* --- 請點擊任意處引導樣式 --- */
    #interaction-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .interaction-prompt {
      text-align: center;
      color: black;
      animation: pulse 2s infinite;
      pointer-events: none;
    }
    .interaction-prompt p { font-size: 24px; margin: 10px 0; font-weight: 500; }
    .interaction-prompt span { font-size: 16px; color: #666; }

    /* 動畫定義 */
    @keyframes popup-glow {
      0%, 100% { transform: scale(1); background-color: #7158b4; }
      50% { transform: scale(1.05); background-color: #8a74c9; }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    /* Hover 效果 */
    .volume-mute-popup-confirm:hover { transform: scale(1.1) !important; animation: none !important; }
    .volume-mute-popup-cancel:hover { transform: scale(1.1) !important; background-color: #7158b4 !important; }
  `;
}
