// Driving mission scenes. Coordinates are in a 400x400 SVG viewBox, overhead view, north = up.
// Lanes (drive on the right): northbound x=220, southbound x=180, eastbound y=220, westbound y=180.
// `from` poses sit visibly on the approach roads so the intro screen shows every car.
// A pose is [x, y, headingDeg] with 0 = facing north, 90 = east, 180 = south, -90 = west.
// NPC car colors (yellow, teal, pink) are never offered as player accent colors.
// Every round is a clean, unambiguous right-of-way situation tied to a verified rule.

const P = {
  // stop-line poses for each approach
  southStop: [220, 282, 0], // player coming up from the south, heading north
  westStop: [118, 220, 90], // car from the west heading east
  eastStop: [282, 180, -90], // car from the east heading west
  northStop: [180, 118, 180], // car from the north heading south
};

const straightNorth = [[220, 282, 0], [220, -50, 0]];
const straightEast = [[118, 220, 90], [450, 220, 90]];
const straightWest = [[282, 180, -90], [-50, 180, -90]];
const straightSouth = [[180, 118, 180], [180, 450, 180]];
const leftFromSouth = [[220, 282, 0], [220, 222, 0], [212, 196, -35], [190, 182, -75], [170, 180, -90], [-50, 180, -90]];

export const SCENARIOS = [
  {
    id: 'm01',
    code: 'MISSION 01',
    title: 'FOUR-WAY STOP',
    category: 'row',
    rules: ['ROW-1', 'ROW-2'],
    blurb: 'Three cars. Four stop signs. One right answer each time.',
    rounds: [
      {
        id: 'm01-r1',
        rule: 'ROW-1',
        title: 'Who arrived first?',
        setup: 'The yellow car stopped at its line BEFORE you got there. You both want to go straight.',
        cars: [
          { id: 'yellow', color: '#FFD23F', from: [34, 220, 90], stop: P.westStop, arriveDelay: 0 },
          { id: 'you', player: true, from: [220, 366, 0], stop: P.southStop, arriveDelay: 900, signal: null },
        ],
        choices: [
          'Wait for the yellow car to go, then go',
          'Go now — you are on its right',
          'Go now — you are going straight',
          'Wave it through and wait for the intersection to be totally empty',
        ],
        answer: 0,
        resolve: [
          { car: 'yellow', path: straightEast },
          { car: 'you', path: straightNorth },
        ],
        explain: 'The driver who arrives first goes first. The yellow car stopped before you, so it has the right of way.',
        why: 'The "yield to the right" rule is only a tiebreaker for drivers who arrive at the same time. Arrival order comes first. Option 4 is wrong too: once it is your turn, go — being unpredictable causes crashes.',
      },
      {
        id: 'm01-r2',
        rule: 'ROW-1',
        title: 'Dead heat',
        setup: 'You and the teal car stop at the SAME moment. It is on your right. Both going straight.',
        cars: [
          { id: 'teal', color: '#14B8A6', from: [366, 180, -90], stop: P.eastStop, arriveDelay: 0 },
          { id: 'you', player: true, from: [220, 366, 0], stop: P.southStop, arriveDelay: 0 },
        ],
        choices: [
          'Yield — the car on your right goes first',
          'Go — you are on the left, so you go first',
          'Whoever is braver goes first',
          'Both go at once — your paths are different',
        ],
        answer: 0,
        resolve: [
          { car: 'teal', path: straightWest },
          { car: 'you', path: straightNorth },
        ],
        explain: 'When two drivers arrive at the same time, yield to the driver on your right. The teal car is on your right, so it goes first.',
        why: 'Your paths cross in the middle of the intersection, so you cannot go together. The Maryland manual says to yield to the driver on your right at a four-way intersection with stop signs.',
      },
      {
        id: 'm01-r3',
        rule: 'ROW-2',
        title: 'Turning left',
        setup: 'You are signaling LEFT. The pink car across from you stops at the same moment and is going straight.',
        cars: [
          { id: 'pink', color: '#FF5FA2', from: [180, 34, 180], stop: P.northStop, arriveDelay: 0 },
          { id: 'you', player: true, from: [220, 366, 0], stop: P.southStop, arriveDelay: 0, signal: 'left' },
        ],
        choices: [
          'Let the oncoming straight car go, then turn left',
          'Turn first — you are both at the same time',
          'Turn first — your signal is on',
          'Back up so it has more room',
        ],
        answer: 0,
        resolve: [
          { car: 'pink', path: straightSouth },
          { car: 'you', path: leftFromSouth },
        ],
        explain: 'A left turn crosses oncoming traffic, so you yield to the car going straight. Then make your turn.',
        why: 'Turn signals announce your plan; they do not give you the right of way. The Maryland manual lists opposing traffic as a driver you must yield to when turning left.',
      },
    ],
  },
];

export const scenarioById = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
