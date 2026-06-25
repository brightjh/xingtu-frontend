# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A 3D "star map" learning page for junior-high physics. Covers the full curriculum across **15 chapters, 91 knowledge points**, each a star **randomly scattered across a Ghibli-style daytime sky** (a fixed random spot inside a bounded spherical shell — "漫天星星" — so nothing drifts out of click range); the backdrop is a gradient sky dome + fluffy shader clouds + soft sun glow. Clicking a star opens a knowledge panel, then a quiz (2–3 multiple-choice questions with explanations); answering all questions correctly "lights up" that star (it glows and flashes). Pure frontend, progress persisted in the browser.

The knowledge-point data is sourced from `public/all_knowledge.md` (a structured outline of junior-high physics) and compiled into `public/data/knowledge-points.json` via a Python generation script.

## Commands

- `pnpm dev` — start Vite dev server (default http://localhost:5173).
- `pnpm build` — `tsc && vite build`. Type-checks then bundles.
- `pnpm preview` — preview the production build.
- `pnpm exec tsc --noEmit` — **type-check only**. Important: `pnpm dev` runs Vite/esbuild which strips types without checking, so type errors do NOT surface during dev — run this to catch them.
- No test framework is configured.

## Architecture

Four layers wired together in `src/App.tsx` (wrapped in `<DataProvider>` from `DataProvider.tsx`), which holds the only UI state (`selectedId`, `quizMode`):

1. **Data** (`src/data/`) — fully data-driven, loaded from JSON at runtime.
   - `public/data/knowledge-points.json` — **single source of truth** for all 91 knowledge points + 15 chapter definitions. Covers: 测量与运动, 声现象, 光现象, 质量与密度, 力, 力与运动, 压强, 浮力, 简单机械与功, 热学, 电学基础, 欧姆定律与电阻, 电功率与家庭电路, 电与磁, 信息能源与材料. Each point has `summary`, `keyPoints` (3–4 bullet points), and `questions` (2–3 multiple-choice with explanations). Editing this JSON (and refreshing) is the only step needed to add/change content; regenerate from `public/all_knowledge.md` for bulk changes.
   - `DataProvider.tsx` — React Context (`<DataProvider>`) that `fetch`es the JSON on mount and exposes `useData()` returning `{ chapters, knowledgePoints, chapterColor, loading, error }`.
   - `types.ts`: `KnowledgePoint`, `Question`, `ChapterMeta`, `PointProgress`.
   - `knowledgePoints.ts` — retains only type re-exports; all runtime data comes from the JSON file via `useData()`.
   - The JSON URL defaults to `/data/knowledge-points.json`; override with the `VITE_DATA_URL` environment variable.
   - Stars are **scattered randomly within a bounded spherical shell** (see `spiral.ts`), not on a spiral; a point's `order` only seeds its stable position (and the default sort order), so each star keeps the same spot across reloads. `chapter` drives its color — **15 soft pastel sky-palette colors**, one per chapter.

2. **State** (`src/state/useProgress.ts`) — a Zustand store with the `persist` middleware writing to `localStorage` under key `xingtu-progress-v1`.
   - `submitQuiz(id, score, total)` sets `lit = score >= total` (a star lights only when **all** questions are correct) and never un-lits. Returns `{ passed }`.
   - `usePointProgress(id)` is the per-star selector. It returns a module-level `DEFAULT_PROGRESS` constant when the id is missing — this is deliberate to avoid Zustand's "getSnapshot should be cached" warning (do not make it return a fresh object).

3. **3D scene** (`src/three/`) — runs inside the R3F `<Canvas>` in `Scene.tsx`. The scene is a **dreamy daytime sky**: `Scene.tsx` sets a sky-blue clear color (`#87B8E8`), warm-sand fog (`#E0CFC0`, 100–320), and warm-toned lights; R3F's default **ACES filmic tone mapping is ON**. The camera starts pulled back for a **global overview** (stars fill a large sphere), with a wide OrbitControls zoom range (`minDistance` 15 → `maxDistance` 220) so you can pull far out or dive in among the stars. The default view is **near-level** (a slight downward tilt, not bird's-eye), and the polar angle is clamped around the horizon on purpose — don't move it back to a top-down default.
   - `spiral.ts: spiralPosition(i, n)` → **scatters** star `i` at a deterministic random spot inside a spherical shell (`R_MIN`→`R_MAX`, default 6→28), seeded by `i` so each star's position is fixed across renders/reloads. (Name retained for compatibility; no longer a spiral.) `StarsSpiral` just maps the sorted points into a bare `<group>` (no tilt — it's a 3D cloud now).
   - `KnowledgeStar.tsx` — one clickable star rendered as a **4-point extruded sparkle** (`ExtrudeGeometry`). Uses `useData().chapterColor` for the chapter color. Detects `lit` going false→true via a ref and runs a `useFrame` emissive **flash** pulse (one-shot). Hover scales it up + bumps emissive; a `drei <Html>` label shows on hover *or* when lit.
   - `GalaxyBackground.tsx` — a thin wrapper that mounts `<SkyDome />` + `<GhibliClouds />` (the old `drei <Stars>` / rotating point-cloud background is gone).
   - `SkyDome.tsx` — custom shader sphere: horizon→zenith gradient (`#E0CFC0`→`#5A94C8`) with a soft sun glow; the horizon color slowly breathes via HSL.
   - `GhibliClouds.tsx` — 18 cloud meshes from custom GLSL (value-noise + fbm) for fluffy Ghibli edges, scattered around the scene; the whole group drifts.
   - `SpiralPath.tsx` — **obsolete & not mounted**; it used to connect consecutive (spiral-ordered) stars with a glowing tube. With stars now randomly scattered it no longer makes sense — left in place but unused. Also migrated to `useData()`.

4. **UI overlay** (`src/ui/`) — plain DOM, absolutely positioned over the canvas. `Hud` (progress + legend, uses `useData().chapters` + `useData().knowledgePoints`), `KnowledgePanel` (info + "开始做题", uses `useData().chapterColor`), `QuizPanel` (per-question reveal + scoring, uses `useData().chapterColor`). The 3D star's `onClick` → `App.onSelect(id)`; `Canvas onPointerMissed` → closes the panel.

### The selective-bloom technique (do not "fix" the magic numbers)

This is the core of the lit/unlit visual and is spread across `Scene.tsx` + `KnowledgeStar.tsx`:

- `<Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.06} intensity={1.3}>` in `EffectComposer`.
- The scene runs ACES tone mapping, but a star's material is `meshStandardMaterial` with **`toneMapped={false}`** so its emissive bypasses tone compression; its albedo is the chapter color lerped toward a warm brown (`#5A4D3E`), and the chapter color is the `emissive`.
- Unlit: `emissiveIntensity ≈ 0.42` → final color stays below 1 → no bloom. Lit: `emissiveIntensity ≈ 1.2` (+ up to ~6 during flash) → color exceeds 1 → blooms. The soft additive glow sphere (and the lit spiral path, if mounted) likewise set `toneMapped={false}`.
- So lighting a star = raising its `emissiveIntensity` past the threshold; nothing else. Don't set `toneMapped={true}` or raise unlit intensities, or unlit stars will bloom too.

## Gotchas

- The dev server emits a `THREE.Clock deprecated, use THREE.Timer` console warning — it comes from R3F internals, not this code; harmless.
- This project was scaffolded manually (not via `create-vite`), so there is no `.gitignore` or README. Dependencies were resolved by `pnpm add`, so versions in `package.json` are what was actually installed.
- WebGL is required; the R3F `<Canvas>` won't render without a GPU context (in headless Chrome use `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader-webgl`).
