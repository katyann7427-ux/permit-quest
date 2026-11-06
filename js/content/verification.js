// Source + verification record for every rule.
// status: 'VERIFIED' | 'NEEDS REVIEW' | 'UNVERIFIED'
// Only VERIFIED rules are presented as authoritative Maryland instruction.

const MANUAL = {
  doc: "Maryland Driver's Manual DL-002 (10-26), October 2026 Edition",
  url: 'https://mva.maryland.gov/Documents/DL-002.pdf',
};
const TEST_PAGE = { doc: 'MVA — Prepare for Your Driver\'s License Test', url: 'https://mva.maryland.gov/licenses-ids/prepare-drivers-license-test' };
const PROV_PAGE = { doc: 'MVA — Provisional License', url: 'https://mva.maryland.gov/your-mva-guide/teens-new-drivers/provisional-license' };
const statute = (article, sec) => ({
  doc: `Maryland Code, ${article === 'gtr' ? 'Transportation' : 'Courts & Judicial Proceedings'} §${sec}`,
  url: `https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=${article}&section=${sec}`,
});

const DATE = '2026-11-06';
const V = (src, ref, extra = {}) => ({ status: 'VERIFIED', source: src.doc, url: src.url, ref, date: DATE, ...extra });

export const VERIFICATION = {
  'SGN-1': V(MANUAL, 'p.20, §4.B Colors & Shapes'),
  'SGN-2': V(MANUAL, 'p.20, §4.B Colors & Shapes'),
  'SGN-3': V(MANUAL, 'p.20, §4.B (Rectangle; White)'),
  'SIG-1': V(MANUAL, 'p.17–18, §4.A Traffic Signals (1, 7)'),
  'SIG-2': V(MANUAL, 'p.17–18, §4.A Traffic Signals (2, 8)'),
  'SIG-3': V(MANUAL, 'p.24, §4.C Pavement Markings; p.27'),
  'ROW-1': V(MANUAL, 'p.13–14, §3.B Right-of-Way'),
  'ROW-2': V(MANUAL, 'p.14, §3.B Right-of-Way; p.39, §7.E Motorcycles'),
  'ROW-3': V(MANUAL, 'p.37, §7.A Pedestrian Right-of-Way'),
  'TRN-1': V(MANUAL, 'p.15, §3.G Turning; §3.H U-turn'),
  'TRN-2': V(MANUAL, 'p.15, §3.F Lane Driving'),
  'TRN-3': V(MANUAL, 'p.16, §3.J General Parking Rules'),
  'SPD-1': V(MANUAL, 'p.14, §3.C Speed'),
  'SPD-2': V(statute('gtr', '21-801.1'), '§21-801.1(b), (e)', { note: 'Statute only — the manual does not list default limits.' }),
  'SPD-3': V(MANUAL, 'p.15, §3.D Following Distance'),
  'HWY-1': V(MANUAL, 'p.16, §3.I Passing'),
  'HWY-2': V(MANUAL, 'p.32, entering/exiting limited-access highways; p.14'),
  'HWY-3': V(MANUAL, 'p.15, §3.F; p.16 "stay right"; p.32'),
  'SHR-1': V(MANUAL, 'p.39–40, §7.F Bicycles', { also: 'Transportation §21-1209' }),
  'SHR-2': V(MANUAL, 'p.38–39, §7.D School Buses', { also: 'Transportation §21-706' }),
  'SHR-3': V(MANUAL, 'p.37–38, §7.C Large Trucks; p.39, §7.E Motorcycles'),
  'NGT-1': V(MANUAL, 'p.27, §5.A When to Use Your Headlights', { also: 'Transportation §22-201.1, §22-201.2' }),
  'NGT-2': V(MANUAL, 'p.27, §5.A Low Beam or High Beam'),
  'NGT-3': V(MANUAL, 'p.29, §5.E Skidding; §5.F Hydroplaning'),
  'EMG-1': V(MANUAL, 'p.37, §7.B Emergency Vehicles', { also: 'Transportation §21-405' }),
  'EMG-2': V(MANUAL, 'p.45, §8.D; p.37, §7.B'),
  'EMG-3': V(MANUAL, 'p.43, §8.A Crashes'),
  'IMP-1': V(MANUAL, 'p.33, §6.A "Under 21 – Alcohol Not Allowed"', { also: 'CJ §10-307(f) (0.02); Transportation §16-113(b)' }),
  'IMP-2': V(MANUAL, 'p.33, §6.A', { also: 'Transportation §11-174.1 (0.08); CJ §10-307(d) (0.07)' }),
  'IMP-3': V(MANUAL, 'p.35, §6.C Cell Phones; p.47, §9.A', { also: 'Transportation §21-1124.2' }),
  'MDR-1': V(MANUAL, 'p.9, §2.B; p.7, §1.B', { also: `${TEST_PAGE.doc} (88% pass score)`, alsoUrl: TEST_PAGE.url }),
  'MDR-2': V(MANUAL, 'p.10, §2.B; p.51, §10.B'),
  'MDR-3': V(MANUAL, 'p.47, §9.A', { also: PROV_PAGE.doc, alsoUrl: PROV_PAGE.url }),
};

// Items checked but deliberately NOT taught, because official sources did not support them.
export const NOT_TAUGHT = [
  { claim: 'Headlights required "sunset to sunrise"', status: 'NEEDS REVIEW', note: 'Not found in the Oct 2026 manual or Transportation §22-201.1. App teaches the verified 1,000-ft / wipers rules instead.' },
  { claim: 'Signal at least 100 feet before turning', status: 'NEEDS REVIEW', note: 'Not stated in the Oct 2026 manual. App teaches "signal before you reach the turn".' },
  { claim: 'Wheel position when parking on hills', status: 'NEEDS REVIEW', note: 'Not in the Oct 2026 manual. Removed from content.' },
];

export const KNOWLEDGE_TEST = {
  questions: 25,
  minutes: 20,
  passPct: 88,
  passMark: 22, // 88% of 25
  status: 'VERIFIED',
  ref: 'Manual p.7 §1.B (25 questions, 20 min); MVA test-prep page (88%)',
};

export function verificationFor(ruleId) {
  return VERIFICATION[ruleId] || { status: 'UNVERIFIED' };
}
