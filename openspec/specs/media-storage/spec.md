# media-storage Specification

## Purpose

How user media gets on and off Supabase Storage: a bucket-agnostic core module, client-side image preparation presets, per-bucket access modes (signed vs public URLs), and the replace-safely lifecycle every media domain follows.

## Requirements

### Requirement: Media access goes through a bucket-agnostic storage core
All Supabase Storage interaction SHALL go through a shared core module (`src/data/storage.ts`) exposing upload, public-URL derivation, batched signed URLs, and deletion, parameterized by bucket. Feature domains (trip media, profile media, future buckets) SHALL build thin typed modules on the core; components SHALL NOT call the storage client directly. Buckets SHALL be provisioned by migration with write/delete policies restricted to the caller's own top-level prefix (`{uid}/...`).

#### Scenario: New media domain reuses the core
- **WHEN** a feature needs a new media type
- **THEN** it adds a migration (bucket + own-prefix policies) and a thin domain module on the core, with no duplicated upload/signing logic

#### Scenario: Cross-prefix write rejected
- **WHEN** an authenticated user attempts to upload or delete an object outside their own `{uid}/` prefix in any app bucket
- **THEN** storage policies reject the operation

### Requirement: Images are prepared client-side before upload
Every image upload SHALL pass through a shared preparation step (`src/lib/images.ts`) that picks, resizes, and compresses to a named preset — `avatar` (512px square), `cover` (1600px wide), `tripPhoto` (2048px wide) — so original-resolution files are never uploaded.

#### Scenario: Oversized photo is resized
- **WHEN** a user picks a 12MP camera photo for any upload
- **THEN** the uploaded object is resized/compressed per the preset before transfer

### Requirement: Access mode is a per-bucket choice
Each bucket SHALL declare its access mode: private buckets (e.g. `trip-media`) resolve display URLs via batched signed URLs with expiry-aware refetch; public buckets (e.g. `profile-media`) resolve stable public URLs derived from the stored path. The database SHALL store bucket-relative paths, never URLs.

#### Scenario: Private media renders via signed URL
- **WHEN** a thread displays trip photos
- **THEN** display URLs come from a batched signed-URL request that refetches before expiry

#### Scenario: Public media renders via stable URL
- **WHEN** a profile avatar or cover is displayed
- **THEN** the URL is derived from the stored path with no signing round-trip

### Requirement: Replaced media uses unique filenames and deletes the predecessor
Uploads that replace existing media (e.g. a new avatar) SHALL write to a new unique filename, update the referencing row only after a successful upload, and then delete the previous object best-effort. A row SHALL never reference a storage path that was not successfully uploaded.

#### Scenario: Avatar replaced
- **WHEN** a user uploads a new avatar over an existing one
- **THEN** the new file uploads under a new unique path, the profile row points at it, and the old object is deleted

#### Scenario: Upload fails
- **WHEN** the upload transfer fails
- **THEN** the referencing row is unchanged and no orphan path is stored
