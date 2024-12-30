import { SIX_HOUR_IN_MS } from '@pulsefeed/common';

export const PublishCacheKey = {
  TRENDING_KEYWORD: {
    prefix: 'pf:publish:trending-keywords',
    ttl: SIX_HOUR_IN_MS,
  },
};
