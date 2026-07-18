import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

import type { Trip, TripState } from '@/data/trips';
import { flagEmoji } from '@/lib/countries';
import { formatTripRange } from '@/lib/dates';
import { colors } from '@/theme/tokens';

/** Space Mono meta line: date range + country flags when the trip has dates,
 *  creation month/year for legacy trips that don't. */
export function tripCardMeta(
  trip: Pick<Trip, 'start_date' | 'end_date' | 'country_codes' | 'created_at'>,
): string {
  const flags = trip.country_codes.map(flagEmoji).join('');
  const range =
    trip.start_date && trip.end_date
      ? formatTripRange(trip.start_date, trip.end_date)
      : new Date(trip.created_at)
          .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          .toUpperCase();
  return flags ? `${range} ${flags}` : range;
}

/** Body status chips per the mockup: live #FFE7E1/#FF6A4D (primaryTint/
 *  primary), completed #DDF0EC/#0F7B6C (secondaryTint/secondary). */
const CHIP_STYLES: Record<TripState, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-accentTint', text: 'text-accentPressed', label: 'Draft' },
  live: { bg: 'bg-primaryTint', text: 'text-primary', label: 'LIVE' },
  completed: { bg: 'bg-secondaryTint', text: 'text-secondary', label: 'COMPLETED' },
};

export function StatusChip({ state }: { state: TripState }) {
  const chip = CHIP_STYLES[state];
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${chip.bg}`}>
      <Text className={`font-sans-bold text-2xs uppercase ${chip.text}`}>{chip.label}</Text>
    </View>
  );
}

/** The mockup's sp-pop: the LIVE badge's white dot pulses forever. */
function PulsingDot({ size }: { size: number }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.white,
        opacity,
      }}
    />
  );
}

/** Mockup badge geometry: sm = profile boarding-pass card (9px/700, 3×7 pad,
 *  4px dot, inset 8), md = home feed card (11px/700, 5×10 pad, 6px dot,
 *  inset 12). */
const BADGE_SIZES = {
  sm: { font: 9, padV: 3, padH: 7, dot: 4, inset: 8 },
  md: { font: 11, padV: 5, padH: 10, dot: 6, inset: 12 },
} as const;

/** Cover-overlay badge, copied from the mockup: coral rgba(255,106,77,.95)
 *  LIVE pill with pulsing dot; teal rgba(15,123,108,.95) COMPLETED. Drafts
 *  carry no overlay. */
function CoverBadge({ state, size = 'sm' }: { state: TripState; size?: keyof typeof BADGE_SIZES }) {
  if (state === 'draft') return null;
  const live = state === 'live';
  const s = BADGE_SIZES[size];
  return (
    <View
      className="absolute flex-row items-center rounded-full"
      style={{
        left: s.inset,
        top: s.inset,
        gap: s.dot,
        backgroundColor: live ? 'rgba(255, 106, 77, 0.95)' : 'rgba(15, 123, 108, 0.95)',
        paddingVertical: s.padV,
        paddingHorizontal: s.padH,
      }}>
      {live ? <PulsingDot size={s.dot} /> : null}
      <Text className="font-sans-bold uppercase text-white" style={{ fontSize: s.font }}>
        {live ? 'LIVE' : 'COMPLETED'}
      </Text>
    </View>
  );
}

function CountChip({
  count,
  label,
  textClass,
}: {
  count: number;
  label: string;
  textClass: string;
}) {
  return (
    <View className="self-start rounded-full bg-surfaceRaised px-2 py-0.5">
      <Text className={`font-mono text-2xs ${textClass}`}>
        {count} {label}
      </Text>
    </View>
  );
}

/** Placeholder cover tints for trips without a cover photo. */
const COVER_TINTS = ['bg-secondaryLight', 'bg-accent', 'bg-primaryPressed'] as const;

type TripCardProps = {
  title: string;
  subtitle: string;
  state?: TripState;
  /** Space Mono meta line, e.g. "FEB 12–26 2026 🇵🇭". */
  meta?: string;
  /** Unique-reader count; renders the views chip when provided. */
  views?: number;
  /** Save count; renders the saves chip (teal = saves) when provided. */
  saves?: number;
  /** Signed display URL of the trip's cover photo; tint fallback when absent. */
  coverUrl?: string;
  /** Rotates the placeholder cover tint (list index). */
  tintIndex?: number;
};

/** Boarding-pass list card per the mockup profile design: 96px cover with
 *  overlaid status badge, dashed perforation, mono meta / Fraunces title /
 *  muted subtitle, chips row. Wrap in a Link/Pressable for navigation. */
export function TripCard({
  title,
  subtitle,
  state,
  meta,
  views,
  saves,
  coverUrl,
  tintIndex = 0,
}: TripCardProps) {
  return (
    <View
      className="mb-3.5 flex-row overflow-hidden rounded-bubble border border-border bg-white"
      style={{
        // mockup: 0 8px 20px -16px rgba(42,36,32,.5) — RN can't do spread,
        // approximated soft drop
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
        elevation: 3,
      }}>
      <View className="relative" style={{ width: 96 }}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View className={`flex-1 ${COVER_TINTS[tintIndex % COVER_TINTS.length]}`} />
        )}
        {state ? <CoverBadge state={state} /> : null}
      </View>
      <View className="relative flex-1 px-3.5 py-3">
        {/* boarding-pass perforation between cover and body */}
        <View
          className="absolute bottom-3 top-3 border-l-2 border-border"
          style={{ left: -1, borderStyle: 'dashed' }}
        />
        {meta ? (
          <Text className="font-mono text-2xs uppercase tracking-widest text-inkMuted">{meta}</Text>
        ) : null}
        <Text numberOfLines={1} className="mt-0.5 font-display text-lg text-ink">
          {title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 font-sans text-xs text-inkMuted">
          {subtitle}
        </Text>
        {state !== undefined || views !== undefined || saves !== undefined ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            {state ? <StatusChip state={state} /> : null}
            {views !== undefined ? (
              <CountChip
                count={views}
                label={views === 1 ? 'view' : 'views'}
                textClass="text-inkMuted"
              />
            ) : null}
            {saves !== undefined ? (
              <CountChip
                count={saves}
                label={saves === 1 ? 'save' : 'saves'}
                textClass="text-secondary"
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function FooterStat({
  value,
  label,
  valueClass,
}: {
  value: number;
  label: string;
  valueClass: string;
}) {
  return (
    <View className="items-end">
      <Text className={`font-mono-bold ${valueClass}`} style={{ fontSize: 14 }}>
        {value}
      </Text>
      <Text className="text-inkMuted" style={{ fontSize: 9, letterSpacing: 1 }}>
        {label}
      </Text>
    </View>
  );
}

type FeedTripCardProps = {
  title: string;
  /** Space Mono line over the cover, e.g. "FEB 12–26 2026 🇵🇭". */
  meta: string;
  creatorName: string;
  creatorUsername: string;
  /** Public avatar URL; initial-on-coral fallback when absent. */
  avatarUrl?: string;
  state: TripState;
  stops: number;
  /** Inclusive trip length; omitted for legacy trips without dates. */
  days?: number;
  coverUrl?: string;
  tintIndex?: number;
};

/** The home feed's big boarding-pass card per the mockup: 148px full-width
 *  cover with overlaid badge + title, notched perforation, then an
 *  avatar/creator footer with STOPS · DAYS stats. */
export function FeedTripCard({
  title,
  meta,
  creatorName,
  creatorUsername,
  avatarUrl,
  state,
  stops,
  days,
  coverUrl,
  tintIndex = 0,
}: FeedTripCardProps) {
  const initial = creatorName.trim().charAt(0).toUpperCase() || '@';
  return (
    <View
      className="mb-4.5 overflow-hidden rounded-2xl border border-border bg-white"
      style={{
        // mockup: 0 10px 24px -16px rgba(42,36,32,.5)
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
        elevation: 3,
      }}>
      <View className="relative" style={{ height: 148 }}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View className={`flex-1 ${COVER_TINTS[tintIndex % COVER_TINTS.length]}`} />
        )}
        {/* mockup scrim is a gradient; approximated without a gradient dep */}
        <View
          className="absolute inset-x-0 bottom-0"
          style={{ height: 74, backgroundColor: 'rgba(0, 0, 0, 0.34)' }}
        />
        <CoverBadge state={state} size="md" />
        <View className="absolute bottom-3 left-3.5 right-3.5">
          <Text
            numberOfLines={1}
            className="font-mono-bold uppercase tracking-widest"
            style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.85)' }}>
            {meta}
          </Text>
          <Text numberOfLines={1} className="font-display text-2xl text-white">
            {title}
          </Text>
        </View>
      </View>
      {/* notched perforation between cover and footer */}
      <View className="relative" style={{ height: 1 }}>
        <View
          className="absolute inset-x-0 border-t-2 border-border"
          style={{ borderStyle: 'dashed' }}
        />
        <View
          className="absolute rounded-full bg-surface"
          style={{ left: -8, top: -8, width: 16, height: 16 }}
        />
        <View
          className="absolute rounded-full bg-surface"
          style={{ right: -8, top: -8, width: 16, height: 16 }}
        />
      </View>
      <View className="flex-row items-center justify-between px-4 py-3.5">
        <View className="flex-1 flex-row items-center gap-2.5">
          <View
            className="items-center justify-center overflow-hidden rounded-full border-2 border-white bg-primary"
            style={{ width: 32, height: 32 }}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <Text className="font-sans-bold text-sm text-white">{initial}</Text>
            )}
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="font-sans-bold text-sm text-ink">
              {creatorName}
            </Text>
            <Text numberOfLines={1} className="font-sans text-xs text-inkMuted">
              @{creatorUsername}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-4">
          <FooterStat value={stops} label="STOPS" valueClass="text-secondary" />
          {days !== undefined ? (
            <FooterStat value={days} label="DAYS" valueClass="text-ink" />
          ) : null}
        </View>
      </View>
    </View>
  );
}
