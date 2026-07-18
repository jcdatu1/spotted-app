import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { profileMediaUrl, type Profile } from '@/data/profiles';
import { MIN_SEARCH_LENGTH, useSearch } from '@/data/search';
import { useSignedUrls } from '@/data/storage';
import { getTripState, usePublishedTripsByCountry, type TripWithOwner } from '@/data/trips';
import { useSearchHistory } from '@/features/discover/search-history';
import { TripCard, tripCardMeta } from '@/features/trips/trip-card';
import { flagEmoji, type Country } from '@/lib/countries';
import { colors } from '@/theme/tokens';

const DEBOUNCE_MS = 300;
const AVATAR_SIZE = 40;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      accessibilityRole="header"
      className="mb-2 mt-4 font-sans-bold text-sm tracking-widest text-inkMuted">
      {children}
    </Text>
  );
}

/** Bordered card wrapping a list of result rows (Settings row pattern). */
function RowCard({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-bubble border border-border bg-surfaceRaised">
      {children}
    </View>
  );
}

function UserRow({ user, onPress }: { user: Profile; onPress: () => void }) {
  const avatarUrl = profileMediaUrl(user.avatar_path);
  const initial = user.display_name.trim().charAt(0).toUpperCase() || '@';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${user.display_name}'s profile`}
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <View
        className="items-center justify-center overflow-hidden bg-primary"
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Text className="font-display text-base text-inkInverse">{initial}</Text>
        )}
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="font-sans-semibold text-base text-ink">
          {user.display_name}
        </Text>
        <Text numberOfLines={1} className="font-mono text-sm text-inkMuted">
          @{user.username}
        </Text>
      </View>
    </Pressable>
  );
}

function CountryRow({ country, onPress }: { country: Country; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Show trips in ${country.name}`}
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <Text className="text-xl">{flagEmoji(country.code)}</Text>
      <Text className="flex-1 font-sans-semibold text-base text-ink">{country.name}</Text>
      <Text className="font-mono text-2xs uppercase tracking-widest text-inkMuted">Country</Text>
    </Pressable>
  );
}

function TripResults({ trips, onOpen }: { trips: TripWithOwner[]; onOpen: (id: string) => void }) {
  const coverPaths = trips.flatMap((t) => (t.cover_path ? [t.cover_path] : []));
  const { data: coverUrls } = useSignedUrls('trip-media', coverPaths);
  return (
    <>
      {trips.map((trip, index) => (
        <Pressable
          key={trip.id}
          accessibilityRole="button"
          accessibilityLabel={`Open trip ${trip.title}`}
          onPress={() => onOpen(trip.id)}>
          <TripCard
            title={trip.title}
            subtitle={`by ${trip.owner.display_name}`}
            state={getTripState(trip)}
            meta={tripCardMeta(trip)}
            coverUrl={trip.cover_path ? coverUrls?.[trip.cover_path] : undefined}
            tintIndex={index}
          />
        </Pressable>
      ))}
    </>
  );
}

/** Country drill-down: published trips tagged with the selected country. */
function CountryTrips({ country, onClear }: { country: Country; onClear: () => void }) {
  const router = useRouter();
  const { data: trips, isPending } = usePublishedTripsByCountry(country.code);
  return (
    <View>
      <View className="mt-4 flex-row items-center justify-between">
        <Text accessibilityRole="header" className="font-display text-xl text-ink">
          {flagEmoji(country.code)} {country.name}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Clear country" onPress={onClear}>
          <Text className="font-sans-semibold text-base text-primary">Clear</Text>
        </Pressable>
      </View>
      <View className="mt-3">
        {isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : trips && trips.length > 0 ? (
          <TripResults
            trips={trips}
            onOpen={(id) => router.push({ pathname: '/trip/[id]', params: { id } })}
          />
        ) : (
          <Text className="font-sans text-sm text-inkMuted">
            No published trips in {country.name} yet.
          </Text>
        )}
      </View>
    </View>
  );
}

function RecentSearches({ onPick }: { onPick: (term: string) => void }) {
  const { recents, clearRecents } = useSearchHistory();

  if (recents.length === 0) {
    return (
      <Text className="mt-4 font-sans text-sm text-inkMuted">
        Search for creators, trips, and countries.
      </Text>
    );
  }
  return (
    <View>
      <View className="flex-row items-end justify-between">
        <SectionLabel>RECENT</SectionLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear recent searches"
          onPress={clearRecents}>
          <Text className="mb-2 font-sans-semibold text-sm text-primary">Clear</Text>
        </Pressable>
      </View>
      <RowCard>
        {recents.map((term) => (
          <Pressable
            key={term}
            accessibilityRole="button"
            accessibilityLabel={`Search ${term}`}
            onPress={() => onPick(term)}
            className="border-b border-border px-4 py-3">
            <Text className="font-sans text-base text-ink">{term}</Text>
          </Pressable>
        ))}
      </RowCard>
    </View>
  );
}

export function DiscoverScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const addRecent = useSearchHistory((s) => s.addRecent);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const searching = !country && term.length >= MIN_SEARCH_LENGTH;
  const { data: results, isPending } = useSearch(country ? '' : term);

  const noMatches =
    searching &&
    results &&
    results.countries.length === 0 &&
    results.users.length === 0 &&
    results.trips.length === 0;

  function changeQuery(next: string) {
    setInput(next);
    setCountry(null);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-4">
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Discover
        </Text>
        <View className="mt-3 flex-row items-center rounded-lg border border-borderStrong bg-white px-4">
          <TextInput
            accessibilityLabel="Search"
            value={input}
            onChangeText={changeQuery}
            onSubmitEditing={() => addRecent(input)}
            placeholder="Search users, trips, countries…"
            placeholderTextColor={colors.inkFaint}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            className="flex-1 py-3 font-sans text-base text-ink"
          />
          {input.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => changeQuery('')}>
              <Text className="pl-3 font-sans-semibold text-base text-inkMuted">✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-24"
        keyboardShouldPersistTaps="handled">
        {country ? (
          <CountryTrips country={country} onClear={() => setCountry(null)} />
        ) : searching ? (
          <View>
            {isPending ? (
              <ActivityIndicator className="mt-6" color={colors.primary} />
            ) : noMatches ? (
              <Text className="mt-4 font-sans text-sm text-inkMuted">
                Nothing found for “{term}”.
              </Text>
            ) : results ? (
              <View>
                {results.countries.length > 0 ? (
                  <View>
                    <SectionLabel>COUNTRIES</SectionLabel>
                    <RowCard>
                      {results.countries.map((c) => (
                        <CountryRow
                          key={c.code}
                          country={c}
                          onPress={() => {
                            addRecent(c.name);
                            setCountry(c);
                          }}
                        />
                      ))}
                    </RowCard>
                  </View>
                ) : null}
                {results.users.length > 0 ? (
                  <View>
                    <SectionLabel>USERS</SectionLabel>
                    <RowCard>
                      {results.users.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          onPress={() => {
                            addRecent(term);
                            router.push({ pathname: '/user/[id]', params: { id: user.id } });
                          }}
                        />
                      ))}
                    </RowCard>
                  </View>
                ) : null}
                {results.trips.length > 0 ? (
                  <View>
                    <SectionLabel>TRIPS</SectionLabel>
                    <TripResults
                      trips={results.trips}
                      onOpen={(id) => {
                        addRecent(term);
                        router.push({ pathname: '/trip/[id]', params: { id } });
                      }}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : (
          <RecentSearches onPick={changeQuery} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
