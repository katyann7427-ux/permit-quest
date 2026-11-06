# Jack's Permit Quest — v1.0 playable prototype

Maryland learner's-permit study app. Mobile-first PWA, works offline, no account, no backend, no paid APIs, no build step.

## Run it

```bash
cd permit-quest
python3 -m http.server 5173
```

Open http://localhost:5173. Tests: http://localhost:5173/tests/

Any static web server works. There are no dependencies to install.

### Install it on an iPhone
Service workers (offline mode) need **HTTPS**, so the phone needs a hosted copy. Any free static host works (GitHub Pages, Netlify, Cloudflare Pages); nothing has been published yet. On the iPhone, open the URL in Safari, then tap **Share → Add to Home Screen**.

### Shipping an update
Bump `VERSION` in `sw.js` whenever app files change. Otherwise installed copies keep serving the cached version.

## Structure

```
index.html              app shell + bottom nav
manifest.webmanifest    PWA manifest
sw.js                   offline cache (cache-first, versioned)
css/app.css             Midnight Racing theme, reduced-motion support
js/app.js               router, render loop, event delegation
js/engine.js            PURE logic: XP, levels, spaced repetition, mastery, exams, readiness, sessions, plan
js/store.js             localStorage save/load
js/content/
  curriculum.js         11 categories x 3 rules (ids, text, why, common mistake)
  verification.js       source + status for every rule (VERIFIED / NEEDS REVIEW / UNVERIFIED)
  questions.js          85 original practice questions, each tied to a rule id
  scenarios.js          driving missions (SVG coordinates, rounds, answers, animation paths)
  cosmetics.js          vehicles, colors, XP unlocks
js/ui/
  common.js             shared helpers; filters content to VERIFIED rules only
  svg.js                original car + intersection illustrations
  play.js               quiz, rule cards, driving mission, practice exam, weekly session
  screens.js            onboarding, HQ, garage, missions, brain garage, exams, stats, parent view
tests/                  browser test runner for engine + content integrity
docs/screenshots/       prototype screenshots
```

## Adding content
- **Rule:** add it to `RULES` in `curriculum.js` and a matching record in `verification.js`. Only rules with `status: 'VERIFIED'` appear in the app.
- **Question:** add a `Q(...)` line in `questions.js` with the correct choice listed first. Choices are shuffled at display time.
- **Mission:** add an entry to `SCENARIOS`, using the pose and lane conventions at the top of the file.
- Re-run `/tests/` after any change. The content-integrity tests catch broken references.
