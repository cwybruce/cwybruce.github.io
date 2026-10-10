# Asset Credits / 解剖及音频资产署名

## HRA Allen Human Brain (Male), v1.4

Current cranial-envelope rendering uses HRA as the single primary exterior and connected cerebellum/brainstem. `ANATOMY_PLACEMENT` uniformly scales the normalized atlas/signals by 1.025 at Y +1.24. CC0 decorative skin now uses an explicit affine root fit [1.32,1.14,1.20] at [-.13,-.10,-.05]: width, height and anterior/posterior extent are fitted to contain the separate brain specimen and support fuller face/jaw shading. The skin's original proportions are therefore artistically adjusted; this is not an unchanged-proportion or medical registration claim. All original GLB bytes, vertex buffers and triangles remain unchanged, and HRA proportions remain uniform. Shared brain depth follows its original final transform. Earlier uniform head 1.04, .94/Y1.33 and MRI-primary descriptions below document prior releases. The actual skin-ray regression checks 708 named parcel extrema with a .025 scene-unit lateral ray margin; it is sampled coverage, not a proof for every vertex or triangle.

- **Creator / source:** Human Reference Atlas (HRA) 3D Reference Object Library, derived from the Allen Human Reference Atlas – 3D (2020), licensed by HRA under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
- **Source URL:** https://cdn.humanatlas.io/digital-objects/ref-organ/brain-male/v1.4/assets/3d-allen-m-brain.glb
- **Official catalog:** https://humanatlas.io/3d-reference-library
- **NIH 3D catalog:** https://3d.nih.gov/entries/3DPX-020960
- **CC BY 4.0 license:** https://creativecommons.org/licenses/by/4.0/
- **Published v1.4 file SHA-256:** `c97d7d0b9ff0baebbdec5566fa7b08d789195ef965e0bd04cf743a8d683882db`
- **File size:** 11,982,812 bytes.
- **Transformation:** Runtime recentering, uniform scale and cranial-vault placement. The refined V4 scene fits the normalized atlas at scale 0.94 and Y +1.33 into the separately aligned head; no triangles or original binary bytes are changed. No procedural fake anatomical mesh is substituted. A colorless nearest-surface depth pass shares the original static mesh geometry; selected major left deep structures use restrained additive X-ray shading. Original names identify brainstem and connective structures. Fixed narrative branches terminate at atlas vertices, with decorative cerebellar/brainstem shader hatching. The multiscale starfield and 3D filaments are original code. These are not measured fibers or downloaded imagery. Cyan/magenta shader colors, artist-created signals, transparent shell and scattering are *our visualization*, not part of the scientific atlas.

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
- **Derived render layers:** Detached eye/oral components receive a lower transparency weight; thin face/neck lines are sampled from the CC0 mesh topology. Chapter views use the loaded HRA models; head outlines use CC0 triangles. Current orthogonal HUD tissue is supplemented by the public CC0 MRI specimen described below. No reference-image crop is used.
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
## Supplementary specimen tissue and MRI cuts (2026-10-10)

Anatomy diagnostics found that the threshold derivative below is not a complete segmented cortical surface: it has anterior/superior holes and disproportionate lower posterior lobes. Current default HRA rendering does not display this derivative exterior. The unchanged GLB remains loadable for explicit diagnostic comparison; genuine voxel HUD sections remain in use. It is not renamed a segmented cortex, and its historical anisotropic baked fit is not claimed to be removed by a uniform root transform. No new specimen or asset license was introduced in this round.

- Edlow, Brian L., et al. *7 Tesla MRI of the ex vivo human brain at 100 micron resolution* (2019), [Dryad dataset](https://doi.org/10.5061/dryad.119f80q), [Dryad-deposited Zenodo mirror](https://zenodo.org/records/5132897).
- Original file: `Synthesized_FLASH25_downsampled_500um.nii.gz`, 66,605,139 bytes. MD5 `b1a8583ea3c2c1b14fead76ea03d02f2`; SHA256 `e2511e9a77aa6fac0d0be750f8227c9b445bdc64ab188ede75288e7b70f8a7a6`.
- License: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), confirmed in Dryad dataset API (`license=https://spdx.org/licenses/CC0-1.0.html`) and Zenodo record metadata (`license.id=cc-zero`). This is a publicly released ex-vivo specimen, not the visitor's scan.
- Local derivative: `assets/models/mri-flash-tissue.glb`, 10,280,752 bytes, SHA256 `aa6248769d9fce2bfaac09fa7939b8a4c3052e23c289dd00c7080dcba1bb26bb`. The real 500 µm intensity volume supplies the detailed 3D surface (425,674 triangles); the website renders this geometry with WebGL, not a screenshot. `assets/scans/mri-flash-{coronal,sagittal,axial}.png` are genuine voxel sections, framed at 216×280 for the HUD.
- Reproducible offline derivative: `scripts/derive_mri_tissue.py` with NumPy, SciPy, nibabel, scikit-image and Pillow. Canonical RAS axes are mapped to the renderer; intensity threshold 14, largest connected component, Gaussian sigma 1.15 voxel, marching step 2, explicit outward winding. Original large data and offline tools remain ignored in `output/`; visitors require neither Python nor those tools.
- Alignment with HRA and the CC0 head is illustrative; these are different specimens. Bounds are fitted for composition, without a claim of clinical registration. HRA remains the region/deep-anatomy context and the complete real 3D fallback if the optional tissue asset fails. Narrative lighting, fibers and pink HUD markers are original illustration, not measured neural activity.
