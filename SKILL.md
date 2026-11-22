---
name: viral-animated-shorts
description: Make a 60-second animated story short (flat cartoon characters, three.js, rendered frame by frame) from a script formula and a measured look. Use when the user wants to make an animated short, a story short in a cartoon style, or to copy the look of a reference shorts channel by the numbers.
---

# Viral animated shorts

You build a ~60 s vertical (720x1280, 30 fps) animated short in three.js and render it to
an mp4. Everything is code: no Blender, no Remotion, no downloaded 3D models.

Files in this skill (paths relative to this file):
- `docs/workflow.md`: the full loop. Read it first.
- `docs/script-formula.md`: how to write the script (about 230 words, hook, beats, reveal at ~73 %).
- `docs/look-checks.md`: the rule book of numbered look principles (P) and checks (C).
- `example/zebra-warships/`: a finished short to start from (cast, world, stretches, render).
- `tools/`: measuring scripts (frames, sheets, stills, blur map, face size, compare, voice fit).

## Steps

1. **Reference.** Ask the user for a reference channel or video they want the look of.
   They keep the downloads on their own disk. Measure it with `tools/` (see workflow step 1)
   and write the medians into a target table in the user's project, not in this skill.
2. **Script.** Write it with `docs/script-formula.md`. Check: hook drawable as one image,
   about 230 words, reveal at 60–90 % of the words, last sentence lands and stops, one real
   mechanism at the centre (mark fact / bent / invented).
3. **Voice.** The user records or generates the voice. Get word timings into
   `vo/<name>.words.json`; fit the pace with `tools/vofit.py`.
4. **Build.** Copy `example/zebra-warships/` into the user's project, then replace the
   stretches with the new story. Keep the look pieces: flat unlit character cards with ink
   outlines, the final grade, camera travel instead of hard cuts. Every frame is drawn by
   `window.__paint(frame)`.
5. **Render.** `pnpm install`, then `pnpm frames` for test frames, `pnpm render` for the mp4.
6. **Validate.** Run the checks in `docs/look-checks.md` on the frames with the same tools.
   Fix the biggest miss, render, measure again, until every check passes.

For bigger builds, use the multi-agent setup at the end of `docs/workflow.md`: skeleton
first, one file per builder, a fresh validator every round.

## Rules

- Never commit someone else's frames, clips or transcripts into the user's repo.
- Measure every frame, not a few chosen ones. Numbers decide, not taste.
- Render a handful of frames before a full render.
