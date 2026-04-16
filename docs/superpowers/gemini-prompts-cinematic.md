# Gemini / Nano Banana Pro 2 — Cinematic Showcase Asset Prompts

**Target output:**
- `cinematic-a.webp` — chaotic traditional trade
- `cinematic-b.webp` — organized AI-driven trade network
- Both: 2048×1152 (16:9 cinematic / 2.39:1 is also acceptable — tighter letterbox)
- Final size ≤ 250KB WebP, quality 80–85

**Destination:** `public/images/cinematic/` — overwrite the placeholder files.

**Palette contract (critical for shader to look right):**
- Image A must be **dark/warm** (amber, charcoal, deep blue)
- Image B must be **light/cool** (cyan, white, translucent blue)
- The two images must **feel like opposites** — this is what makes the metamorphosis land
- Keep compositional weight roughly centered in both (the shader displaces UVs; off-center focal points get distorted toward the edges during the dissolve)

---

## Prompt A — Chaotic Traditional Trade

Paste this into Gemini / Nano Banana Pro 2:

```
Cinematic wide-angle photograph of a congested international shipping port at dusk.
Dense stacks of rusted shipping containers in amber, burgundy, teal, and charcoal,
towering chaotic bureaucracy — loose paper documents swirling mid-air caught in wind,
tangled cranes and cables overhead, dense low-lying fog hugging the ground,
sodium-vapor streetlights casting orange highlights on wet asphalt,
silhouetted dockworkers in the middle distance giving scale,
dramatic long shadows, moody atmospheric color grading,
analog 35mm film grain, slight anamorphic lens distortion at the edges,
2.39:1 cinematic aspect ratio, shot on Arri Alexa with Panavision lenses,
deep navy sky, rich chiaroscuro, no text, no logos, no watermarks.
```

**Alternates if the first pass is off:**

- If too clean → add: *"visible clutter, overflowing pallets, discarded wooden crates, oil stains"*
- If too dark → add: *"moonlight peeking through fog"* or *"distant warm window lights from cargo buildings"*
- If wrong palette → say: *"dominant palette: deep teal, rust amber, charcoal grey"*

---

## Prompt B — Organized AI-Driven Trade Network

Paste this into Gemini / Nano Banana Pro 2:

```
Cinematic wide-angle abstract visualization of a next-generation global supply chain
as an organized, luminous digital network. Glowing data nodes connected by
soft cyan and white light beams forming clean geometric lattices, translucent
glass-like modular architectural planes floating at varied depths, subtle
volumetric light, gentle particle accents drifting upward, minimal composition
with generous negative space, optimistic calm atmosphere, crisp edges,
holographic UI panels in the midground showing abstract data flows,
deep soft gradient background from pale cyan to soft white,
faint hints of distant connected continents as a dotted mesh,
photorealistic rendering quality with a minimalist futurist aesthetic,
studio lighting from above-left, shallow depth of field,
2.39:1 cinematic aspect ratio, no text, no logos, no watermarks.
```

**Alternates if the first pass is off:**

- If too sterile / too cold → add: *"warm highlight accents on the central node, subtle golden reflections"*
- If too busy → say: *"simplify composition, fewer elements, more negative space, meditative"*
- If palette drift → say: *"dominant palette: pale cyan, soft white, translucent blue, hint of lavender"*

---

## Noise Texture (Task 2 used a procedural one, but you can hand-author)

If you want a hand-authored noise texture instead of the procedural one:

```
Seamless tileable Perlin-style organic noise texture, grayscale only,
soft blobby cloud-like variation, no visible seams at any edge,
512x512 pixels, suitable as a displacement map, no color, no edges, no patterns.
```

Save as `public/images/cinematic/noise.webp`, ≤ 30KB.

---

## QA Checklist Before Saving

For each of A and B:

- [ ] Dimensions are 2048×1152 (or export at higher and downscale)
- [ ] Exported as WebP, quality 82
- [ ] File size ≤ 250KB (compress further if not)
- [ ] No text / logos / watermarks visible
- [ ] Subject is roughly centered (no important detail at extreme edges)
- [ ] Image A palette is dark/warm; Image B palette is light/cool — they feel like opposites
- [ ] Tonality allows a midpoint dissolve to look natural (nothing too stark)

## How to Convert to WebP (macOS)

If you have `cwebp` (from `brew install webp`):
```bash
cwebp -q 82 input.png -o cinematic-a.webp
```

Or with ImageMagick:
```bash
magick input.png -resize 2048x1152 -quality 82 cinematic-a.webp
```

## Where to Drop the Files

```
public/images/cinematic/cinematic-a.webp   # overwrite
public/images/cinematic/cinematic-b.webp   # overwrite
public/images/cinematic/noise.webp         # optional overwrite
```

Then Task 14 in the implementation plan auto-continues.
