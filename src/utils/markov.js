import Chance from "chance";

export default class MarkovModel {
  constructor(order = 1) {
    this.order = order;
    this.transitionTable = {};
    this.numStates = 0;
    this.stateWeights = {};
    this.chance = new Chance();
  }

  reset() {
    this.transitionTable = {};
    this.numStates = 0;
    this.stateWeights = {};
  }

  setOrder(order) {
    this.reset();
    this.order = order;
  }

  build(sequence) {
    const numFrames = sequence.length - this.order;
    let prevState = null;

    for (let i = 0; i < numFrames; i++) {
      /* create stringified state */
      const state = JSON.stringify(sequence.slice(i, i + this.order));

      /* intialize transition row */
      if (this.transitionTable[state] === undefined) {
        this.transitionTable[state] = {};
        this.stateWeights[state] = 0;
        this.numStates++;
      }

      if (prevState) {
        if (this.transitionTable[prevState][state] === undefined) {
          this.transitionTable[prevState][state] = 1;
        } else {
          this.transitionTable[prevState][state]++;
        }
      }
      this.stateWeights[state]++;
      prevState = state;
    }
  }

  choose(transitions) {
    const states = Object.keys(transitions);
    const weights = Object.values(transitions);
    return this.chance.weighted(states, weights);
  }

  run(numIter = 100, lambda = false) {
    let current = this.choose(this.stateWeights);
    const sequence = [];
    for (let i = 0; i < numIter; i++) {
      const transitions = this.transitionTable[current];
      if (!Object.keys(transitions).length) {
        break;
      }
      const nextState = this.choose(transitions);
      const prediction = JSON.parse(current)[0];
      lambda ? lambda(prediction) : sequence.push(prediction);
      current = nextState;
    }
    return sequence;
  }
}
