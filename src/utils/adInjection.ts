import type { AdCampaign } from '../api/ads/ads.api';

export type FeedListItem<T = any> = 
  | { type: 'reel'; id: string; data: T }
  | { type: 'ad'; id: string; data: AdCampaign };

/**
 * Injects a sponsored ad into the reels feed list after every specified interval.
 *
 * @param reels Array of organic reels
 * @param ads Array of active sponsored ads
 * @param interval Frequency of ads (defaults to every 6 organic reels)
 */
export function injectAdsIntoReels<T extends { id: string }>(
  reels: T[],
  ads: AdCampaign[],
  interval: number = 6,
): FeedListItem<T>[] {
  if (!Array.isArray(reels) || reels.length === 0) {
    return [];
  }

  if (!Array.isArray(ads) || ads.length === 0) {
    return reels.map((reel) => ({
      type: 'reel',
      id: reel.id,
      data: reel,
    }));
  }

  const result: FeedListItem<T>[] = [];
  let adIndex = 0;

  for (let i = 0; i < reels.length; i++) {
    result.push({
      type: 'reel',
      id: reels[i].id,
      data: reels[i],
    });

    if ((i + 1) % interval === 0) {
      const selectedAd = ads[adIndex % ads.length];
      result.push({
        type: 'ad',
        id: `ad_${selectedAd.id}_after_${i + 1}`,
        data: selectedAd,
      });
      adIndex++;
    }
  }

  return result;
}
