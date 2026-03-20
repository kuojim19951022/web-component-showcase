export const CONFIG = {
  SHOW_TITLE: true, // 是否顯示影片標題
  SHOW_DESCRIPTION: true, // 是否顯示影片描述（空描述會自動隱藏）
  SHOW_RELATED_DEFAULT: true, // 是否預設顯示相關影片
  PLAYER_TYPE: "iframe", // 播放器類型：'lite-youtube' | 'iframe' | 'youtube-iframe-api'
};

export const VALID_PLAYER_TYPES = [
  "lite-youtube",
  "iframe",
  "youtube-iframe-api",
];

// 播放器參數配置
export const PLAYER_VARS = {
  autoplay: 1, // 自動播放：建議開啟
  controls: 1, // 顯示播放器控制列（播放／暫停、音量、全螢幕等）
  rel: 0, // 相關影片：0＝只顯示同頻道，1＝可顯示其他頻道
  playsinline: 1, // iOS 內嵌播放（不強制全螢幕）
  modestbranding: 0, // 0＝顯示 YouTube logo，1＝精簡品牌
  iv_load_policy: 3, // 影片註解：1＝顯示，3＝不顯示
};
