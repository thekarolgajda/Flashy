/**
 * Font subsetting via harfbuzz (compiled to WebAssembly).
 *
 * pdf-lib can subset fonts itself, but its bundled fontkit build silently
 * drops glyphs from large CJK faces: kana and Hangul come out blank. So we
 * subset with harfbuzz first and hand pdf-lib a small, already-minimal font to
 * embed whole (`subset: false`), which keeps output PDFs at tens of kilobytes
 * instead of megabytes.
 *
 * This also flattens variable fonts to their default instance, which is what
 * a printed flashcard wants anyway.
 */

const WASM_URL = "/harfbuzz-subset.wasm";

/** The subset of the hb-subset C API this module drives. */
type HarfbuzzExports = {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(pointer: number): void;
  hb_blob_create(
    data: number,
    length: number,
    mode: number,
    userData: number,
    destroy: number,
  ): number;
  hb_blob_destroy(blob: number): void;
  hb_blob_get_length(blob: number): number;
  hb_blob_get_data(blob: number, lengthOut: number): number;
  hb_face_create(blob: number, index: number): number;
  hb_face_destroy(face: number): void;
  hb_face_reference_blob(face: number): number;
  hb_set_add(set: number, codePoint: number): void;
  hb_subset_input_create_or_fail(): number;
  hb_subset_input_destroy(input: number): void;
  hb_subset_input_unicode_set(input: number): number;
  hb_subset_input_pin_all_axes_to_default(input: number, face: number): number;
  hb_subset_or_fail(face: number, input: number): number;
};

const HB_MEMORY_MODE_WRITABLE = 2;

let runtime: Promise<HarfbuzzExports> | null = null;

function loadHarfbuzz(): Promise<HarfbuzzExports> {
  if (!runtime) {
    runtime = (async () => {
      const response = await fetch(WASM_URL);
      if (!response.ok) {
        throw new Error(`Could not load the subsetter (${response.status})`);
      }
      // instantiateStreaming needs the right MIME type; buffer instead so this
      // works regardless of how the file is served.
      const { instance } = await WebAssembly.instantiate(await response.arrayBuffer());
      return instance.exports as unknown as HarfbuzzExports;
    })();
    runtime.catch(() => {
      runtime = null;
    });
  }
  return runtime;
}

/**
 * Reduces `font` to only the glyphs needed for `text`.
 *
 * Returns the original bytes if subsetting fails for any reason, since a larger
 * PDF is a far better outcome than no PDF.
 */
export async function subsetFont(font: Uint8Array, text: string): Promise<Uint8Array> {
  let hb: HarfbuzzExports;
  try {
    hb = await loadHarfbuzz();
  } catch {
    return font;
  }

  // The heap can be replaced when wasm memory grows, so never cache the view.
  const heap = () => new Uint8Array(hb.memory.buffer);

  let fontPointer = 0;
  let blob = 0;
  let face = 0;
  let input = 0;
  let result = 0;

  try {
    fontPointer = hb.malloc(font.byteLength);
    heap().set(font, fontPointer);

    blob = hb.hb_blob_create(
      fontPointer,
      font.byteLength,
      HB_MEMORY_MODE_WRITABLE,
      0,
      0,
    );
    face = hb.hb_face_create(blob, 0);

    input = hb.hb_subset_input_create_or_fail();
    if (!input) return font;

    const unicodes = hb.hb_subset_input_unicode_set(input);
    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (codePoint !== undefined) hb.hb_set_add(unicodes, codePoint);
    }

    // Collapse variable axes so the output is a plain static font.
    hb.hb_subset_input_pin_all_axes_to_default(input, face);

    result = hb.hb_subset_or_fail(face, input);
    if (!result) return font;

    const resultBlob = hb.hb_face_reference_blob(result);
    const length = hb.hb_blob_get_length(resultBlob);
    const data = hb.hb_blob_get_data(resultBlob, 0);

    // Copy out before any of this memory is freed.
    const subset = heap().slice(data, data + length);
    hb.hb_blob_destroy(resultBlob);

    return subset.byteLength > 0 ? subset : font;
  } catch {
    return font;
  } finally {
    if (result) hb.hb_face_destroy(result);
    if (input) hb.hb_subset_input_destroy(input);
    if (face) hb.hb_face_destroy(face);
    if (blob) hb.hb_blob_destroy(blob);
    if (fontPointer) hb.free(fontPointer);
  }
}
