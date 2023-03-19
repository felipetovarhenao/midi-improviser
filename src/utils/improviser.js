import { Midi } from "@tonejs/midi";
import MarkovModel from "./markov";

export default class Improviser {
  /*
	Markov MIDI generator 
	*/

  PITCHNAMES = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };

  constructor(memory = 2) {
    this.markov = new MarkovModel(memory);
    this.PPQ = 480;
    this.maxSubdivisions = [16, 24];
    this.quantumUnit = this.PPQ * 4;
    this.forbiddenNumerators = [7, 11, 13, 15, 17, 19, 21, 22, 23, 24];
    this.allowedDurations = this.getAllowedDurations();
  }

  reset() {
    this.markov.reset();
  }

  pitchToMidi(pitch) {
    return this.PITCHNAMES[pitch];
  }

  getMemory() {
    return this.markov.order;
  }

  setMemory(num) {
    this.markov.setOrder(num);
  }

  midiToPitch(midi) {
    return Object.entries(this.PITCHNAMES).forEach((key, value) => {
      if (value === midi) {
        return key;
      }
    });
  }

  getTranspositionInterval(key, scale) {
    if (!key || !scale) {
      return 0;
    }
    const midiVal = this.pitchToMidi(key);
    const target = scale == "major" ? 0 : -3;
    const a = target - midiVal;
    const b = a + 12;
    return Math.abs(a) < Math.abs(b) ? a : b;
  }

  getAllowedDurations() {
    /* whole note in ticks */
    const wholeNote = this.PPQ * 4;

    /* initialize duration array */
    const durations = [wholeNote];

    /* get possible subdivisions */
    this.maxSubdivisions.forEach((den) => {
      for (let num = 0; num < den; num++) {
        /* exclude uncommon numerators */
        if (this.forbiddenNumerators.includes(num)) {
          continue;
        }
        /* get base duration and multiples of it */
        const baseDuration = Math.round(wholeNote * (num / den));

        /* get smallest non-zero duration */
        if (baseDuration > 0) {
          this.quantumUnit = Math.min(this.quantumUnit, baseDuration);
        }
        for (let i = 0; i < 4; i++) {
          const duration = baseDuration * 2 ** i;
          if (!durations.includes(duration)) {
            durations.push(duration);
          }
        }
      }
    });
    durations.sort((a, b) => a - b);
    return durations;
  }

  getNearestDuration(ticks, allowZero = true) {
    const differences = this.allowedDurations.map((x) => Math.abs(ticks - x));
    const i = differences.indexOf(Math.min(...differences));
    const quantized = this.allowedDurations[i];
    return quantized == 0 && !allowZero ? this.allowedDurations[1] : quantized;
  }

  quantize(time) {
    return Math.round(time / this.quantumUnit) * this.quantumUnit;
  }

  async parse(files) {
    const sequence = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      const midi = await Midi.fromUrl(url);
      const PPQRatio = this.PPQ / midi.header.ppq;
      const notes = [];
      const keySignature = midi.header.keySignatures[0];
      const transp = this.getTranspositionInterval(keySignature?.key, keySignature?.scale);
      for (let t = 0; t < midi.tracks.length; t++) {
        /* get midi track */
        const track = midi.tracks[t];

        /* reject if it's percussion */
        if (track.instrument.percussion) {
          continue;
        }
        /* process track notes */
        for (let n = 0; n < track.notes.length; n++) {
          /* get note */
          const note = track.notes[n];

          /* adjust time and duration to PPQ */
          const time = this.quantize(Math.round(note.ticks * PPQRatio));
          const duration = this.quantize(Math.round(note.durationTicks * PPQRatio));

          /* normalize key to C/Am */
          const pitch = note.midi + transp;

          /* quantize duration */
          const durationTicks = this.getNearestDuration(duration, false);

          /* include event in sequence */
          notes.push([time, pitch, durationTicks]);
        }
      }
      /* sort notes by start time and pitch  */
      notes.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

      for (let n = 0; n < notes.length - 1; n++) {
        /* get note */
        const note = notes[n];

        /* get onset start times of current and next note */
        const start = note[0];
        const nextStart = notes[n + 1][0];

        const pitch = note[1];
        const duration = note[2];

        /* quantize deltas and durations */
        const deltaTicks = this.getNearestDuration(nextStart - start);

        /* add note to sequence */
        sequence.push([pitch, deltaTicks, duration]);
      }
      URL.revokeObjectURL(url);
    }
    return sequence;
  }

  async train(files) {
    this.reset();
    const sequence = await this.parse(files);
    this.markov.build(sequence);
  }

  ticksToSeconds(ticks, tempo) {
    return (60 / (this.PPQ * tempo)) * ticks;
  }

  async generate(maxNotes = 100, tempo = 90, key = "C", scale = "major") {
    /* intialize midi */
    var midi = new Midi();

    /* set tempo */
    midi.header.setTempo(tempo);
    midi.header.keySignatures = [
      {
        key: key,
        scale: scale,
      },
    ];

    /* add track */
    const track = midi.addTrack();

    /* get transposition interval */
    const transp = this.getTranspositionInterval(key, scale);

    /* initialize start time in ticks  */
    let ticks = 0;

    /* This function will be called with every new Markov prediction */
    const stateToMidiNote = (state) => {
      const [pitch, deltaTicks, durationTicks] = state;
      const duration = this.ticksToSeconds(durationTicks, tempo);

      /* prevent notes being added to same time point */

      track.addNote({
        midi: pitch - transp,
        ticks: ticks,
        duration: duration,
        velocity: 0.5,
      });
      ticks += deltaTicks;
    };
    /* bind callback to instance */
    stateToMidiNote.bind(this);
    this.markov.run(maxNotes, stateToMidiNote);
    this.applyLegato(midi);
    return midi.toArray();
  }

  applyLegato(midi) {
    const noteEndings = {};
    midi.tracks.forEach((track, i) =>
      track.notes.forEach((note, j) => {
        const lastEnding = noteEndings[note.midi];
        if (lastEnding?.end > note.ticks) {
          const trackId = lastEnding.track;
          const noteId = lastEnding.note;
          const newDuration = note.ticks - midi.tracks[trackId].notes[noteId].ticks;
          midi.tracks[trackId].notes[noteId].durationTicks = newDuration > 0 ? newDuration : this.allowedDurations[1];
        }
        noteEndings[note.midi] = {
          track: i,
          note: j,
          end: note.ticks + note.durationTicks,
        };
      })
    );
  }
}
