import samp24 from "../assets/sounds/24.mp3";
import samp36 from "../assets/sounds/36.mp3";
import samp48 from "../assets/sounds/48.mp3";
import samp60 from "../assets/sounds/60.mp3";
import samp72 from "../assets/sounds/72.mp3";
import samp96 from "../assets/sounds/96.mp3";

export default class Player {
  constructor() {
    this.context = null;
    this.now = null;
    this.dac = null;
    this.buffer = null;
    this.envelope = null;
    this.destination = null;
    this.bufferCache = {};
    this.buffers = null;
    this.pitchBufferMapping = {};
    this.samples = {};
  }

  init() {
    if (this.context) {
      return;
    }
    /* setup */
    this.context = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext)();
    this.now = () => this.context.currentTime;
    this.dac = () => this.context.destination;
    this.envelope = [0, 0.707, 1, 0.707, 0];
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.dac());
    this.buffers = {};

    const samplerMap = {
      24: samp24,
      36: samp36,
      48: samp48,
      60: samp60,
      72: samp72,
      96: samp96,
    };

    Object.entries(samplerMap).forEach(async ([key, value]) => {
      const url = value;
      const response = await fetch(url);
      const audioData = await response.arrayBuffer();
      const buffer = await this.context.decodeAudioData(audioData);
      this.buffers[key] = buffer;
    });

    const keys = Object.keys(samplerMap);

    [...Array(88).keys()].forEach((p) => {
      const pitch = p + 21;
      let minDist = 99;
      let closest = null;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const diff = Math.abs(pitch - key);
        if (diff < minDist) {
          minDist = diff;
          closest = key;
        }
        if (minDist === 0) {
          break;
        }
      }
      this.pitchBufferMapping[pitch] = { bufferIndex: closest, playbackRate: 2 ** ((pitch - closest) / 12) };
    });
  }

  getPitchBuffer(pitch) {
    const { bufferIndex, playbackRate } = this.pitchBufferMapping[pitch];
    return [this.buffers[bufferIndex], playbackRate];
  }

  playNote(pitch) {
    const now = this.now();
    const sample = this.context.createBufferSource();
    const [buffer, playbackRate] = this.getPitchBuffer(pitch);

    sample.buffer = buffer;
    sample.playbackRate.value = playbackRate;
    console.log(buffer);

    const noteDur = 2.0;

    const gain = this.context.createGain();
    const amp = 1.0;
    gain.gain.setValueAtTime(amp, now);

    const env = this.context.createGain();
    const envDuration = noteDur * (1 / playbackRate);
    env.gain.setValueAtTime(0.0, now);
    env.gain.setValueCurveAtTime(this.envelope, now, envDuration * 0.999);

    sample.connect(env);
    env.connect(gain);
    gain.connect(this.masterGain);

    sample.start(now, 0, noteDur);
  }

  async setBuffer(url) {
    const response = await fetch(url);
    const audioData = await response.arrayBuffer();
    buffer = await this.context.decodeAudioData(audioData);
    this.buffer = buffer;
  }

  playGrain(dur, inskip = 0.0, pan = 0.0, amp = 1.0, playRate = 1.0, reverbMix = 0.0, garbageCollect = true) {
    const now = this.now();
    const grain = this.context.createBufferSource();
    grain.buffer = this.buffer;
    grain.playbackRate.value = playRate;

    const grainDur = Math.min(dur, Math.max(0.001, grain.buffer.duration - inskip));
    const grainInskip = Math.max(0, Math.min(inskip, grain.buffer.duration - grainDur));

    const grainEnv = this.context.createGain();
    grainEnv.gain.setValueAtTime(amp, now);

    const gain = this.context.createGain();
    const envDuration = grainDur * (1 / playRate);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.setValueCurveAtTime(this.envelope, now + 0.001, envDuration * 0.99);

    const dryMix = this.context.createGain();
    dryMix.gain.setValueAtTime(1.0 - reverbMix, now);
    dryMix.connect(this.masterGain);

    const panner = this.context.createStereoPanner();
    panner.pan.value = pan;

    grain.connect(grainEnv);
    grainEnv.connect(gain);
    gain.connect(panner);
    panner.connect(dryMix);

    const wetMix = this.context.createGain();
    wetMix.gain.setValueAtTime(reverbMix, now);
    panner.connect(wetMix);
    wetMix.connect(this.reverb);

    grain.start(now, grainInskip, grainDur);
    if (garbageCollect) {
      grain.stop(now + envDuration + 0.1);
      setTimeout(() => {
        grain.disconnect();
        grainEnv.disconnect();
        gain.disconnect();
        panner.disconnect();
        dryMix.disconnect();
        wetMix.disconnect();
      }, (envDuration + 0.15) * 1000);
    }
  }
}
