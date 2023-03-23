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

  constructor(memory = 2, predictability = 1) {
    this.markov = new MarkovModel(memory);
    this.PPQ = 480;
    this.predictability = predictability;
    this.maxSubdivisions = [16, 20, 24];
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

  setPredictability(val) {
    this.predictability = val;
  }

  getPredictability() {
    return this.predictability;
  }

  setMemory(num, reset = true) {
    this.markov.setOrder(num, reset);
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
    const b = (a + 12) % 12;
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

  async parse(files) {
    const sequence = [];
    for (let i = 0; i < files.length; i++) {
      const midi = await files[i];
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
          const time = Math.round(note.ticks * PPQRatio);

          /* normalize key to C/Am */
          const pitch = note.midi + transp;

          /* include event in sequence */
          notes.push([time, pitch]);
        }
      }
      /* sort notes by start time and pitch  */
      notes.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

      /* lastDelta refers to the inter-onset duration 
      between the current note and the last chord */
      let lastDelta = 0;
      let currentChord = [];
      let currentChordIndices = [];

      for (let n = 0; n < notes.length - 1; n++) {
        /* get note */
        const note = notes[n];

        /* get onset start times of current and next note */
        const start = note[0];
        const nextStart = notes[n + 1][0];

        const pitch = note[1];

        /* quantize deltas and durations */
        const deltaTicks = this.getNearestDuration(nextStart - start);

        /* since all tracks are merged, avoid unisons */
        if (deltaTicks === 0 && currentChord.includes(pitch)) {
          continue;
        }

        /* include in array for future reference */
        currentChord.push(pitch);
        const eventID = sequence.length;
        currentChordIndices.push(eventID);

        /* add note to sequence */
        sequence.push([pitch, deltaTicks, lastDelta, deltaTicks]);

        if (deltaTicks > 0) {
          currentChordIndices.forEach((i) => (sequence[i][3] = deltaTicks));
          lastDelta = deltaTicks;
          currentChord = [];
          currentChordIndices = [];
        }
      }
    }
    return sequence;
  }

  async train(files) {
    this.reset();
    const sequence = await this.parse(files);
    this.markov.build(sequence);
  }

  async trainBase(files) {
    const order = this.getMemory();
    this.setMemory(this.predictability);
    await this.train(files);
    this.setMemory(order, false);
  }

  getPitchQuantizer(key, scale) {
    const pitchDeltas =
      scale === "major"
        ? // pitch shifting per pitch class in major scale
          [0, 1, 0, 1, 0, 0, -1, 0, 1, 0, 1, 0]
        : // pitch shifting per pitch class in minor scale
          [0, -1, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0];

    const transp = this.getTranspositionInterval(key, scale);

    const table = {};
    for (let i = 0; i < pitchDeltas.length; i++) {
      const id = (i + transp + 12) % 12;
      table[id] = pitchDeltas[i];
    }

    return (pitch) => pitch + table[(pitch + 12) % 12];
  }

  async generate(maxNotes = 100, tempo = 90, key = "C", scale = "major", choiceReinforcement = 0.0, enforceKey = false) {
    /* intialize midi */
    var midi = new Midi();
    const pitchQuantizer = enforceKey && this.getPitchQuantizer(key, scale);

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

    /* initialize variables to collect chord info */
    const chordSizes = {};
    let maxChordSize = 0;
    let chordSize = 0;
    let numNotes = 0;

    /* This function will be called with every new Markov prediction */
    const stateToMidiNote = (state) => {
      const [pitch, deltaTicks] = state;
      const transPitch = pitch - transp;
      track.addNote({
        midi: enforceKey ? pitchQuantizer(transPitch) : transPitch,
        ticks: ticks,
        durationTicks: this.PPQ,
        velocity: 0.5,
      });

      chordSize++;

      /* if the next note start a new chord (i.e., has a different onset), add chord size information to array and reset chord size */
      if (deltaTicks > 0) {
        chordSizes[ticks] = chordSize;
        maxChordSize = Math.max(chordSize, maxChordSize);
        chordSize = 0;
      }
      numNotes++;
      ticks += deltaTicks;
    };

    /* bind callback to instance */
    stateToMidiNote.bind(this);
    this.markov.run(maxNotes, stateToMidiNote, choiceReinforcement);
    midi = this.cleanMidi(midi, chordSizes, maxChordSize);
    return midi;
  }

  async generateRecursively(maxNotes = 100, tempo = 90, key = "C", scale = "major", choiceReinforcement = 0.0, enforceKey = false) {
    let midi;
    for (let i = 0; i < this.getMemory(); i++) {
      const improv = new Improviser(i + this.predictability);
      if (i === 0) {
        improv.markov.transitionTable = JSON.parse(JSON.stringify(this.markov.transitionTable));
        improv.markov.stateWeights = JSON.parse(JSON.stringify(this.markov.stateWeights));
      } else {
        await improv.train([midi]);
      }
      midi = await improv.generate(maxNotes, tempo, key, scale, choiceReinforcement, enforceKey);
    }
    return midi.toArray();
  }

  chordSizeToVelocity(time, chordSizes, maxChordSize) {
    /* returns a normalized velocity value based on chord size */
    return ((chordSizes[time] || maxChordSize / 2) / maxChordSize) * 0.5 + 0.3;
  }

  pitchToVelocity(pitch, velRange = 0.125) {
    /* returns a normalized velocity value based on pitch range */
    const theta = Math.min(1, Math.max(0, (pitch - 21) / 88)) * Math.PI * 2;
    return Math.cos(theta) * velRange + (1.0 - velRange);
  }

  /* 
  Applies legato duration and variable velocity to every note in MIDI file.
  */
  cleanMidi(midi, chordSizes, maxChordSize) {
    /* Iterate through every track */
    for (let trackID = 0; trackID < midi.tracks.length; trackID++) {
      const track = midi.tracks[trackID];

      /* initialize variables to keep track of chord and onset */
      let currentChord = [];
      let currentOnset = track?.notes[0]?.ticks;
      let vel = this.chordSizeToVelocity(currentOnset, chordSizes, maxChordSize);
      /* Iterate through every note in track */
      for (let noteID = 0; noteID < track?.notes?.length; noteID++) {
        const note = track.notes[noteID];

        /* modify notes in current chord before onset changes */
        if (note.ticks !== currentOnset) {
          /* get legato duration for current chord to avoid sustain overlap */
          const legatoDuration = note.ticks - currentOnset;

          /* get velocity based on chord size and smoothen based on previous velocity */
          vel = vel * 0.75 + this.chordSizeToVelocity(currentOnset, chordSizes, maxChordSize) * 0.25;

          /* to every note, apply legato duration and assign velocity value based on context */
          currentChord.forEach((note) => {
            /* update duration */
            midi.tracks[note.trackID].notes[note.noteID].durationTicks = legatoDuration;

            /* update velocity */
            const pitch = midi.tracks[note.trackID].notes[note.noteID].midi;
            midi.tracks[note.trackID].notes[note.noteID].velocity = vel * this.pitchToVelocity(pitch);
          });

          /* reset chord and update onset */
          currentChord = [];
          currentOnset = note.ticks;
        }

        /* keep reference of MIDI track and note id*/
        currentChord.push({
          noteID: noteID,
          trackID: trackID,
        });
      }
    }
    return midi;
  }
}
