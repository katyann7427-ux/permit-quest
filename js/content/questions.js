// Practice question bank. These are ORIGINAL practice questions written from the
// verified rules — they are NOT official MVA exam questions.
// Authoring convention: the correct choice is listed FIRST (answer: 0).
// The UI shuffles choices at display time.
import { ruleById } from './curriculum.js';

const Q = (id, rule, prompt, choices, explain) => ({ id, rule, category: ruleById[rule].category, prompt, choices, answer: 0, explain });

export const QUESTIONS = [
  // SIGNS
  Q('q-sgn-1a', 'SGN-1', 'An eight-sided (octagon) sign always means…', ['Stop completely', 'Yield', 'School zone', 'Railroad ahead'], 'The octagon shape is used only for STOP signs.'),
  Q('q-sgn-1b', 'SGN-1', 'A round yellow sign warns you of…', ['A railroad crossing ahead', 'A school zone', 'A no-passing zone', 'A hospital'], 'Round = advance warning of a railroad crossing.'),
  Q('q-sgn-1c', 'SGN-1', 'A five-sided (pentagon) sign means…', ['School zone or school crossing', 'Stop ahead', 'No passing', 'Work zone'], 'Pentagon signs mark school zones and crossings.'),
  Q('q-sgn-1d', 'SGN-1', 'A diamond-shaped sign tells you…', ['A hazard or special condition is ahead', 'You must stop', 'Where services are', 'The speed limit'], 'Diamonds are warning signs — be ready to slow down.'),
  Q('q-sgn-2a', 'SGN-2', 'Orange signs mean…', ['Construction or maintenance work area', 'Recreation area', 'Hospital ahead', 'Guide information'], 'Orange is the work-zone color. Pay close attention.'),
  Q('q-sgn-2b', 'SGN-2', 'Blue signs show…', ['Services like food, gas and rest areas', 'Warnings', 'Directions and distances', 'Parks'], 'Blue = motorist services.'),
  Q('q-sgn-2c', 'SGN-2', 'Fluorescent yellow-green signs are used for…', ['School, pedestrian and bicycle warnings', 'Work zones', 'Emergency incidents', 'Speed limits'], 'Yellow-green flags kids, walkers and bikes.'),
  Q('q-sgn-2d', 'SGN-2', 'Brown signs point to…', ['Recreation and cultural areas', 'Hospitals', 'Interstate exits', 'Detours'], 'Brown = parks, recreation and cultural sites.'),
  Q('q-sgn-3a', 'SGN-3', 'A white rectangular "SPEED LIMIT 40" sign is…', ['A rule you must obey', 'Just a suggestion', 'A warning sign', 'A guide sign'], 'White vertical rectangles state rules — speed limits are law.'),
  Q('q-sgn-3b', 'SGN-3', 'Horizontal rectangular signs usually…', ['Give guide information', 'Mean stop', 'Warn of curves', 'Mark school zones'], 'Vertical rectangles are usually rules; horizontal ones usually guide.'),

  // SIGNALS
  Q('q-sig-1a', 'SIG-1', 'You may turn right on a red light when…', ['You stop completely, no sign forbids it, and you yield to all traffic and pedestrians', 'Traffic is light', 'You slow down first', 'Never in Maryland'], 'Full stop first, then yield to everyone.'),
  Q('q-sig-1b', 'SIG-1', 'At a red light with no stop line, you stop…', ['Before the crosswalk', 'In the crosswalk', 'Even with the light pole', 'Anywhere in the intersection'], 'No stop line → stop before the crosswalk. No crosswalk → before the intersection.'),
  Q('q-sig-1c', 'SIG-1', 'A flashing red light means…', ['Stop completely, then go when clear — like a stop sign', 'Slow down', 'The light is broken; ignore it', 'Speed up and clear the intersection'], 'Flashing red = treat it as a stop sign.'),
  Q('q-sig-2a', 'SIG-2', 'A steady yellow light means…', ['The light is changing to red — stop if you can do so safely', 'Speed up to make it', 'Go — you have right of way', 'Stop no matter what'], 'Yellow gives time to stop safely. Too close to stop? Continue carefully.'),
  Q('q-sig-2b', 'SIG-2', 'A flashing yellow light means…', ['Slow down and proceed with caution', 'Stop completely', 'Turn only', 'The road is closed'], 'Flashing yellow = caution.'),
  Q('q-sig-3a', 'SIG-3', 'Yellow center lines separate…', ['Traffic moving in opposite directions', 'Lanes going the same way', 'Bike lanes', 'Parking spaces'], 'Yellow = opposite directions. White = same direction.'),
  Q('q-sig-3b', 'SIG-3', 'A solid yellow line on YOUR side of the center means…', ['Do not pass', 'Passing allowed', 'Lane ends', 'Bus lane'], 'Solid on your side = no passing for you.'),
  Q('q-sig-3c', 'SIG-3', 'At a double solid yellow line, you MAY…', ['Turn left across it into a driveway', 'Pass slow cars', 'Pass if the road is straight', 'Make a lane change'], 'No passing either way — but left turns across it are allowed.'),
  Q('q-sig-3d', 'SIG-3', 'Double solid white lines between lanes mean…', ['No lane changes', 'Lane changes encouraged', 'Opposite-direction traffic', 'Passing zone'], 'Double solid white = stay in your lane.'),

  // RIGHT OF WAY
  Q('q-row-1a', 'ROW-1', 'At a four-way stop, who goes first?', ['The driver who arrived first', 'The biggest vehicle', 'The driver going straight', 'The driver on the left'], 'First to arrive, first to go.'),
  Q('q-row-1b', 'ROW-1', 'You and another car arrive at a four-way stop at the same time. The other car is on your right. You should…', ['Let the car on your right go first', 'Go first', 'Honk and go', 'Back up'], 'Same time? Yield to the driver on your right.'),
  Q('q-row-1c', 'ROW-1', 'You reach a four-way stop. A car on your left has already stopped. Who goes first?', ['The car on your left — it arrived first', 'You — you are on the right', 'Whoever is faster', 'Neither; wait for a police officer'], 'Arrival order beats the right-hand rule.'),
  Q('q-row-2a', 'ROW-2', 'You are turning left at a green light. An oncoming car is going straight. You should…', ['Yield and wait for a safe gap', 'Turn before it arrives', 'Flash your lights and go', 'Turn — green means go'], 'Left turns yield to oncoming traffic.'),
  Q('q-row-2b', 'ROW-2', 'An oncoming motorcycle approaches as you wait to turn left. You should…', ['Yield to the motorcycle', 'Turn — motorcycles can stop fast', 'Turn if it is far enough to see', 'Honk to warn it'], 'Always yield to oncoming motorcycles when turning left.'),
  Q('q-row-3a', 'ROW-3', 'A pedestrian is in an unmarked crosswalk at an intersection with no signal. You must…', ['Stop for the pedestrian', 'Continue — the crosswalk is not marked', 'Honk', 'Drive around them'], 'Unmarked crosswalks count. Stop for them.'),
  Q('q-row-3b', 'ROW-3', 'The car in the next lane has stopped at a crosswalk. You should…', ['Not pass it — stop too', 'Pass carefully', 'Change lanes to go around', 'Honk'], 'Never pass a car stopped at a crosswalk.'),
  Q('q-row-3c', 'ROW-3', 'You are turning right on a green light and a pedestrian is crossing. You must…', ['Yield to the pedestrian', 'Go — you have the green', 'Speed up to finish the turn', 'Wave them back'], 'Turning on green still means yielding to pedestrians.'),

  // TURNS
  Q('q-trn-1a', 'TRN-1', 'When should you turn on your turn signal?', ['Before you reach the turn', 'As you start to turn', 'Only if cars are behind you', 'After the turn'], 'Signal before the turn so others know your plan.'),
  Q('q-trn-1b', 'TRN-1', 'Where U-turns are legal, you should…', ['Signal left, yield to oncoming traffic, then turn into the outside lane', 'Turn quickly before traffic arrives', 'Use the shoulder', 'Turn into the inside lane'], 'Yield first, then use the outside (right-hand) lane.'),
  Q('q-trn-2a', 'TRN-2', 'Changing lanes inside an intersection is…', ['Something you should not do', 'Fine if you signal', 'Required for turns', 'Allowed when traffic is light'], 'Pick your lane before the intersection.'),
  Q('q-trn-2b', 'TRN-2', 'Normally you drive…', ['To the right of the center of the road', 'In the center of the road', 'On the left side', 'Wherever is smoothest'], 'Keep right of center unless passing or directed otherwise.'),
  Q('q-trn-3a', 'TRN-3', 'When you park along a road with a curb, you should…', ['Park as close to the curb as possible', 'Leave three feet from the curb', 'Park half on the sidewalk', 'Park in the travel lane'], 'Stay as far from traffic as you can.'),
  Q('q-trn-3b', 'TRN-3', 'Before opening your car door after parking, you should…', ['Check mirrors and traffic', 'Unbuckle and jump out', 'Honk', 'Turn on the high beams'], 'Look for cars and bikes before opening the door.'),
  Q('q-trn-3c', 'TRN-3', 'Every time you park, you should…', ['Set the parking brake', 'Leave the engine running', 'Turn the wheels straight out', 'Leave the keys in'], 'Parking brake on, car in park, keys with you.'),

  // SPEED
  Q('q-spd-1a', 'SPD-1', 'The speed limit is 45 mph, but it is raining hard. You should…', ['Drive slower than 45', 'Drive exactly 45', 'Drive 50 to get home faster', 'Follow the car ahead closely'], 'Drive at a speed that is safe for conditions.'),
  Q('q-spd-1b', 'SPD-1', 'Speeding increases…', ['Both crash risk and crash force', 'Only fuel use', 'Nothing if the road is empty', 'Your reaction time'], 'Faster = less time to react and harder hits.'),
  Q('q-spd-2a', 'SPD-2', 'Where no limit is posted, the speed limit in a Maryland business district is…', ['30 mph', '25 mph', '35 mph', '40 mph'], 'Maryland default: 30 mph in business districts.'),
  Q('q-spd-2b', 'SPD-2', 'Unless posted otherwise, the limit on a divided highway outside a business or residential district is…', ['55 mph', '50 mph', '65 mph', '70 mph'], 'Maryland default: 55 mph on divided highways.'),
  Q('q-spd-2c', 'SPD-2', 'Unless posted otherwise, the limit on an undivided highway outside a business or residential district is…', ['50 mph', '40 mph', '55 mph', '60 mph'], 'Maryland default: 50 mph on undivided highways.'),
  Q('q-spd-3a', 'SPD-3', 'The MVA recommends a minimum following distance of…', ['3 to 4 seconds', '1 second', '2 car lengths', '10 feet per 10 mph'], 'At least 3–4 seconds in ideal conditions.'),
  Q('q-spd-3b', 'SPD-3', 'When following a bus or delivery van that stops often, leave…', ['4 to 5 seconds or more', '2 seconds', '1 car length', 'No extra space'], 'Frequent stoppers need extra room.'),
  Q('q-spd-3c', 'SPD-3', 'Most rear-end crashes are caused by…', ['Following too closely', 'Bad headlights', 'Driving too slowly', 'Flat tires'], 'Tailgating is the main cause.'),

  // HIGHWAY
  Q('q-hwy-1a', 'HWY-1', 'After passing, it is safe to return to your lane when…', ['You can see both headlights of the passed car in your rear-view mirror', 'You are one car length ahead', 'You have signaled for 2 seconds', 'The other driver flashes lights'], 'Both headlights in the mirror = enough space.'),
  Q('q-hwy-1b', 'HWY-1', 'Passing is NOT allowed…', ['Within 100 feet of an intersection or railroad crossing', 'On a straight road with a broken line', 'During the day', 'When you signal first'], 'Also no passing on hills, blind curves or the shoulder.'),
  Q('q-hwy-1c', 'HWY-1', 'Another car is passing you. You should…', ['Keep your speed — do not speed up', 'Speed up', 'Brake hard', 'Move toward the center line'], 'Yield and let them complete the pass.'),
  Q('q-hwy-2a', 'HWY-2', 'The acceleration lane on a highway ramp is for…', ['Matching the speed of highway traffic', 'Stopping to look', 'Passing slow cars', 'Parking'], 'Get up to the flow of traffic, then merge.'),
  Q('q-hwy-2b', 'HWY-2', 'You miss your exit on the highway. You should…', ['Continue to the next exit', 'Back up on the shoulder', 'Stop and wait', 'Make a U-turn'], 'Never stop or back up on a highway.'),
  Q('q-hwy-3a', 'HWY-3', 'You are driving slower than other highway traffic. Use…', ['The right lane', 'The left lane', 'The shoulder', 'Any lane'], 'Slower traffic keeps right.'),
  Q('q-hwy-3b', 'HWY-3', 'You may stop on a highway shoulder…', ['Only for a breakdown or emergency', 'To check your phone', 'To let others pass', 'Any time'], 'Shoulders are for emergencies — flashers on.'),

  // SHARE
  Q('q-shr-1a', 'SHR-1', 'In Maryland, when passing a bicycle you must leave at least…', ['3 feet', '1 foot', '2 feet', '6 inches'], 'At least 3 feet.'),
  Q('q-shr-1b', 'SHR-1', 'Under Maryland law, a bicycle is…', ['A vehicle with the right to use the road', 'A pedestrian', 'Not allowed on roads', 'Only allowed on sidewalks'], 'Bikes are vehicles and follow traffic signals.'),
  Q('q-shr-2a', 'SHR-2', 'A school bus ahead stops with red lights flashing. You must stop at least…', ['20 feet away', '5 feet away', '50 feet away', '100 feet away'], 'Stop at least 20 feet from the bus.'),
  Q('q-shr-2b', 'SHR-2', 'On a two-lane road, a school bus coming toward you stops with red lights flashing. You…', ['Stop', 'Keep going — it is on the other side', 'Slow to 20 mph', 'Honk and pass'], 'Undivided road: both directions stop.'),
  Q('q-shr-2c', 'SHR-2', 'You do NOT have to stop for a school bus with flashing red lights when…', ['It is on the other side of a physical barrier on a divided road', 'You are in a hurry', 'No children are visible', 'It is a weekend'], 'Only exception: across a physical barrier on a divided road.'),
  Q('q-shr-3a', 'SHR-3', 'If you cannot see a truck driver in the truck\'s side mirror…', ['The driver cannot see you', 'You are safe', 'The truck is turning', 'You should speed up beside it'], 'You are in a "no zone" blind spot.'),
  Q('q-shr-3b', 'SHR-3', 'Sharing a lane side-by-side with a motorcycle is…', ['Not allowed — motorcycles get the whole lane', 'Fine on highways', 'OK if it is slow', 'Required in traffic'], 'Never share a lane with a motorcycle.'),
  Q('q-shr-3c', 'SHR-3', 'A large truck swings left before a right turn. You should…', ['Wait — do not pass it on the right', 'Pass on the right quickly', 'Honk', 'Follow closely'], 'Trucks swing wide on right turns.'),

  // NIGHT
  Q('q-ngt-1a', 'NGT-1', 'You must turn on headlights when you cannot clearly see at least…', ['1,000 feet ahead', '200 feet ahead', '500 feet ahead', '2 miles ahead'], 'The 1,000-foot rule.'),
  Q('q-ngt-1b', 'NGT-1', 'In Maryland, when your wipers are on in bad weather…', ['Your headlights must be on', 'Use parking lights only', 'Turn on hazard lights', 'Use high beams'], 'Wipers on → headlights on.'),
  Q('q-ngt-2a', 'NGT-2', 'Switch to low beams at least how far before an oncoming vehicle?', ['500 feet', '100 feet', '200 feet', '1,000 feet'], 'Dim at least 500 feet before oncoming traffic.'),
  Q('q-ngt-2b', 'NGT-2', 'Use low beams when following a vehicle within…', ['300 feet', '50 feet', '1,000 feet', '1 mile'], '300 feet or less behind someone → low beams.'),
  Q('q-ngt-2c', 'NGT-2', 'In fog you should use…', ['Low beams', 'High beams', 'No lights', 'Parking lights only'], 'High beams reflect off fog back at you.'),
  Q('q-ngt-3a', 'NGT-3', 'Your car starts to skid. You should…', ['Release the pedal and steer in the direction you are skidding', 'Slam on the brakes', 'Jerk the wheel the opposite way', 'Speed up hard'], 'Ease off, steer with the skid, look where you want to go.'),
  Q('q-ngt-3b', 'NGT-3', 'During a skid, you can brake again when…', ['Your tires are gripping the road again', 'Immediately', 'Never', 'You reach a full stop'], 'Brake only after traction returns.'),

  // EMERGENCY
  Q('q-emg-1a', 'EMG-1', 'An ambulance with siren and lights approaches. You should…', ['Move as close as possible to the edge of the road and stop', 'Speed up to stay ahead', 'Stop right where you are', 'Keep driving normally'], 'Edge of the road, stop, wait until it passes.'),
  Q('q-emg-1b', 'EMG-1', 'You hear a siren while you are in an intersection. You should…', ['Clear the intersection, then pull over and stop', 'Stop in the intersection', 'Back up', 'Ignore it'], 'Never stop inside an intersection.'),
  Q('q-emg-2a', 'EMG-2', 'Maryland\'s Move Over law applies to…', ['Any vehicle stopped on the road with flashing lights', 'Only police cars', 'Only ambulances and fire trucks', 'Only tow trucks'], 'It was expanded to cover any stopped vehicle with warning lights.'),
  Q('q-emg-2b', 'EMG-2', 'A car is stopped on the shoulder with flashing lights, but you cannot change lanes. You should…', ['Slow to a safe speed and be ready to stop', 'Keep your speed', 'Honk', 'Stop in your lane'], 'Can\'t move over? Slow down.'),
  Q('q-emg-3a', 'EMG-3', 'You are in a crash and someone is injured. You should…', ['Stay, call 911, and not move the vehicles', 'Move the cars right away', 'Leave and call later', 'Only exchange insurance info'], 'Injury crash: stay, call 911, don\'t move cars.'),
  Q('q-emg-3b', 'EMG-3', 'A minor crash: no injuries and both cars can drive. You should…', ['Move the cars off the road and exchange information', 'Leave them in the lane for police', 'Drive away', 'Argue about fault'], 'No injuries + movable → clear the road, swap info.'),
  Q('q-emg-3c', 'EMG-3', 'You must always call police after a crash when…', ['Someone is hurt, a car cannot move, or a driver seems impaired', 'It is raining', 'The cars are new', 'Never'], 'Those three situations always need police.'),

  // IMPAIRED
  Q('q-imp-1a', 'IMP-1', 'For drivers under 21, drinking alcohol is…', ['Against the law', 'OK with one drink', 'OK if not driving for an hour', 'OK with a parent'], 'Under 21: no alcohol.'),
  Q('q-imp-1b', 'IMP-1', 'Under Maryland law, an under-21 driver violates the alcohol restriction with a BAC as low as…', ['0.02', '0.05', '0.08', '0.10'], 'Even 0.02 is a violation for under-21 drivers.'),
  Q('q-imp-2a', 'IMP-2', 'An adult driver with a BAC of 0.08 or higher is…', ['Driving under the influence (DUI)', 'Legal to drive', 'Only warned', 'Legal if driving slowly'], '0.08 = DUI.'),
  Q('q-imp-2b', 'IMP-2', 'Which of these can impair your driving?', ['Alcohol, illegal drugs, and some prescription or over-the-counter medicines', 'Only alcohol', 'Only illegal drugs', 'Only beer'], 'Read medicine labels for driving warnings.'),
  Q('q-imp-3a', 'IMP-3', 'A 16-year-old permit holder may use a phone while driving…', ['Only to call 911', 'Hands-free only', 'At red lights', 'For GPS'], 'Under 18 with a permit or provisional: no devices except 911.'),
  Q('q-imp-3b', 'IMP-3', 'For all drivers in Maryland, texting while driving is…', ['Illegal', 'Legal at low speed', 'Legal at stoplights', 'Legal if quick'], 'No handheld use or texting for anyone.'),

  // MD RULES
  Q('q-mdr-1a', 'MDR-1', 'The earliest age to get a Maryland learner\'s permit is…', ['15 years, 9 months', '15 years', '16 years', '14 years, 9 months'], '15 years and 9 months.'),
  Q('q-mdr-1b', 'MDR-1', 'The Maryland knowledge test has how many questions?', ['25', '20', '30', '50'], '25 questions, 20 minutes.'),
  Q('q-mdr-1c', 'MDR-1', 'What score do you need to pass the knowledge test?', ['88%', '70%', '75%', '80%'], '88% — that is 22 of 25.'),
  Q('q-mdr-2a', 'MDR-2', 'Your supervising driver must be at least ___ and licensed at least ___.', ['21 years old; 3 years', '18 years old; 1 year', '25 years old; 5 years', '16 years old; 2 years'], '21+ and licensed 3+ years, seated beside you.'),
  Q('q-mdr-2b', 'MDR-2', 'Under 18, how long must you hold your learner\'s permit?', ['At least 9 months', '3 months', '6 months', '45 days'], '9 months without a violation.'),
  Q('q-mdr-2c', 'MDR-2', 'How many practice hours must be logged, and how many at night?', ['60 total, 10 at night', '40 total, 5 at night', '50 total, 10 at night', '30 total, none at night'], '60 hours, 10 of them at night.'),
  Q('q-mdr-3a', 'MDR-3', 'A 16-year-old with a provisional license may NOT drive unsupervised…', ['Between midnight and 5 a.m. (with limited exceptions)', 'After 9 p.m.', 'On highways', 'On weekends'], 'Midnight–5 a.m. unless work, school activity, sports or volunteering.'),
  Q('q-mdr-3b', 'MDR-3', 'For the first 151 days of a provisional license (under 18), passengers under 18 are allowed only if they are…', ['Immediate family (or a supervisor is present)', 'Classmates', 'Wearing seat belts', 'Over 16'], 'No non-family passengers under 18 for 151 days unless supervised.'),
];

export const questionById = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
