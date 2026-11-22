# Look validator: principles, snippets, checks

What rebuilding reference scenes 1:1 taught us about getting the cartoon look
right, written as rules. Three parts: principles (why), snippets (how),
checks (what a validator measures). Every rule names the evidence behind it.
Numbers are from two study rebuilds of single reference scenes and an
80-frame sample of the target look. Swap in your own reference's numbers.

## 1. Principles

**P1. Characters are unlit flat drawings; all light lives in the set.**
A warm tint on the character cards moved head colours out of range, broke the
tracker and sent the fit 24 px off. Untinted cards in a lit set matched.

**P2. A lit scene has four separate jobs: key light, shadow colour, grade,
vignette.** Shadows are blue and soft, not darker sand. A separate shadow
layer in blue did what dimming the fill could not. First set build: colour
error 24.7 of 255; after tuning each job from its own number: 11.5 to 14.

**P3. Every shot has its own light.** In one 10 s reference, brightness goes
from 0.30 to 0.52 between shots, saturation 0.27 to 0.45, warm/cool split
−0.03 to +0.31. A single global grade cannot match that. The close-up of the
hero prop is the brightest and warmest shot.

**P4. Warm highlights, cool shadows, never black.** Darkest 2% of pixels sits
at 0.08 to 0.16 brightness, highlights are cream to gold, shadows violet-blue.

**P5. Blur is a depth cue, used per shot.** Wide establishing shots are sharp
everywhere; character shots blur the background; foreground objects may be
blurred too. Our first blur was twice too strong. Measured on every frame of a
reference short's first 30 s (2026-11-20, `tools/defocus.py`): depth
is on in about 28 % of frames, only on medium shots, close-ups and inserts. The
background reads 2.1–2.5 px and **barely grows as the shot tightens** (mediums
about 2.1, close-ups 2.4–2.7). Blur follows real distance: a chair right behind
the main character stays sharp. The character is always the sharpest thing in the frame.

**P6. Outlines are thick and on everything.** Head outline about 8 px and
limbs about 11 px when a head is 190 px wide (720 px frame). Ours were 2 px
too thin for two runs.

**P7. Faces switch, bodies move.** Expressions change in one frame; arms and
bodies move over 5 to 10 frames; an idle character holds still.

**P8. Feet stand on the ground on purpose.** A ground plane cut 20 px off the
legs and no body measure saw it.

**P9. Proportions are measured, not guessed.** Head 26% of frame width in a
two-shot, body about 0.75 head widths wide and 1.0 tall, legs 1.25 to 1.4.

**P10. Solve the camera from measured points, never by eye.** Track a head
(or 5 landmarks on a prop) in the reference, then solve distance from size,
side position from x, height from y. Three shots went from visibly wrong to
within 1–3 px of head position and 1–2% of head width in one step each.
Searching on overlap alone cheats by zooming in.

**P11. Level camera plus lens shift.** Wide shots keep columns vertical: the
camera looks level and the picture is shifted up or down. A tilted camera could
not match the hall (5.6 px error with the shift).

**P12. Close-ups are shot long.** The hero prop close-up fitted a 16° lens
from 3.4 m, the main character's close-up a 10° lens from 11 m. A wide lens up close
distorts proportions away from the reference.

**P13. Every shot is staged for its own camera.** The same vessel sits lower
and nearer in the over-the-lid shot than physics allows, is hidden in the
close-ups, and shows one ornament in the story shots but eight in the reveal.
Characters stand where the frame needs them, not where the set says. Build
per-shot placement in from the start.

**P14. Grade to targets, per shot.** With the light roughly placed, a
per-shot gain, saturation and shadow lift brought brightness, contrast and
saturation within 0.02 of the reference in all 7 shots in two passes. First
render was 0.05–0.15 too dark and 0.10–0.20 too saturated with crushed blacks.

**P15. Silhouette before surface.** On the hero prop, overlap went 0.41 →
0.59 by reshaping masses; texture work moved it under 0.01.

**P16. Gloss needs specular.** Gold needs a Phong highlight on a scale map;
toon shading alone reads as yellow plastic.

**P17. Outlines are weighted.** A head reads 6 px on the lit side and 17 px
on the shadow side at 260 px wide. A second ink copy offset down-right behind
the face does it; a uniform stroke looks like vector art.

**P18. Faces sit off-centre toward the look direction**, and laughing is
built from parts one beat apart (lids, squint, shut eyes with grin, tears 6
frames later, then the bend over 10 frames), not one switch.

**P19. Split the build by part, with one contract.** Set, props and
characters were built in parallel against one coordinate brief. What broke:
the brief's sizes (head 0.55 m, vessel 2.3 m) were guesses, so parts fitted
alone did not fit together until placement was solved on screen. Measure
shared sizes in the reference before briefing.

**P20. Solve the camera from something that does not move.** A fixed set
feature (a crest on a chair) gives the lens per frame in one analytic step:
it landed within about 2 px in every frame. Fitting the camera to a character
mixes his acting into the camera.

**P21. Camera first, then staging, then acting.** Characters get one fixed
offset per staging (close-up, wide), never a per-frame correction, or the fit
eats the performance. Offsets live in world units: in screen pixels they
scaled wrong during a push-in (heads 140 px off).

**P22. Transitions are tricks, not one camera.** A 0.4 s push would need the
camera to travel 24 m in 4 frames to match the reference's sizes. It is a
zoom hidden in defocus and motion blur. Sub-frame blur: 16 samples for a fast
push; 8 left visible ghost copies.

**P23. The grade must never touch the ink, and never clip a face.** A shadow
lift turned every outline grey: zero pixels counted as ink, line distance 69
px. Protecting the darks brought it to 18 px. A gain of 1.3 clipped faces to
pure white; the target's faces sit at 242 to 247, slightly cool. Brightness
comes from the set lights, not the grade.

**P24. A laugh is a sequence.** Target: the head rises and grows about 10%
just before the laugh, rocks toward one side for 8 frames, then doubles over
to the other side. A bystander first startles (ring eyes, blush, leans in) and
laughs only later.

**P25. Measure brightness and colour by area before detail.** A 3x4 grid of
blurred cells (brightness and colour intensity, ours minus target) found what
the detail measures missed: the wide shot's sides were 0.20 too dark and 0.16
too saturated, because the set behind them was the wrong material (dark purple
wall, a 3 m red carpet) where the target shows light warm stone and a 1.6 m
runner. Re-dressing that one shot halved the area error (brightness 0.059 →
0.022, intensity 0.064 → 0.034); no grade could have done it.

**P26. The camera's height is a fact in the picture.** A lens solved from one
anchor fixes size and position, not height. The floor's vanishing point puts
the target camera about 1 m above ours in the wide; the pull-out cranes up
while it zooms out.

**P27. The caption is part of the look.** Target: one word group at a time,
no animation, a heavy geometric sans (Montserrat ExtraBold fits: box within
1–5 px on three words), 45 px at 720 wide, white fill over a 10 px black
outline drawn behind it, a small drop shadow, centre x 359, baseline 917.
Its timing follows the voice: a new group every 4–20 frames.

**P28. Motion blur follows the target's sharpness, not physics.** A fast push
with a whole-frame shutter left ghost copies; the target is near sharp in the
middle of the push. A 0.7-frame shutter brought edge sharpness to within
about 25% of the target on most push frames.

**P29. A camera solved from one anchor can be right in one shot and wrong in
the next.** The crest-based lens matched the chair in the wide, but in the
close-up our chair came out 1.19x too large, so the drape and pinnacles at the
frame edges were missing. Each staging needs its own check against a large
static area (the chair's width), not only the anchor.

**P30. Count the person on screen, not the person in the shot.** "Is a character
in frame" said 62 % against the references' 73–80 %, and the obvious fix was to
put the painter into the empty fleet wides (example/zebra-warships). But a figure in a wide is a face of
1–2 % of frame height and fills nothing. What the references hold is a medium
face: at least 4 % of frame height on 67–78 % of frames (ours was 55). Face area per frame, median: references 1.9–2.2 %, ours
0.8 %. Our mean matched (2.5 %) only because the giant close-ups averaged out
the empty stretches. So: fill the gaps with a face near the lens (over the
shoulder, a group in the foreground), not with a figure in the distance, and end
the first 30 s on a face — every reference does. Aim for the middle of the
references, not above them.

## 2. Snippets

Where to find each one: `example/zebra-warships/` (world.js, cast.js, index.html).

- ink for 3D: inverted hull plus crease lines
- 3-step toon ramp material
- canvas-painted texture helper
- character card: unlit drawing on a plane with an alpha-tested shadow
- blue shadow layer (`ShadowMaterial` just above the ground)
- post pass: depth blur, grade, vignette with per-shot uniforms
- outline-safe canvas shape (rebuild the path before stroking)
- hand with four fingers and a thumb
- camera keys with lens shift (`setViewOffset`) and per-shot light/grade table
- head tracker (`tools/heads.py`) and camera solve from feet position and size
- loft (superellipse sections along a spine) for organic props; Voronoi scale map
- weighted head outline (offset ink copy); eye kinds; tears and sweat
- http render harness (ES modules do not load from file://): `render.mjs`
- caption overlay: 2D canvas over the WebGL canvas, stroke behind fill
- per-shot set dressing switch (canopy width, runner width, wall material)

## 3. Checks (what the validator runs on our own shots)

A check is a number with a pass range. Ranges come from the target look.

| # | check | how | pass |
|---|---|---|---|
| C1 | brightness, contrast | mean and std of luminance | 0.30–0.52, 0.15–0.21 |
| C2 | no black, no clipping | 2nd and 98th percentile | 0.08–0.16, 0.79–0.97 |
| C3 | saturation | mean HSV saturation | 0.27–0.47 |
| C4 | warm light, cool shadow | (R−B) of brightest fifth minus darkest fifth | above +0.10 on lit shots |
| C5 | vignette | centre minus edge luminance | 0.05–0.18 |
| C6 | depth blur | `tools/defocus.py` on every frame: blur sigma per 40 px cell (sharp under 1.4 px, soft over 2.5). On character shots, "rest" is the median of the cells that aren't sharp | character shots: the subject's cells are sharp, rest 2.0–2.8 px, the 95th-percentile cell ≤ 3.7; wides ≥ 90 % sharp cells; depth on about 20–40 % of frames (reference: 28 %, rest 2.24, p95 cell ≤ 3.7 in 99 % of frames). The reading saturates: past about 4 px the background has no edges left, its cells drop out, and the number falls again, so a shot that reads sharp while the eye sees mush is over-blurred. Check the `--maps` overlay |
| C7 | shots differ | range of C1/C3 across the shots of one video | brightness range ≥ 0.10 |
| C8 | outline width | run length across limbs and head edge | 7–12 px at a 190 px head (scale with head width); shadow side ≈ 2.8× lit side (P17) |
| C9 | every shape has its outline | ink pixels ÷ expected from the rig | above 0.9 |
| C10 | feet on the ground | lowest ink row of each character vs ground line | within 3 px |
| C11 | faces switch | frames between two expressions | 1 |
| C12 | holds | frame-to-frame change of an idle character | below noise |

| C13 | head place and size | cream-blob tracker per frame vs target | x, y within 8 px, width within 5% |
| C14 | verticals | column base and top x in wide shots | lean below 5% of height |
| C15 | hero prop silhouette | hue-band mask overlap with the target | above 0.6 |
| C16 | region colour | mean RGB of named patches (probe the patch first) | within 25 per channel |
| C17 | outline weight per side | dark run left and right of the head | shadow side ≥ 1.5× lit side |
| C18 | no tweened faces | face parameters between keys | no fractional values |
| C19 | shadow coverage | share of floor in shadow | below 50% (90% = the roof casts) |
| C20 | modules load | page ready over http, no console errors | pass |

| C21 | ink survives the grade | dark-pixel share inside character boxes vs target | 0.6–1.4× target |
| C22 | faces not clipped | 99th percentile of face pixels | below 250 |
| C23 | the camera is live | read back the camera the page used at 3 frames | values differ as keyed |
| C24 | camera vs static anchor | tracked set feature position and size | within 3 px, 3% |
| C25 | area brightness and colour | 3x4 grid of blurred cells, ours − target | mean below 0.03 each, no cell beyond 0.08 |
| C26 | caption box | white-glyph bbox per frame vs target | within 5 px; word changes on the same frame |
| C27 | push sharpness | 99th percentile of edge strength per frame | within 30% of target |
| C28 | figure-ground | background luma just outside a character's outline minus its ink luma | ≥ 0.2 on ≥ 80% of the outline (a punchline frame lost 58–64% of the painter's outline against dark dazzle stripes) |
| C29 | whip continuity | per-frame camera translation over a whip or travel | one direction, one eased hump (no reversals, no stall-then-burst); the next subject enters from the side the whip moves toward |
| C30 | whip blur | multi-image comb peak in whip frames | ≤ 0.07 (sharp-frame level): sample spacing ≤ ~1.5 px at peak speed, never visible copies (measure with ±0.5/255 dither: 8-bit banding on smeared frames reads .06–.09 at the lowest lag without it) |
| C31 | nothing near the lens | share of frame covered by geometry closer than the subject during a move | 0: the camera never flies through a card, curtain, funnel or prop |
| C32 | medium faces | `tools/heads.py` every 0.5 s over the first 30 s: height of the largest face ÷ frame height (check the sheet by eye: it misses moustached or monocled faces, purple faces, and ring-eyed ones, and can take clocks for faces) | a face ≥ 4 % of frame height on 67–78 % of samples; median face area per frame ≥ 1.9 %; a face in the last 5 s; no stretch over 6 s without people |

Lessons about measuring itself:

- A measure only covers what its mask covers. Add one per part.
- Numbers say how far off; a 4x crop says what is wrong. Do both each round.
- Never read positions off a scaled picture.
- Check all shot parts, not five frames of one.
- A fit that converges is not proof. One end-of-line comment swallowed the
  camera code; every fit ran against a frozen camera and still reported
  shrinking residuals. Read back what the renderer used before fitting.
