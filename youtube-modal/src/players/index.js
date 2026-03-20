import { IframePlayer } from './iframe-player.js';
import { LiteYoutubePlayer, loadLiteYoutubeAssets } from './lite-youtube-player.js';
import { YoutubeIframeApiPlayer } from './youtube-iframe-api-player.js';

export function createPlayer(playerType) {
  switch (playerType) {
    case 'iframe':
      return new IframePlayer();
    case 'youtube-iframe-api':
      return new YoutubeIframeApiPlayer();
    case 'lite-youtube':
    default:
      return new LiteYoutubePlayer();
  }
}

export async function loadPlayerAssets(playerType) {
  if (playerType === 'lite-youtube') {
    return loadLiteYoutubeAssets();
  }
  return { css: '' };
}
