# Workflow

The full loop, from a reference channel to a finished short. Every step leaves a file,
so the next step (or the next agent) starts from numbers, not from memory.

## 1. Study a reference, by the numbers

- Pick one channel whose look you want. Take its **20 latest shorts** (not the best-of list).
- Turn each into frames at 30 fps (`tools/frames.py`) and contact sheets (`tools/sheets.py`).
- Measure every frame, not a few you like:
  - brightness and colour per frame (`example/zebra-warships/lookstats.py`)
  - blur map: which parts are sharp (`tools/defocus.py`)
  - face size as a share of the frame height (`tools/heads.py`)
  - motion: how much changes frame to frame (`tools/frames.py` writes it per frame)
- Write the medians into a short table. That table is your target.
- Keep the reference material on your own disk. Never commit someone else's frames.

## 2. Write the rule book

- Turn each measured number into a numbered check (P1, P2, … for principles, C1, C2, … for checks).
- A check says what to measure, the target, and how to fix a miss.
- Ours is in [look-checks.md](look-checks.md). Start from it and replace the numbers.

## 3. Write the script

- Use [script-formula.md](script-formula.md): about 230 words, hook in the first 3.5 s,
  reveal at about 73 % of the words, last sentence lands and stops.
- **True or made up?** Keep one real mechanism at the centre. Mark which sentences are fact,
  which are bent and which are invented, so you know what you are claiming.
- **Hook-image check:** the hook sentence must be drawable as one frame. If you cannot sketch
  it in ten seconds, rewrite the hook.

## 4. Voice and timing

- Record or generate the voice-over, then get word timings (any word-level transcriber).
- Save them as `vo/<name>.words.json`; the example reads captions from it.
- `tools/vofit.py` fits the take to the short format: trims the gaps between words, sets the pace
  (default 3.72 words/s), ends 0.3 s after the last word, and keeps the word timings true.

## 5. Build the scene in three.js

- Start from `example/zebra-warships/`. It already has the look pieces:
  - flat, unlit character cards with an ink outline (`cast.js`)
  - a final grade: colour, vignette and soft focus (`index.html`, `world.js`)
  - camera moves instead of hard cuts: travel between beats, do not cut (`stretch-*.js`)
- One stretch file per part of the script. Each exports what it draws for a given frame.
- Everything is driven by `window.__paint(frame)`, so any frame renders the same every time.

## 6. Render

- `pnpm frames` renders five spread-out test frames (0, 90, 400, 900, 1500) into `out/frames`.
- `pnpm render` renders all 1800 frames and an mp4 (`out/zebra.mp4`), with `vo/voice.mp3` as
  the sound if you add one. Without it the mp4 is silent.

## 7. Validate, fix, repeat

- Run the checks from the rule book on your frames with the same tools you used on the reference.
- Pull exact frames with `tools/stills.py --montage` and look at yours next to the reference.
- `tools/compare.py` scores your video against the reference every frame (difference and motion).
- Fix the biggest miss, render again, measure again. Stop when every check passes.

## Multi-agent setup (optional, faster)

- **Skeleton first:** one agent writes the shared world (scene, camera rig, cast, timing)
  before anyone builds a part. Builders never change the skeleton.
- **One file per builder:** four builders each own one stretch file. Two builders never
  edit the same file, so there are no merge fights.
- **Fresh validator every round:** a new agent with no memory of the build runs the checks
  and reports misses. A validator that watched the build tends to forgive it.
- **Merge, then compare frames:** after merging, render the seams between stretches and
  compare them against the reference, not against each other.
