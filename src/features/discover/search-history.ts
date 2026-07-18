import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MIN_SEARCH_LENGTH } from '@/data/search';

const MAX_RECENTS = 10;

type SearchHistoryState = {
  recents: string[];
  addRecent: (term: string) => void;
  clearRecents: () => void;
};

/** Device-local recent searches — most recent first, deduped
 *  case-insensitively, capped. Server-side history is deliberately out of
 *  scope until it's worth its privacy questions. */
export const useSearchHistory = create<SearchHistoryState>()(
  persist(
    (set) => ({
      recents: [],
      addRecent: (term) =>
        set((state) => {
          const cleaned = term.trim();
          if (cleaned.length < MIN_SEARCH_LENGTH) return state;
          const rest = state.recents.filter((r) => r.toLowerCase() !== cleaned.toLowerCase());
          return { recents: [cleaned, ...rest].slice(0, MAX_RECENTS) };
        }),
      clearRecents: () => set({ recents: [] }),
    }),
    { name: 'spotted-search-history', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
