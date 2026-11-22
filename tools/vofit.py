# python3 tools/vofit.py <raw.mp3> <raw.words.json> <out.mp3> [wps=3.72] [gap=0.12] [tail=0.3] [lufs=-17]
# Fit a voice-over to the short format, keeping the word timings true.
# Eleven v4 ignores `speed` (measured: 2.6 words/s at 0.7 and at 1.2), so pace is set here:
#   1. every gap between words is cut down to `gap` s (the reference has ~1.25 s of pauses in 30 s)
#   2. the whole take is time-stretched (pitch kept) to `wps` words/s over the voiced span
#   3. it starts on the first word, ends `tail` s after the last, at `lufs` integrated
# Writes <out>.mp3 and <out>.words.json (same shape as vo/<shot>.words.json).
import sys, json, subprocess
raw, wj, out = sys.argv[1:4]
wps, gap, tail, lufs = [float(x) for x in (sys.argv[4:8] + ['3.72', '0.12', '0.3', '-17'][len(sys.argv[4:8]):])]
W = json.load(open(wj))
# The alignment hides pauses (a word's end runs on into the silence after it: measured 0 s of
# word gaps where the audio had 6.9 s of silence), so pauses are found in the audio itself.
import re
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw],
                           capture_output=True, text=True).stdout)
e = subprocess.run(['ffmpeg', '-i', raw, '-af', f'silencedetect=n=-35dB:d={gap}', '-f', 'null', '-'],
                   capture_output=True, text=True).stderr
S = list(zip([float(x) for x in re.findall(r'silence_start: ([\d.]+)', e)],
             [float(x) for x in re.findall(r'silence_end: ([\d.]+)', e)] + [dur]))
# keep everything but each silence's middle: half the allowed gap stays on either side
keep, t = [], max(0.0, W[0]['start_sec'] - 0.02)
for s, x in S:
    if x <= t: continue
    if x >= dur - 0.01:                         # trailing silence: keep `tail`
        keep.append([t, min(dur, max(s, t) + tail)]); t = dur; break
    keep.append([t, max(t, s + gap / 2)]); t = x - gap / 2
if t < dur: keep.append([t, dur])
def remap(t):                                   # raw time -> time after the cuts
    acc = 0
    for a, b in keep:
        if t <= b: return acc + max(0, t - a)
        acc += b - a
    return acc
cut_len = sum(b - a for a, b in keep)
voiced = remap(W[-1]['end_sec'])                # first word starts at 0
k = (len(W) / wps) / voiced                     # new length / old length
# (aselect with a long between() chain silently kept everything; atrim + concat does not)
parts = ''.join(f'[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[p{i}];' for i, (a, b) in enumerate(keep))
fc = (parts + ''.join(f'[p{i}]' for i in range(len(keep))) +
      f'concat=n={len(keep)}:v=0:a=1,atempo={1 / k:.4f},loudnorm=I={lufs}:TP=-1.5:LRA=7[o]')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-filter_complex', fc, '-map', '[o]',
                '-ar', '44100', '-b:a', '128k', out], check=True)
NW = [{'word': w['word'], 'start_sec': round(remap(w['start_sec']) * k, 3), 'end_sec': round(remap(w['end_sec']) * k, 3)} for w in W]
json.dump(NW, open(out.rsplit('.', 1)[0] + '.words.json', 'w'), indent=1)
print(f'{len(W)} words  raw voiced {W[-1]["end_sec"] - W[0]["start_sec"]:.1f} s -> cut {voiced:.1f} s -> x{1 / k:.3f} -> '
      f'{NW[-1]["end_sec"]:.2f} s voiced, {cut_len * k:.2f} s file')
