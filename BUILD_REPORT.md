# BUILD REPORT — Jack's Permit Quest v1.0 (playable prototype)
Built and tested 2026-11-06.

## 1. What was built
A working, offline-capable PWA. Everything below was exercised in a real browser at iPhone size (375×812) and at desktop size.

**Working and verified in the browser**
- **First launch.** Nickname, then a choice of 3 original vehicles (coupe, muscle, SUV), then 5 accent colors.
- **HQ (home).** Shows:
  - level and XP bar
  - next recommended mission with a START MISSION button
  - days to the test (165)
  - rules mastered, shown as x / 33
  - overall progress
  - weekly streak
  - readiness
  - next garage unlock
- **Weekly session (~20 min), 5 steps.** Warm-up review → New rules (3 rule cards) → 5-question challenge → Driving mission → Mixed challenge → Fix-your-mistakes. Shows a progress bar and SESSION 01 ███░░ %. Saves after every step and resumes after closing the app.
- **MISSION 01: FOUR-WAY STOP.** An animated overhead SVG scene with 3 rounds:
  1. first-to-arrive goes first
  2. simultaneous arrival: yield to the driver on your right
  3. left turn yields to oncoming traffic

  Each round pauses on WHAT'S YOUR MOVE?, then animates the correct movement whether the answer was right or wrong. It gives a 2-sentence explanation, a **WHY?** button, a REPLAY button, and awards XP.
- **Quiz engine.** Immediate right/wrong feedback, a 2-sentence explanation, and WHY? (rule, detail, common mistake, source citation). Answer choices are shuffled. The perfect-run bonus works.
- **XP system.** Correct +10, wrong +2 (participation), mission +50, mastered rule +25, session +100, perfect challenge +50, levels. Practice exams give no per-question XP, so guessing isn't rewarded.
- **Garage.** Shows the car with paint finish, wheels, underglow and backdrop. 16 cosmetics unlock at XP thresholds. You can swap the ride and color at any time.
- **Brain Garage (spaced repetition).** Intervals are 1 → 3 → 7 → 14 days. A wrong answer drops the rule 2 levels and makes it due right away. A rule counts as mastered only after 3 correct recalls on **3 different days**; many correct answers in one sitting do not count. Question selection prefers due rules and weak rules, and uses a different wording for a rule than the one last seen.
- **Practice exams.** 25 questions drawn from all 11 topics, randomized, with no hints or feedback until the end. Results show a pass/fail against 22/25, a topic breakdown and a review of missed questions, and are saved locally. The next exam avoids repeating the previous one's questions.
- **Stats ("AM I READY?").** Shows BUILDING SKILLS / GETTING CLOSE / TEST READY, plus:
  - sessions completed
  - questions answered
  - accuracy, overall and by topic
  - rules mastered and rules needing review
  - an exam score chart
  - consecutive passes

  TEST READY requires 3 passing exams in a row.
- **Parent view.** Behind a discreet link on Stats. Shows:
  - weekly sessions over the last 4 weeks
  - consistency
  - top and bottom topics
  - recent exams
  - readiness

  Data is local only.
- **Road map.** A week-by-week plan to April 20 that marks each week NOW, done, or MISSED. Missed weeks are never auto-completed, and the next session always continues where Jack actually left off.
- **Persistence.** Verified: hard reload restored 324 XP, level 2, session 2 queued, car and color.
- **Offline.** Verified: cached 20 files, **stopped the server**, reloaded, and navigated and played a mission with no network.
- **Automated tests.** 28/28 pass. They cover XP, levels, SRS intervals, mastery rules, question selection, exam build and grade, readiness, session resume, persistence/migration, plan dates, and content integrity.
- No console errors. No horizontal scroll at 375 px. Large touch targets. Reduced-motion is supported.

**Tech decision (flagged):** this Mac has no Node/npm, so the app is plain HTML/CSS/JS with ES modules instead of React/Vite/Tailwind. It has zero dependencies and no build step, and runs on any static host. Data, engine and UI are separate modules, so moving to React later is straightforward.

## 2. File structure
See README.md. In short:
- `js/engine.js`: pure, tested logic
- `js/content/*`: data-driven curriculum, questions, verification, scenarios, cosmetics
- `js/ui/*`: screens and SVG art
- `sw.js` + `manifest.webmanifest`: PWA files
- `tests/`: browser test runner

## 3. How to run
`cd permit-quest && python3 -m http.server 5173`, then open http://localhost:5173. Tests are at `/tests/`.

For the iPhone home screen, it needs an HTTPS static host. It has **not** been published; that needs Kate's approval.

## 4. Preview
Local only: http://localhost:5173. No public URL.

## 5. Screenshots
In `docs/screenshots/`: home, onboarding, rule card, quiz feedback + WHY, mission decision, mission correction, exam result, garage.

## 6. Verified Maryland rules (33 of 33 used in the app)
**Sources**
- Maryland Driver's Manual DL-002, **October 2026 edition**: https://mva.maryland.gov/Documents/DL-002.pdf. The PDF was downloaded and its text read directly.
- MVA test-prep and provisional-license pages.
- Maryland Code (mgaleg.maryland.gov).

Every rule stores its rule ID, text, source, URL, page/section and date verified (2026-11-06). These are in `js/content/verification.js`.

**Key facts**
- **Permit age:** 15 years 9 months (manual p.9).
- **Knowledge test:** 25 questions and 20 minutes (p.7). Passing is **88% = 22/25**; the 88% comes from the MVA test-prep page, not the manual.
- **Supervisor:** at least 21, licensed at least 3 years, seated beside you (p.51).
- **Permit hold period:** 9 months under 18 (p.10).
- **Practice:** 60 hours, 10 of them at night (p.10).
- **Provisional (under 18):** no unsupervised driving midnight–5 a.m., with exceptions (p.47).
- **Provisional passengers (under 18):** none under 18 except immediate family for the first **151 days**, not 150 (p.47).
- **Phones:**
  - All drivers: no handheld use or texting.
  - Permit and provisional holders under 18: no devices at all, except to call 911 (p.35, p.47).
- **School bus:** stop at least 20 feet away. You don't stop if the bus is on the other side of a physical barrier (p.38–39).
- **Bicycles:** pass with at least 3 feet (p.40; TR §21-1209).
- **Default speed limits:** come from **statute only** (TR §21-801.1):
  - 30 mph in business districts and on undivided residential roads
  - 35 mph on divided residential roads
  - 50 mph on other undivided roads
  - 55 mph on other divided roads
  - 70 mph maximum anywhere
- **Following distance:** 3–4 seconds; 4–5 behind vehicles that stop often (p.15).
- **Headlights:** on whenever you can't see 1,000 ft ahead, and whenever wipers are on in bad weather. Dim within 500 ft of oncoming traffic and 300 ft when following (p.27).
- **Alcohol:** 0.08 is DUI (p.33). Under 21, any alcohol is illegal (p.33). The 0.02 under-21 limit and the 0.07 DWI level come from statute.
- **Move Over:** now covers **any** vehicle stopped with flashing lights (p.45).
- **Emergency vehicles:** move to the edge of the road and stop, staying out of intersections (p.37).
- **Four-way stop:** whoever arrives first goes first; on a tie, yield to the right. Left turns yield to oncoming traffic (p.13–14).
- **Signs and markings:** shapes and colors (p.20); pavement markings (p.24).
- **Skids:** release the pedal and steer in the direction of the skid (p.29).
- **Crashes:** if anyone is injured, stay and do not move the vehicles. If no one is injured, move off the road and exchange information (p.43).

## 7. Still requiring verification (kept out of the app)
- "Headlights sunset to sunrise." Not found in the October 2026 manual or TR §22-201.1. **NEEDS REVIEW**
- "Signal at least 100 feet before turning." Not in the current manual. **NEEDS REVIEW**
- Wheel position when parking on hills. Not in the current manual. **NEEDS REVIEW**
- Recommended: a human spot-check of the citations against the PDF, since verification was done by reading the extracted text.
- The practice questions are **original**. They are not official MVA questions.

## 8. Known limitations
- **Only one driving mission so far:** the four-way stop, with 3 rounds. The session reuses it every week until more are added.
- **3 rules per topic and 85 questions.** That's enough for varied exams now; more questions per rule would cut down on repetition before March.
- **iPhone install needs hosting.** Offline mode and home-screen install need HTTPS. It is tested only in the desktop browser engine at iPhone size, not on a physical iPhone.
- **Progress lives on one device.** It sits in the browser's localStorage on that device, with no sync or backup. Clearing Safari website data erases it.
- **Partial resume.** Closing the app mid-quiz resumes at the start of that session step. Answers already given are kept.
- **The plan is 25 calendar weeks (Mon–Sun).** Today to April 20 is 23 weeks 4 days, so the requested 24-week plan fits only approximately: week 1 is already in progress and week 25 is test week. The plan:
  - topic learning: Nov 2 – Jan 17 (11 weeks)
  - review: through Feb 28
  - practice exams: from March 1, with a target of 3 consecutive passes by April 1
- **Original art.** The car illustrations are deliberately simple, with no brand logos.

## 9. Recommended next phase
1. Publish to a free HTTPS static host so Jack can install it on his iPhone. **Needs Kate's OK.**
2. Add missions 2–5:
   - school bus stop (20 ft; divided highway)
   - emergency vehicle / Move Over
   - bike passing (3 ft)
   - left turn across a motorcycle
3. Grow the question bank to about 3 wordings per rule and add rules (aim for 5 per topic), all verified against the manual first.
4. Add a progress export/import code as a backup, since there is no sync.
5. Playtest with Jack for one real session, then tune pacing, text length and XP.
