import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { uploadTripPhoto } from '@/data/media';
import { useCreateUpdate, type NewUpdate } from '@/data/updates';
import { AuthButton, FormError } from '@/features/auth/form';
import { useComposerStore, type ComposerType } from '@/features/composer/composer-store';
import { pickAndPrepareImage, type PreparedImage } from '@/lib/images';
import { COMMON_CURRENCIES } from '@/lib/money';
import { colors } from '@/theme/tokens';

const TYPE_OPTIONS: { type: ComposerType; icon: keyof typeof Ionicons.glyphMap; label: string }[] =
  [
    { type: 'note', icon: 'chatbubble', label: 'Note' },
    { type: 'photo', icon: 'image', label: 'Photo' },
    { type: 'purchase', icon: 'cart', label: 'Purchase' },
    { type: 'attraction', icon: 'location', label: 'Place' },
  ];

const TYPE_TITLES: Record<ComposerType, string> = {
  note: 'New note',
  photo: 'New photo',
  purchase: 'New purchase',
  attraction: 'New place',
};

function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.inkFaint}
      className="mb-2 rounded-lg border border-borderStrong bg-white px-3 py-2.5 font-sans text-base text-ink"
      {...props}
    />
  );
}

function CurrencyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (currency: string) => void;
}) {
  return (
    <View className="mb-2 flex-row flex-wrap gap-1.5">
      {COMMON_CURRENCIES.map((code) => {
        const selected = code === value;
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityLabel={`Currency ${code}`}
            onPress={() => onChange(code)}
            className={`rounded-full border px-3 py-1 ${
              selected ? 'border-secondary bg-secondary' : 'border-borderStrong bg-white'
            }`}>
            <Text className={`font-mono text-xs ${selected ? 'text-white' : 'text-inkMuted'}`}>
              {code}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type ComposerSheetProps = {
  tripId: string;
  defaultCurrency: string;
};

/** Bottom-sheet composer opened by the tab bar's + button on an owned thread:
 *  a type picker stage, then the chosen type's form. Plain RN Modal (renders
 *  above the tab bar, Expo Go safe) — no bottom-sheet dependency. */
export function ComposerSheet({ tripId, defaultCurrency }: ComposerSheetProps) {
  const sheet = useComposerStore((s) => s.sheet);
  const selectType = useComposerStore((s) => s.selectType);
  const closeSheet = useComposerStore((s) => s.closeSheet);

  const create = useCreateUpdate(tripId);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [body, setBody] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [place, setPlace] = useState('');
  const [fee, setFee] = useState('');
  const [image, setImage] = useState<PreparedImage | null>(null);

  function reset() {
    setBody('');
    setVendor('');
    setAmount('');
    setPlace('');
    setFee('');
    setImage(null);
    setError(null);
  }

  function close() {
    if (busy) return;
    reset();
    closeSheet();
  }

  async function pickImage() {
    const prepared = await pickAndPrepareImage('tripPhoto');
    if (prepared) setImage(prepared);
  }

  function parseAmount(raw: string): number | null {
    const value = Number.parseFloat(raw.replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
  }

  async function submit() {
    if (!sheet || sheet === 'picker') return;
    setError(null);
    const caption = body.trim() || null;

    let input: NewUpdate;
    try {
      if (sheet === 'note') {
        if (!caption) throw new Error('Write something first.');
        input = { type: 'note', body: caption };
      } else if (sheet === 'photo') {
        if (!image) throw new Error('Pick a photo first.');
        setBusy(true);
        const mediaPath = await uploadTripPhoto(tripId, image);
        input = { type: 'photo', mediaPath, body: caption };
      } else if (sheet === 'purchase') {
        const parsed = parseAmount(amount);
        if (!vendor.trim()) throw new Error('Where did you spend it?');
        if (parsed === null) throw new Error('Enter a valid amount.');
        input = { type: 'purchase', vendorName: vendor, amount: parsed, currency, body: caption };
      } else {
        if (!place.trim()) throw new Error('Name the place.');
        const parsedFee = fee.trim() ? parseAmount(fee) : null;
        if (fee.trim() && parsedFee === null) throw new Error('Enter a valid entry fee.');
        input = {
          type: 'attraction',
          placeName: place,
          amount: parsedFee,
          currency: parsedFee !== null ? currency : null,
          body: caption,
        };
      }
      setBusy(true);
      await create.mutateAsync(input);
      reset();
      closeSheet();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post the update.');
    } finally {
      setBusy(false);
    }
  }

  const activeForm = sheet && sheet !== 'picker' ? sheet : null;

  return (
    <Modal
      visible={sheet !== null}
      transparent
      animationType="slide"
      onRequestClose={close}
      accessibilityViewIsModal>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close composer"
          onPress={close}
          className="flex-1"
          style={{ backgroundColor: 'rgba(23, 34, 32, 0.4)' }}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="rounded-t-2xl bg-surfaceRaised px-4 pb-8 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text accessibilityRole="header" className="font-sans-bold text-base text-ink">
                {activeForm ? TYPE_TITLES[activeForm] : 'Add to your trip'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close composer"
                onPress={close}
                className="h-8 w-8 items-center justify-center rounded-full bg-surfaceMuted">
                <Ionicons name="close" size={18} color={colors.inkMuted} />
              </Pressable>
            </View>

            {sheet === 'picker' ? (
              <View className="flex-row flex-wrap justify-between">
                {TYPE_OPTIONS.map(({ type, icon, label }) => (
                  <Pressable
                    key={type}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${label.toLowerCase()} update`}
                    onPress={() => {
                      setError(null);
                      selectType(type);
                    }}
                    className="mb-3 w-[48%] items-center rounded-xl border border-border bg-white px-3 py-5">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-primaryTint">
                      <Ionicons name={icon} size={18} color={colors.primary} />
                    </View>
                    <Text className="mt-2 font-sans-semibold text-sm text-ink">{label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {activeForm ? (
              <View>
                <FormError message={error} />
                {activeForm === 'note' ? (
                  <Field
                    value={body}
                    onChangeText={setBody}
                    placeholder="What's happening?"
                    multiline
                    maxLength={1000}
                    accessibilityLabel="Note text"
                  />
                ) : null}
                {activeForm === 'photo' ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={image ? 'Change photo' : 'Pick a photo'}
                      onPress={pickImage}
                      className="mb-2 items-center rounded-lg border border-dashed border-borderStrong bg-white px-3 py-4">
                      <Ionicons
                        name={image ? 'checkmark-circle' : 'image'}
                        size={20}
                        color={image ? colors.secondary : colors.inkMuted}
                      />
                      <Text className="mt-1 font-sans text-sm text-inkMuted">
                        {image ? 'Photo selected — tap to change' : 'Pick a photo'}
                      </Text>
                    </Pressable>
                    <Field
                      value={body}
                      onChangeText={setBody}
                      placeholder="Caption (optional)"
                      maxLength={1000}
                      accessibilityLabel="Photo caption"
                    />
                  </>
                ) : null}
                {activeForm === 'purchase' ? (
                  <>
                    <Field
                      value={vendor}
                      onChangeText={setVendor}
                      placeholder="Store or vendor"
                      maxLength={120}
                      accessibilityLabel="Vendor"
                    />
                    <Field
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="Amount"
                      keyboardType="decimal-pad"
                      accessibilityLabel="Amount"
                    />
                    <CurrencyPicker value={currency} onChange={setCurrency} />
                    <Field
                      value={body}
                      onChangeText={setBody}
                      placeholder="Note (optional)"
                      maxLength={1000}
                      accessibilityLabel="Purchase note"
                    />
                  </>
                ) : null}
                {activeForm === 'attraction' ? (
                  <>
                    <Field
                      value={place}
                      onChangeText={setPlace}
                      placeholder="Place or attraction"
                      maxLength={120}
                      accessibilityLabel="Place name"
                    />
                    <Field
                      value={fee}
                      onChangeText={setFee}
                      placeholder="Entry fee (optional)"
                      keyboardType="decimal-pad"
                      accessibilityLabel="Entry fee"
                    />
                    {fee.trim() ? <CurrencyPicker value={currency} onChange={setCurrency} /> : null}
                    <Field
                      value={body}
                      onChangeText={setBody}
                      placeholder="Note (optional)"
                      maxLength={1000}
                      accessibilityLabel="Place note"
                    />
                  </>
                ) : null}
                <View className="flex-row items-center justify-end gap-4">
                  <Text
                    accessibilityRole="button"
                    className="font-sans-semibold text-sm text-inkMuted"
                    onPress={close}>
                    Cancel
                  </Text>
                  <View className="w-28">
                    <AuthButton label="Post" onPress={submit} busy={busy} />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
