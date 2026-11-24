"""Pinned / ad episode P001 '3 Solar Myths' plus its 15 s ad cut P001-AD20.
Claims reuse sources already checked online on 2026-11-24 (E001/E004/E005/E007)."""
import json, copy
SRC = {}
for e in ['E001', 'E004', 'E005', 'E007']:
    for s in json.load(open(f'episodes/{e}/episode.json'))['sources']:
        SRC[s['id']] = s
OC = lambda note: {"by": "Claude (online fact check)", "at": "2026-11-24T14:20:00+08:00",
    "policy": "Owner (CHRIS) waived the human technical reviewer for now on 2026-11-24; claims checked online against published data instead.", "note": note}
def claim(i, wording, scope, caveats, srcs, note):
    return {"id": f"CL-P001-0{i}", "category": "technical", "wording": wording, "scope": scope, "caveats": caveats,
            "sources": srcs, "status": "verified", "verifiedBy": None, "technicalSignoff": "online-checked", "onlineCheck": OC(note)}
claims = [
    claim(1, "Clouds reduce solar output but panels still produce some electricity from diffuse light.", "PV in overcast conditions.", "No percentage named; reduction varies.", ["SRC-DOE-CLOUD", "SRC-NOAA-CLOUD"], "DOE: cloudy days hamper but do not stop production; NOAA: some light still passes through clouds."),
    claim(2, "A grid-tied system works without a battery: daytime solar powers home loads directly, and excess can be exported under net metering.", "Grid-tied residential PV in Meralco franchise.", "Night use comes from the grid.", ["SRC-MER-NM", "SRC-MER-DER", "SRC-DOE-STORAGE"], "Meralco net metering/DER pages describe on-grid solar without storage; DOE guide treats batteries as optional."),
    claim(3, "A compliant grid-tied inverter shuts down when the grid goes down (anti-islanding), for safety.", "Grid-tied systems without backup.", "Applies to compliant installs.", ["SRC-ERC-NMIS", "SRC-PH-ANTIISL"], "ERC interconnection standards include islanding protection; distributor guidance: inverter must disconnect immediately."),
    claim(4, "Backup power during a brownout needs a compatible battery and proper backup wiring.", "Hybrid/backup systems.", "Backup may cover only selected loads.", ["SRC-FRONIUS-BU", "SRC-SMA-BU", "SRC-DOE-STORAGE"], "Manufacturer docs: backup requires battery plus backup wiring/switching."),
]
H1 = {"stability": 0.25, "style": 0.9}
END_SRC = ["Sources: U.S. DOE; NOAA; Meralco net metering & DER; ERC/DOE", "interconnection standards; Fronius & SMA backup docs (checked 24 Nov 2026)"]
scenes = {
    "hook": {"type": "hook", "icon": "panel", "icon2": "cloud", "chip": "3 Solar Myths"},
    "m1": {"type": "myth", "n": 1, "of": 3, "lines": ["Hindi gumagana", "ang solar", "kapag maulap."], "stampAt": 1.6},
    "f1": {"type": "sky", "sky": "cloudy", "level": 0.35, "chip": "FACT: bawas, pero hindi zero"},
    "m2": {"type": "myth", "n": 2, "of": 3, "lines": ["Kailangan laging", "may battery."], "stampAt": 1.3},
    "f2": {"type": "path", "steps": [{"icon": "sun", "label": "araw"}, {"icon": "panel", "label": "solar panels"}, {"icon": "inverter", "label": "inverter"}, {"icon": "house", "label": "sa gamit mo"}], "kuyaLeft": True},
    "m3": {"type": "myth", "n": 3, "of": 3, "lines": ["Basta may solar,", "may kuryente", "kahit brownout."], "stampAt": 1.7},
    "f3": {"type": "outage", "backup": "none", "daytime": True, "chip": "FACT: grid-tied = off sa brownout"},
    "f3b": {"type": "outage", "backup": "battery", "daytime": False, "chip": "Battery + backup wiring"},
    "follow": {"type": "equation", "lines": [{"text": "I-follow si"}, {"text": "Kuya SoLight", "color": "gold", "size": 88}, {"text": "para tama ang", "size": 60}, {"text": "solar info mo!", "size": 60}], "icon": "panel"},
    "close": {"type": "close"},
    "endcard": {"type": "endcard", "sources": END_SRC},
}
cues = [
    {"id": "c01", "scene": "hook", "text": "Naniniwala ka pa ba sa tatlong solar myth na 'to?", "gold": ["solar", "myth"], "pauseAfter": 0.35, "elSettings": H1, "standalone": True},
    {"id": "c02", "scene": "identity", "text": "Hello, SoSmart viewers! Kuya SoLight 'to!", "gold": ["SoSmart", "SoLight"], "pauseAfter": 0.35, "elSpeed": 1.15, "standalone": True},
    {"id": "c03", "scene": "m1", "text": "Myth number one: hindi raw gumagana ang solar kapag maulap.", "gold": ["maulap"], "pauseAfter": 0.25},
    {"id": "c04", "scene": "f1", "text": "Mali! Bumababa ang output, pero may kuryente pa rin mula sa liwanag.", "gold": ["Mali!", "may kuryente pa rin"], "pauseAfter": 0.3},
    {"id": "c05", "scene": "m2", "text": "Myth number two: kailangan daw laging may battery.", "gold": ["battery"], "pauseAfter": 0.25},
    {"id": "c06", "scene": "f2", "text": "Mali! Ang grid-tied, gumagana kahit walang battery, diretso sa gamit mo sa araw.", "gold": ["Mali!", "walang battery"], "pauseAfter": 0.3},
    {"id": "c07", "scene": "m3", "text": "Myth number three: basta may solar, may kuryente ka raw kahit brownout.", "gold": ["brownout"], "pauseAfter": 0.25},
    {"id": "c08", "scene": "f3", "text": "Mali! Kusang namamatay ang grid-tied kapag brownout, para sa safety.", "gold": ["Mali!", "safety"], "pauseAfter": 0.25},
    {"id": "c09", "scene": "f3b", "text": "Para may ilaw, kailangan ng battery at tamang backup wiring.", "gold": ["battery", "backup wiring"], "pauseAfter": 0.35},
    {"id": "c10", "scene": "follow", "text": "I-follow si Kuya SoLight para laging tama ang solar info mo!", "gold": ["Kuya SoLight"], "pauseAfter": 0.35},
    {"id": "cz1", "scene": "close", "text": "Dahil ang gusto ni Kuya SoLight… naka-solar ka na, SoSmart ka pa!", "gold": ["SoSmart"], "pauseAfter": 0.35, "audioFile": "assets/voice/locked/outro-catchphrase-O3.wav"},
    {"id": "cz2", "scene": "endcard", "text": "Life is SoLight with Solar.", "pauseAfter": 0.2, "audioFile": "assets/voice/locked/outro-tagline-O3.wav"},
]
used = sorted({s for c in claims for s in c['sources']})
ep = {"id": "P001", "title": "3 Solar Myths", "pillar": "A", "template": "T-myth-buster", "purpose": "Pinned Facebook post and paid brand-awareness/reach ads",
      "audience": "Filipino homeowners curious about solar", "premise": "Three common solar myths, each busted with a checked fact, plus a follow call to action.",
      "openingPattern": "A-question-first", "greetingId": "greet-default", "catchphraseId": "close-signature",
      "scriptBasis": "Claude draft, owner picked concept C (3 Solar Myths) 2026-11-24 14:07 Manila; claims checked online 2026-11-24.",
      "scriptVersion": 1, "voice": "production", "cover": ["3 Solar Myths", "na Mali Pala!"], "scenes": scenes, "cues": cues,
      "claims": claims, "sources": [SRC[s] for s in used]}
import os
old = 'episodes/P001/episode.json'
if os.path.exists(old):
    prev = json.load(open(old))
    if 'ownerApproval' in prev: ep['ownerApproval'] = prev['ownerApproval']
json.dump(ep, open(old, 'w'), ensure_ascii=False, indent=1)
# ~20 s ad cut (no room for the catchphrase; ends on tagline + logo): hook, greeting, myth 3 and its fact, tagline end card.
ad = copy.deepcopy(ep); ad['id'] = 'P001-AD20'; ad['title'] = '3 Solar Myths (20 s ad cut)'; ad['purpose'] = 'Paid ads cutdown of P001'; ad['adCut'] = True
keep = ['c02', 'c08', 'c09', 'cz2']
ad['cues'] = [{"id": "c01", "scene": "m3", "text": "Basta may solar, may kuryente ka na kahit brownout?", "gold": ["brownout"], "pauseAfter": 0.3, "elSettings": H1, "standalone": True}] + [c for c in ad['cues'] if c['id'] in keep]
for c in ad['cues']: c['standalone'] = True  # same takes regardless of neighbours
ad['cues'][2]['text'] = "Mali! Kusang namamatay ang grid-tied kapag brownout."
ad['scenes']['m3'] = dict(ad['scenes']['m3'], tag="SOLAR MYTH", stampAt=2.2)
ad['claims'] = [c for c in claims if c['id'] in ('CL-P001-03', 'CL-P001-04')]
ad['sources'] = [SRC[s] for s in ['SRC-ERC-NMIS', 'SRC-PH-ANTIISL', 'SRC-FRONIUS-BU', 'SRC-SMA-BU', 'SRC-DOE-STORAGE']]
ad['scenes']['endcard']['sources'] = ["Sources: ERC/DOE interconnection standards; CleanTechnica (May 2026);", "Fronius & SMA backup docs; U.S. DOE (checked 24 Nov 2026)"]
ad['cover'] = ["May Solar = May Kuryente", "Kahit Brownout?"]
if os.path.exists('episodes/P001-AD20/episode.json'):
    prev = json.load(open('episodes/P001-AD20/episode.json'))
    if 'ownerApproval' in prev: ad['ownerApproval'] = prev['ownerApproval']
json.dump(ad, open('episodes/P001-AD20/episode.json', 'w'), ensure_ascii=False, indent=1)
print('ok', len(ep['cues']), len(ad['cues']))
