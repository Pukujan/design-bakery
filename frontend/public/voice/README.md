# Voice call hold lines

`connecting-*.m4a` play while a voice call connects, and `nudge-*.m4a` are the reminders for a quiet call (`src/app/modules/copilot/holdAudio.ts`). All speak in the first person, as AI Pujan. They are the
agent's own voice (Pocket TTS, stack `english-fast`), rendered from the speech server on the MacBook Pro:

```bash
curl -s -X POST http://127.0.0.1:8799/tts -H 'content-type: application/json' \
  -d '{"text":"Almost there. Thanks for waiting.","stack":"english-fast","lang":"en"}' > clip.pcm
# 16-bit mono PCM at 24000 Hz: wrap in a WAV, then: afconvert -f m4af -d aac -b 48000 clip.wav clip.m4a
```

If the wording changes, change `LINES` in `holdAudio.ts` to match and re-render the clip.
