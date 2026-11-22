# Viral animated shorts with Claude Code

A Claude Code skill that makes 60-second animated story shorts: flat cartoon characters,
built in three.js, rendered frame by frame to an mp4. Install it, and Claude Code makes
shorts in this style for you. Free, MIT, no sign-up.

## What's inside

| folder | what |
|---|---|
| `SKILL.md` | the skill Claude Code loads: the steps from reference to finished short |
| `docs/workflow.md` | the full loop: measure a reference, rule book, script, voice, build, render, validate, multi-agent setup |
| `docs/script-formula.md` | the script formula, measured from 20 shorts of a top story channel (word count, hook shape, beats, reveal position) |
| `docs/look-checks.md` | the rule book: numbered look principles and checks with targets |
| `example/zebra-warships/` | a complete 60 s short in three.js to start from |
| `tools/` | measuring scripts: every-frame stats, contact sheets, stills, blur map, face size, compare, voice-over fit |

No Blender, no Remotion, no downloaded 3D models. Everything on screen is drawn in code.

## Install

```bash
git clone https://github.com/Florenz23/viral-animated-shorts ~/.claude/skills/viral-animated-shorts
```

Then in Claude Code: *"Make an animated short about …"*, or `/viral-animated-shorts`.

You need:
- Node 18+ and pnpm (or npm)
- Python 3 with `numpy`, `pillow` and `scipy`
- ffmpeg
- Google Chrome (the renderer drives it through Playwright)

## Render the example

```bash
cd ~/.claude/skills/viral-animated-shorts/example/zebra-warships
pnpm install
pnpm frames    # five test frames into out/frames
pnpm render    # all 1800 frames + out/zebra.mp4
```

The example ships without a voice-over. Put your own at `vo/voice.mp3` and `pnpm render`
adds it; without it the mp4 is silent. Captions come from `vo/zebra-v2.words.json`.

## License

MIT, see [LICENSE](LICENSE).
