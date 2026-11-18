import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { recordAdImpression, recordAdClick, type AdCampaign } from '../../api/ads/ads.api';

interface SponsoredAdCardProps {
  ad: AdCampaign;
  isActive: boolean;
  contextReelId?: string;
  contextCreatorId?: string;
}

export const SponsoredAdCard: React.FC<SponsoredAdCardProps> = ({
  ad,
  isActive,
  contextReelId,
  contextCreatorId,
}) => {
  const { width, height } = useWindowDimensions();
  const impressionRecordedRef = useRef<boolean>(false);
  const impressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(ad.mediaUrl ?? '', (p) => {
    p.loop = true;
    p.muted = false;
    if (isActive) {
      p.play();
    } else {
      p.pause();
    }
  });

  // Track impression after user views the ad for 3 seconds
  useEffect(() => {
    if (isActive) {
      try {
        player.play();
      } catch (e) {
        console.log('[SponsoredAdCard] Player play error:', e);
      }

      if (!impressionRecordedRef.current) {
        impressionTimerRef.current = setTimeout(async () => {
          try {
            await recordAdImpression(ad.id, {
              reelId: contextReelId,
              creatorId: contextCreatorId,
            });
            impressionRecordedRef.current = true;
          } catch (error) {
            console.error('[SponsoredAdCard] Failed to record impression:', error);
          }
        }, 3000); // 3 seconds threshold
      }
    } else {
      try {
        player.pause();
      } catch (e) {
        console.log('[SponsoredAdCard] Player pause error:', e);
      }

      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
        impressionTimerRef.current = null;
      }
    }

    return () => {
      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
      }
    };
  }, [isActive, ad.id, contextReelId, contextCreatorId, player]);

  // Handle CTA button click
  const handleCtaPress = async () => {
    try {
      await recordAdClick(ad.id);
    } catch (error) {
      console.error('[SponsoredAdCard] Failed to record click:', error);
    }

    if (ad.destinationUrl) {
      try {
        const canOpen = await Linking.canOpenURL(ad.destinationUrl);
        if (canOpen) {
          await Linking.openURL(ad.destinationUrl);
        }
      } catch (error) {
        console.error('[SponsoredAdCard] Open URL error:', error);
      }
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="cover"
      />

      {/* Sponsored Badge */}
      <View style={styles.topBadge}>
        <Text style={styles.badgeText}>Sponsored</Text>
      </View>

      {/* Overlay Content */}
      <View style={styles.contentOverlay}>
        {ad.title ? <Text style={styles.title}>{ad.title}</Text> : null}
        {ad.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {ad.description}
          </Text>
        ) : null}

        {ad.ctaType && ad.ctaType !== 'none' && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleCtaPress}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>
              {ad.ctaLabel?.trim() ? ad.ctaLabel : 'Learn More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  topBadge: {
    position: 'absolute',
    top: 55,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#F0F0F0',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
