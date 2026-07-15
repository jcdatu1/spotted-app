import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Named upload shapes — every image is resized/compressed to a preset before
 *  it leaves the device, so original-resolution files are never uploaded. */
export type ImagePreset = 'avatar' | 'cover' | 'tripPhoto';

export type PreparedImage = {
  uri: string;
  mimeType: string;
  extension: string;
};

/** Cover images are stored at this ratio; previews render it. */
export const COVER_ASPECT = 16 / 9;

type PresetSpec = {
  maxWidth: number;
  /** Enforced by center crop; avatars also crop in-picker (square is the one
   *  shape the iOS editor supports — wider ratios must crop programmatically). */
  aspect?: number;
  inPickerCrop?: boolean;
};

const PRESETS: Record<ImagePreset, PresetSpec> = {
  avatar: { maxWidth: 512, aspect: 1, inPickerCrop: true },
  cover: { maxWidth: 1600, aspect: COVER_ASPECT },
  tripPhoto: { maxWidth: 2048 },
};

const JPEG_QUALITY = 0.8;

/**
 * Opens the library picker and normalizes the chosen image to the preset:
 * center crop to the preset aspect, downscale to the preset width, JPEG
 * re-encode (also normalizes HEIC/PNG). Returns null when the user cancels.
 */
export async function pickAndPrepareImage(preset: ImagePreset): Promise<PreparedImage | null> {
  const spec = PRESETS[preset];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: !!spec.inPickerCrop,
    aspect: spec.inPickerCrop ? [1, 1] : undefined,
    quality: 1,
  });
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;

  const context = ImageManipulator.manipulate(asset.uri);
  let width = asset.width;

  if (spec.aspect && asset.height > 0) {
    const currentAspect = asset.width / asset.height;
    if (Math.abs(currentAspect - spec.aspect) > 0.01) {
      const cropWidth =
        currentAspect > spec.aspect ? Math.floor(asset.height * spec.aspect) : asset.width;
      const cropHeight =
        currentAspect > spec.aspect ? asset.height : Math.floor(asset.width / spec.aspect);
      context.crop({
        originX: Math.floor((asset.width - cropWidth) / 2),
        originY: Math.floor((asset.height - cropHeight) / 2),
        width: cropWidth,
        height: cropHeight,
      });
      width = cropWidth;
    }
  }

  if (width > spec.maxWidth) {
    context.resize({ width: spec.maxWidth });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return { uri: saved.uri, mimeType: 'image/jpeg', extension: 'jpg' };
}
