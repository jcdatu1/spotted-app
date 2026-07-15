import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { uploadTripPhoto } from '@/data/media';
import { useCreateUpdate, type NewUpdate } from '@/data/updates';
import { AuthButton, FormError } from '@/features/auth/form';
import { pickAndPrepareImage, type PreparedImage } from '@/lib/images';
import { COMMON_CURRENCIES } from '@/lib/money';
import { colors } from '@/theme/tokens';

type ComposerType = 'note' | 'photo' | 'purchase' | 'attraction';

const TYPE_BUTTONS: { type: ComposerType; icon: keyof typeof Ionicons.glyphMap; label: string }[] =
  [
    { type: 'note', icon: 'chatbubble', label: 'Note' },
    { type: 'photo', icon: 'image', label: 'Photo' },
    { type: 'purchase', icon: 'cart', label: 'Purchase' },
    { type: 'attraction', icon: 'location', label: 'Place' },
  ];

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

type ComposerBarProps = {
  tripId: string;
  defaultCurrency: string;
};

export function ComposerBar({ tripId, defaultCurrency }: ComposerBarProps) {
  const create = useCreateUpdate(tripId);
  const [active, setActive] = useState<ComposerType | null>(null);
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
    setActive(null);
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
    if (!active) return;
    setError(null);
    const caption = body.trim() || null;

    let input: NewUpdate;
    try {
      if (active === 'note') {
        if (!caption) throw new Error('Write something first.');
        input = { type: 'note', body: caption };
      } else if (active === 'photo') {
        if (!image) throw new Error('Pick a photo first.');
        setBusy(true);
        const mediaPath = await uploadTripPhoto(tripId, image);
        input = { type: 'photo', mediaPath, body: caption };
      } else if (active === 'purchase') {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post the update.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="border-t border-border bg-surfaceRaised px-4 pb-6 pt-3">
      {active ? (
        <View className="mb-3">
          <FormError message={error} />
          {active === 'note' ? (
            <Field
              value={body}
              onChangeText={setBody}
              placeholder="What's happening?"
              multiline
              maxLength={1000}
              accessibilityLabel="Note text"
            />
          ) : null}
          {active === 'photo' ? (
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
          {active === 'purchase' ? (
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
          {active === 'attraction' ? (
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
              onPress={reset}>
              Cancel
            </Text>
            <View className="w-28">
              <AuthButton label="Post" onPress={submit} busy={busy} />
            </View>
          </View>
        </View>
      ) : null}

      <View className="flex-row justify-between">
        {TYPE_BUTTONS.map(({ type, icon, label }) => {
          const selected = active === type;
          return (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityLabel={`Add ${label.toLowerCase()} update`}
              onPress={() => {
                setError(null);
                setActive(selected ? null : type);
              }}
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
                selected ? 'bg-primaryTint' : 'bg-surfaceMuted'
              }`}>
              <Ionicons name={icon} size={15} color={selected ? colors.primary : colors.inkMuted} />
              <Text
                className={`font-sans-semibold text-xs ${selected ? 'text-primary' : 'text-inkMuted'}`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
