import { create } from 'zustand';

export type ComposerType = 'note' | 'photo' | 'purchase' | 'attraction';

type OwnedTrip = { tripId: string; defaultCurrency: string };

/** Bridges the focused trip thread and the global tab bar: while the owner's
 *  own thread is focused, the center + button opens the update-type picker
 *  instead of the trip creation flow. Registration is focus-scoped
 *  (useFocusEffect), so any blur clears it and + falls back to New trip. */
type ComposerState = {
  ownedTrip: OwnedTrip | null;
  /** null = closed; 'picker' = type grid; otherwise that type's form. */
  sheet: 'picker' | ComposerType | null;
  registerOwnedTrip: (trip: OwnedTrip) => void;
  clearOwnedTrip: () => void;
  openPicker: () => void;
  selectType: (type: ComposerType) => void;
  closeSheet: () => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  ownedTrip: null,
  sheet: null,
  registerOwnedTrip: (ownedTrip) => set({ ownedTrip }),
  clearOwnedTrip: () => set({ ownedTrip: null, sheet: null }),
  openPicker: () => set({ sheet: 'picker' }),
  selectType: (type) => set({ sheet: type }),
  closeSheet: () => set({ sheet: null }),
}));
