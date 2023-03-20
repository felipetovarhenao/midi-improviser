import Chance from "chance";

export default class MarkovModel {
  constructor(order = 1) {
    this.order = order;
    this.transitionTable = {};
    this.numStates = 0;
    this.stateWeights = {};
    this.chance = new Chance();
    this.maxReinforcement = 2 / 3;
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

  getTransitionTableCopy() {
    return JSON.parse(JSON.stringify(this.transitionTable));
  }

  run(numIter = 100, lambda = false, choiceReinforcement = 0.0) {
    const matrix = this.getTransitionTableCopy();
    let current = this.choose(this.stateWeights);

    const sequence = [];

    for (let i = 0; i < numIter; i++) {
      const transitions = matrix[current];

      /* possible state transitions */
      const possibleStates = Object.keys(transitions);
      const numStates = possibleStates.length;

      /*  stop generating if not states are found */
      if (!numStates) {
        break;
      }

      /* make prediction */
      const nextState = this.choose(transitions);
      const prediction = JSON.parse(current)[0];

      /* 
      Choice reinforcement consists of allowing the transition probability matrix to be updated
      during the same run, based on being chosen every time. 
      Every time a state is chosen, the probability to transition to that
      same state is increased, thus reinforcing the selection of that state in future opporunities.
      */
      if (numStates > 1 && choiceReinforcement > 0) {
        /* get normalized probability for chosen state  */
        let sum = 0;
        possibleStates.forEach((key) => (sum += transitions[key]));
        const probRatio = transitions[nextState] / sum;

        /* increase probability if below threshold */
        if (probRatio < this.maxReinforcement) {
          matrix[current][nextState] += (numStates - 1) * choiceReinforcement;
        }
      }

      /* execute callback if given, else push prediction to output sequence */
      lambda ? lambda(prediction) : sequence.push(prediction);

      /* update current state */
      current = nextState;
    }

    return sequence;
  }
}
