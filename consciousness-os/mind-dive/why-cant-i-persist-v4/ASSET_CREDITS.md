# Asset Credits / 解剖及音频资产署名

## HRA Allen Human Brain (Male), v1.4

- **Creator / source:** Human Reference Atlas (HRA) 3D Reference Object Library, derived from the Allen Human Reference Atlas – 3D (2020), licensed by HRA under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
- **Source URL:** https://cdn.humanatlas.io/digital-objects/ref-organ/brain-male/v1.4/assets/3d-allen-m-brain.glb
- **Official catalog:** https://humanatlas.io/3d-reference-library
- **NIH 3D catalog:** https://3d.nih.gov/entries/3DPX-020960
- **CC BY 4.0 license:** https://creativecommons.org/licenses/by/4.0/
- **Published v1.4 file SHA-256:** `c97d7d0b9ff0baebbdec5566fa7b08d789195ef965e0bd04cf743a8d683882db`
- **File size:** 11,982,812 bytes.
- **Transformation:** Runtime recentering, uniform scale and cranial-vault placement. The refined V4 scene fits the normalized atlas at scale 0.84 and Y +1.30 into the separately aligned head; no triangles or original binary bytes are changed. No procedural fake anatomical mesh is substituted. Cyan/magenta shader colors, artist-created signals, transparent shell and scattering are *our visualization*, not part of the scientific atlas.

**Suggested citation (HRA v1.4):** Schlehlein H., Herr B., Quardokus E., Bueckle A., Börner K. et al. *Human Reference Atlas 3D Reference Object Library*, v1.4, accessed 2026-10-09.

This is a story visualization of habit loops, **not actual EEG, fMRI, an individual's brain, or a clinical diagnostic**. The luminous fiber tracts, signal intensities, regional activation and shell are artistic illustrations.

## Three.js / esbuild

- Three.js 0.186.1 — Copyright 2010–2026 three.js contributors, MIT license: https://github.com/mrdoob/three.js/blob/master/LICENSE
- esbuild 0.28.2 — Copyright Evan Wallace, MIT license: https://github.com/evanw/esbuild/blob/master/LICENSE.md

## V4 CC0 MakeHuman / MPFB realistic head silhouette

- **Source:** Innerscene 3D Parts Library, *Human base mesh with editable 53-bone rig* (MakeHuman / MPFB derived).
- **URL:** https://www.innerscene.com/tools/library/3d-parts/human-base-mesh-with-editable-53-bone-rig-8e7c8ab1
- **License:** Creative Commons Zero 1.0 (CC0), commercial usage permitted without attribution. https://creativecommons.org/publicdomain/zero/1.0/
- **Downloaded GLB checksum (SHA-256):** `7135e03b6259e970458deff3e0458610914d7c35164cae12611101361e4a5749`
- **File size:** 4,994,640 bytes.
- **Transformation:** The single head/body mesh is loaded into Three.js and spatially cropped at the upper neck with a transparent material. The original binary is retained. The HRA anatomical brain is a separate reference model inside the head; alignment is a visual illustration, **not registered medical anatomy**.
- **Derived render layers:** Detached eye/oral components receive a lower transparency weight; thin face/neck lines are sampled from the CC0 mesh topology. Small HUD views and cutaways are rendered from the loaded HRA/CC0 models in a temporary WebGL context. These are model-based illustrations, not measured MRI or reference-image crops.
- **Fallback:** When the CC0 asset cannot be downloaded, a deterministic procedural head and neck mesh remains available to avoid a blank scene. Do not label procedural fallback as a scanned head.

Verified source page on 2026-10-09: the Innerscene listing explicitly dedicates this model to CC0 and permits modification and redistribution, including commercial use. The whole-body bounding box includes forward feet; V4 corrects a 1.415 normalized-unit sagittal offset to align the cranium with the brain. This is an artist's illustrative alignment, not patient-specific medical registration.

## Local Kokoro Mandarin narration

- Model authors/source: hexgrad, Kokoro-82M v1.1-zh — https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh
- Model license: Apache License 2.0, as declared in the official model card.
- Pinned model revision: `01e7505bd6a7a2ac4975463114c3a7650a9f7218`.
- Verified weight SHA-256: `b1d8410fa44dfb5c15471fd6c4225ea6b4e9ac7fa03c98e8bea47a9928476e2b`.
- Code: https://github.com/hexgrad/kokoro (Apache-2.0); local Kokoro/Misaki 0.9.4.
- Auditions use official Mandarin male voice packs `zm_010` and `zm_011`.
  These are synthesized stock model voices, with no custom cloning or uploaded
  person's recording. Model and voice packs are cached locally, not website assets.
- The new stereo sweeps, pulses and bells are original mathematical synthesis in
  `scripts/generate_effects.py`; no reference soundtrack or external sound sample
  was used. The existing piano score is original synthesis in `generate_score.py`.
- The user selected B (`zm_011`) for the final 36-second narration. The website
  plays generated MP3 files, with narration separate from the original music and
  effects mix; no speech model or paid API is required in the browser.
- Audition receipts: `docs/audio/2026-10-09-auditions.md`; final generation and
  mastering receipts: `docs/audio/2026-10-09-v4/README.md`.
