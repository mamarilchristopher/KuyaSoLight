"""Writes episode.json for E001, E003-E010 (scripts, scenes, claims, sources, captions).
Scripts by Claude, claims fact-checked online 2026-11-24 (owner waived the human reviewer).
Run: python3 episodes/_make_e001_e010.py"""
import json, os

AT = '2026-11-24T05:00:00+08:00'
POLICY = "Owner (CHRIS) waived the human technical reviewer for now on 2026-11-24; claims checked online against published data instead."
GREET = {"id": "c02", "scene": "identity", "text": "Hello, SoSmart viewers! Kuya SoLight 'to!", "gold": ["SoSmart", "SoLight"], "pauseAfter": 0.35, "elSpeed": 1.15, "standalone": True}
CLOSE = [{"id": "cz1", "scene": "close", "text": "Dahil ang gusto ni Kuya SoLight… naka-solar ka na, SoSmart ka pa!", "gold": ["SoSmart"], "pauseAfter": 0.35, "audioFile": "assets/voice/locked/outro-catchphrase-O3.wav"},
         {"id": "cz2", "scene": "endcard", "text": "Life is SoLight with Solar.", "pauseAfter": 0.2, "audioFile": "assets/voice/locked/outro-tagline-O3.wav"}]
TAGS = ['#KuyaSoLight', '#SoSmartViewers', '#SolarPH', '#SolarKlaro', '#SoLightSolarPH']

SRC = {
 'SRC-DOE-INV': {"tier": 1, "publisher": "U.S. Department of Energy", "title": "Solar Integration: Inverters and Grid Services Basics", "url": "https://www.energy.gov/eere/solar/solar-integration-inverters-and-grid-services-basics", "jurisdiction": "General technical reference", "excerpts": ["Inverters change the variable direct current (DC) output of PV into alternating current (AC) for the grid and household use."]},
 'SRC-EIA-PV': {"tier": 1, "publisher": "U.S. Energy Information Administration", "title": "Photovoltaics and electricity", "url": "https://www.eia.gov/energyexplained/solar/photovoltaics-and-electricity.php", "jurisdiction": "General technical reference", "excerpts": ["PV cells convert sunlight directly into electricity (DC); output depends on available sunlight."]},
 'SRC-EIA-UNITS': {"tier": 1, "publisher": "U.S. Energy Information Administration", "title": "Measuring electricity; Glossary: kilowatt, kilowatthour", "url": "https://www.eia.gov/energyexplained/electricity/measuring-electricity.php", "jurisdiction": "General technical reference", "excerpts": ["Kilowatt: 1,000 watts (unit of power).", "Kilowatthour: one kilowatt of power expended for one hour (unit of energy)."]},
 'SRC-MER-NM': {"tier": 1, "publisher": "Manila Electric Company (Meralco)", "title": "Solar and Net Metering", "url": "https://www.meralco.com.ph/residential/energy-solutions/solar-and-renewables/solar-net-metering", "jurisdiction": "Philippines, Meralco franchise area", "excerpts": ["Your system supplies the property first while it is generating.", "The Meralco grid supplies the property when renewable generation is not enough.", "Exported energy is credited under net metering."]},
 'SRC-MER-DER': {"tier": 1, "publisher": "Manila Electric Company (Meralco)", "title": "Distributed Energy Resources", "url": "https://www.meralco.com.ph/residential/energy-solutions/solar-and-renewables/distributed-energy-resources", "jurisdiction": "Philippines, Meralco franchise area", "excerpts": ["At times when there is no sunlight, or at night, the grid will provide electricity."]},
 'SRC-MER-RATES': {"tier": 1, "publisher": "Manila Electric Company (Meralco)", "title": "Schedule of rates (residential), November 2026", "url": "https://www.meralco.com.ph/consumer-information/rates-archives", "jurisdiction": "Philippines, Meralco franchise area", "excerpts": ["Generation, transmission, system loss and distribution charges are billed per kWh."]},
 'SRC-PH-ANTIISL': {"tier": 2, "publisher": "CleanTechnica (reporting Philippine distributor guidance)", "title": "Guerilla solar installations need to be controlled, says Philippine power distributor", "url": "https://cleantechnica.com/2026/05/04/guerilla-solar-installations-discovered-need-to-be-controlled-says-philippine-power-distributor/", "jurisdiction": "Philippines", "excerpts": ["In a compliant system, the inverter must immediately disconnect when the grid goes down to prevent backfeeding electricity into power lines."]},
 'SRC-ERC-NMIS': {"tier": 1, "publisher": "Energy Regulatory Commission / DOE", "title": "Net-Metering Rules and Interconnection Standards (Philippine Distribution Code framework)", "url": "https://doe.gov.ph/electric-power/philippine-distribution-code", "jurisdiction": "Philippines", "excerpts": ["Net-metered systems follow the Philippine Distribution Code and ERC Net-Metering Interconnection Standards, which include islanding protection."]},
 'SRC-FRONIUS-BU': {"tier": 2, "publisher": "Fronius International (manufacturer documentation)", "title": "Backup power function", "url": "https://www.fronius.com/en-in/india/solar-energy/installers-partners/products-solutions/features/backup-power-function", "jurisdiction": "Manufacturer reference", "excerpts": ["Backup operation requires a compatible battery and the appropriate backup wiring/switching to separate the home circuits from the grid."]},
 'SRC-SMA-BU': {"tier": 2, "publisher": "SMA Solar Technology (manual)", "title": "Battery-backup function", "url": "https://manuals.sma.de/STPHxx-60/en-US/16945435403.html", "jurisdiction": "Manufacturer reference", "excerpts": ["Battery-backup operation must be set up and wired as a backup system; not for loads that need an uninterrupted supply."]},
 'SRC-DOE-CLOUD': {"tier": 1, "publisher": "U.S. Department of Energy, Office of Science", "title": "5 Ways to Get Sunshine on a Cloudy Day", "url": "https://www.energy.gov/science/articles/5-ways-get-sunshine-cloudy-day", "jurisdiction": "General technical reference", "excerpts": ["Cloudy days can hamper solar panels' ability to produce electricity."]},
 'SRC-NOAA-CLOUD': {"tier": 1, "publisher": "NOAA SciJinks", "title": "Solar energy and clouds", "url": "https://scijinks.gov/solar-energy-and-clouds", "jurisdiction": "General technical reference", "excerpts": ["Clouds reduce, but do not completely block, the sunlight reaching solar panels; diffuse light still reaches them."]},
 'SRC-NREL-ILR': {"tier": 1, "publisher": "National Renewable Energy Laboratory", "title": "The Effect of Inverter Loading Ratio on Energy Estimate Bias (NREL/TP-5K00-82812)", "url": "https://www.nrel.gov/docs/fy22osti/82812.pdf", "jurisdiction": "General technical reference", "excerpts": ["Inverter loading ratio (ILR) = rated DC power / rated AC power.", "Clipping appears as a flat line at or near the inverter's AC capacity when DC power exceeds it."]},
 'SRC-NREL-STC': {"tier": 1, "publisher": "National Renewable Energy Laboratory / Penn State AE 868", "title": "PV module ratings at Standard Test Conditions; Interpreting PV manufacturer datasheets", "url": "https://courses.ems.psu.edu/ae868/book/export/html/879", "jurisdiction": "General technical reference", "excerpts": ["STC: 1000 W/m² irradiance, 25°C cell temperature, AM1.5 spectrum.", "Temperature coefficient of power is negative: output falls as cell temperature rises above 25°C."]},
 'SRC-NREL-PVW': {"tier": 1, "publisher": "National Renewable Energy Laboratory", "title": "PVWatts Calculator (system losses: soiling, shading, temperature, etc.)", "url": "https://pvwatts.nrel.gov/", "jurisdiction": "General technical reference", "excerpts": ["Default system losses include soiling, shading, wiring, mismatch and others; temperature effects are modelled separately."]},
 'SRC-DOE-STORAGE': {"tier": 1, "publisher": "U.S. Department of Energy", "title": "Solar-plus-storage / Homeowner's Guide to Going Solar", "url": "https://www.energy.gov/eere/solar/homeowners-guide-going-solar", "jurisdiction": "General technical reference", "excerpts": ["Batteries can store solar energy produced during the day for use at night or during outages, if the system is designed for it."]},
}

def claim(ep, n, cat, wording, scope, caveats, sources, note):
    return {"id": f"CL-{ep}-{n:02d}", "category": cat, "wording": wording, "scope": scope, "caveats": caveats, "sources": sources, "status": "verified",
            "verifiedBy": None, "technicalSignoff": "online-checked", "onlineCheck": {"by": "Claude (online fact check)", "at": AT, "policy": POLICY, "note": note}}

def cue(i, scene, text, gold=(), say=None, pause=0.25):
    c = {"id": f"c{i:02d}", "scene": scene, "text": text, "gold": list(gold), "pauseAfter": pause}
    if say: c["say"] = say
    if i == 1: c.update({"standalone": True, "elSettings": {"stability": 0.25, "style": 0.9}})  # locked H1 hook style
    return c

EP = {}

EP['E001'] = dict(
 title="Ano Ba Talaga ang Solar?", pillar="A", template="T05-energy-flow", cover=["Ano Ba Talaga", "ang Solar?"],
 audience="First-time homeowners curious about rooftop solar", premise="Sunlight becomes DC electricity in the panels; the inverter turns it into the AC the home uses; when solar is short, the grid or a battery supplies the rest.",
 scenes={"hook": {"type": "hook", "icon": "panel", "chip": "Paano ba gumagana?"},
         "chain": {"type": "path", "steps": [{"icon": "sun", "label": "Liwanag"}, {"icon": "panel", "label": "DC"}, {"icon": "inverter", "label": "DC → AC"}, {"icon": "house", "label": "Gamit sa bahay"}]},
         "night": {"type": "sky", "sky": "night", "level": 0, "battery": "discharge", "chip": "Grid o battery", "barLabel": "solar"},
         "recap": {"type": "checklist", "title": "Ang solar system", "items": ["Panels: liwanag → DC", "Inverter: DC → AC", "Grid o battery: pang-backup"]},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: U.S. DOE & EIA solar basics; Meralco Solar & Net Metering", "(checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "Ano ba talaga ang ginagawa ng solar panels mo?", ["solar"], pause=0.35), GREET,
       cue(3, "chain", "Simple lang: liwanag ng araw ang tumatama sa panels.", ["araw"], pause=0.1),
       cue(4, "chain", "Ginagawa itong DC na kuryente ng solar cells.", ["DC"], say="Ginagawa itong D-C na kuryente ng solar cells."),
       cue(5, "chain", "Pero AC ang gamit ng appliances sa bahay.", ["AC"], say="Pero A-C ang gamit ng appliances sa bahay.", pause=0.1),
       cue(6, "chain", "Kaya may inverter: ginagawa nitong AC ang DC.", ["inverter"], say="Kaya may inverter: ginagawa nitong A-C ang D-C."),
       cue(7, "chain", "Habang may araw, solar ang tumutulong sa bahay mo.", ["solar"], pause=0.3),
       cue(8, "night", "Kapag kulang o gabi na, grid o battery ang sasalo.", ["grid", "battery"], pause=0.3),
       cue(9, "recap", "Panels, inverter, at tamang setup. 'Yan ang solar!", ["inverter"], pause=0.4), *CLOSE],
 claims=[claim('E001', 1, 'technical', "Solar panels convert sunlight into DC electricity.", "Photovoltaic modules.", "Output depends on sunlight.", ['SRC-EIA-PV'], "EIA: PV cells convert sunlight directly into electricity (direct current)."),
         claim('E001', 2, 'technical', "Home appliances use AC; the inverter converts the panels' DC into AC.", "Grid-connected homes.", "Some DC appliances exist; typical homes use AC.", ['SRC-DOE-INV'], "DOE: inverters change variable DC output of PV into AC for the grid and household use."),
         claim('E001', 3, 'technical', "When solar is not enough or at night, a grid-connected home uses the grid or a battery.", "Grid-connected systems, with or without battery.", "Battery supply depends on capacity and configuration.", ['SRC-MER-NM', 'SRC-MER-DER'], "Meralco: grid supplies the property when renewable generation is not enough; at night the grid provides electricity.")],
 caption={"main": "Ano ba talaga ang solar? Liwanag → panels (DC) → inverter (AC) → bahay mo. Kapag kulang o gabi na, grid o battery ang sasalo. ☀️\n\nSoSmart viewers, may tanong kayo sa solar? I-comment lang! 👇", "short": "Solar in 30 seconds: liwanag → DC → AC → bahay. ☀️", "thumbnailHeadline": "Ano Ba Talaga ang Solar?", "pinnedComment": "Sources: U.S. DOE inverter basics, EIA photovoltaics, Meralco Solar & Net Metering (checked 24 Nov 2026).", "discussionQuestion": "Ano ang una mong tanong noong nag-isip kang mag-solar?", "hashtags": TAGS, "cta": "Ikaw, ano ang solar question mo?"})

EP['E003'] = dict(
 title="kW vs kWh: Ano ang Pagkakaiba?", pillar="A", template="T02-explainer", cover=["kW vs kWh:", "Ano'ng Pagkakaiba?"],
 audience="Homeowners reading quotes and bills", premise="kW is power (how fast energy is used); kWh is energy (how much was used). A 100 W TV for 10 hours uses 1 kWh, and the bill counts kWh.",
 scenes={"hook": {"type": "hook", "icon": "bill", "chip": "kW? kWh?"},
         "kw": {"type": "meter", "appliance": "ac", "show": "kw", "level": 0.6, "kwLabel": "kW = bilis ng gamit"},
         "kwh": {"type": "meter", "appliance": "ac", "show": "kwh", "kwhFrom": 0, "kwhTo": 2.4, "kwhLabel": "kWh = dami ng nagamit"},
         "tv": {"type": "meter", "appliance": "tv", "show": "both", "level": 0.1, "kwhFrom": 0, "kwhTo": 1, "chip": "100 W × 10 oras = 1 kWh"},
         "bill": {"type": "equation", "lines": [{"text": "Sa bill:"}, {"text": "kWh", "color": "gold", "size": 140}], "icon": "bill"},
         "recap": {"type": "cards", "cards": [{"title": "kW", "lines": ["Power: gaano kabilis"], "tone": "navy"}, {"title": "kWh", "lines": ["Energy: gaano karami"], "tone": "gold"}]},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: U.S. EIA Measuring Electricity & Glossary;", "Meralco schedule of rates (checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "kW at kWh… pareho lang ba 'yan?", ["kWh"], say="Kilowatt at kilowatt-hour… pareho lang ba 'yan?", pause=0.35), GREET,
       cue(3, "kw", "Ang kW ay power: gaano kabilis gumamit ng kuryente.", ["power"], say="Ang kilowatt ay power: gaano kabilis gumamit ng kuryente."),
       cue(4, "kwh", "Ang kWh ay energy: gaano karami ang nagamit.", ["energy"], say="Ang kilowatt-hour ay energy: gaano karami ang nagamit.", pause=0.3),
       cue(5, "tv", "Halimbawa, isang 100-watt na TV.", ["100-watt"], say="Halimbawa, isang one hundred watt na TV.", pause=0.1),
       cue(6, "tv", "Kapag binuksan mo nang 10 oras,", ["10"], say="Kapag binuksan mo nang ten hours,", pause=0.05),
       cue(7, "tv", "1 kWh ang nagamit nito.", ["kWh"], say="one kilowatt-hour ang nagamit nito.", pause=0.3),
       cue(8, "bill", "Sa Meralco bill, kWh ang basehan ng energy charges.", ["kWh"], say="Sa Meralco bill, kilowatt-hours ang basehan ng energy charges.", pause=0.3),
       cue(9, "recap", "Kaya bago mag-solar, kilalanin pareho: kW at kWh.", ["kW", "kWh"], say="Kaya bago mag-solar, kilalanin pareho: kilowatt at kilowatt-hour.", pause=0.4), *CLOSE],
 claims=[claim('E003', 1, 'technical', "kW is a unit of power (rate of energy use).", "Electrical units.", "", ['SRC-EIA-UNITS'], "EIA glossary: kilowatt = 1,000 watts, unit of power."),
         claim('E003', 2, 'technical', "kWh is a unit of energy: 1 kW used for 1 hour.", "Electrical units.", "", ['SRC-EIA-UNITS'], "EIA glossary: kilowatthour = one kilowatt of power expended for one hour."),
         claim('E003', 3, 'technical', "A 100 W TV used for 10 hours uses 1 kWh.", "Arithmetic example at constant 100 W draw.", "Real TV draw varies by model and brightness.", ['SRC-EIA-UNITS'], "100 W × 10 h = 1,000 Wh = 1 kWh (definition)."),
         claim('E003', 4, 'regulatory', "Meralco energy charges are billed per kWh.", "Meralco residential bills (generation, transmission, system loss, distribution).", "Some charges are per customer, not per kWh (see E002).", ['SRC-MER-RATES'], "Meralco schedule of rates lists these components in PhP/kWh.")],
 caption={"main": "kW vs kWh? Ang kW ay power (gaano kabilis), ang kWh ay energy (gaano karami). Ang 100-watt na TV na bukas nang 10 oras = 1 kWh. At kWh ang binibilang sa energy charges ng bill mo. ⚡\n\nSoSmart viewers, ilang kWh ang bill n'yo last month? 👇", "short": "kW = bilis. kWh = dami. ⚡", "thumbnailHeadline": "kW vs kWh", "pinnedComment": "Sources: U.S. EIA Measuring Electricity & Glossary; Meralco schedule of rates (checked 24 Nov 2026).", "discussionQuestion": "Ilang kWh ang monthly consumption n'yo?", "hashtags": TAGS, "cta": "Tingnan ang kWh sa bill mo!"})

EP['E004'] = dict(
 title="Grid-Tied, Hybrid, Off-Grid", pillar="D", template="T03-comparison", cover=["Grid-Tied, Hybrid,", "o Off-Grid?"],
 audience="Homeowners comparing system types", premise="Grid-tied systems shut down in a brownout for safety; hybrid backup depends on battery and wiring; off-grid relies on its own batteries. Their backup capability is not the same.",
 scenes={"hook": {"type": "hook", "icon": "inverter", "chip": "Alin ang para sa'yo?"},
         "types": {"type": "cards", "cards": [{"title": "Grid-tied", "lines": ["Solar + grid", "Walang battery"], "tone": "navy", "icon": "grid"}, {"title": "Hybrid", "lines": ["Solar + grid + battery"], "tone": "gold", "icon": "battery"}, {"title": "Off-grid", "lines": ["Walang grid", "Battery ang sandalan"], "tone": "white", "icon": "house"}]},
         "gt-out": {"type": "outage", "backup": "none", "daytime": True, "chip": "Brownout: off ang grid-tied"},
         "hy-out": {"type": "outage", "backup": "battery", "daytime": False, "chip": "Hybrid + battery + backup wiring"},
         "offgrid": {"type": "sky", "sky": "night", "level": 0, "battery": "discharge", "chip": "Off-grid: battery ang gamit", "barLabel": "solar"},
         "ask": {"type": "checklist", "title": "Itanong muna", "items": ["Ano'ng loads sa brownout?", "Gaano katagal?", "May battery at backup wiring?"]},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: ERC/DOE net-metering interconnection framework; Fronius & SMA", "backup documentation; CleanTechnica (May 2026) (checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "Grid-tied, hybrid, o off-grid: alin ang para sa'yo?", ["hybrid"], pause=0.35), GREET,
       cue(3, "types", "Grid-tied: solar at grid ang magkatuwang, walang battery.", ["Grid-tied"], pause=0.3),
       cue(4, "gt-out", "Kapag brownout, kusa itong namamatay para sa safety.", ["brownout", "safety"], pause=0.3),
       cue(5, "hy-out", "Hybrid: may battery, pero depende sa setup ang backup.", ["Hybrid", "backup"], pause=0.3),
       cue(6, "offgrid", "Off-grid: walang grid, battery ang sandalan sa gabi.", ["Off-grid", "battery"], pause=0.3),
       cue(7, "types", "Kaya hindi pare-pareho ang backup ng tatlo.", ["backup"], pause=0.3),
       cue(8, "ask", "Itanong muna: anong loads ang kailangan sa brownout?", ["loads"], pause=0.4), *CLOSE],
 claims=[claim('E004', 1, 'technical', "A grid-tied system without battery shuts down during a grid outage for safety.", "Grid-tied PV with compliant (anti-islanding) inverters.", "Some special inverters can power limited loads in daytime outages; not typical.", ['SRC-PH-ANTIISL', 'SRC-ERC-NMIS'], "Compliant inverters must disconnect when the grid goes down to avoid backfeeding lines where crews work (PH distributor guidance; ERC NMIS islanding requirement)."),
         claim('E004', 2, 'technical', "A hybrid system's backup depends on its battery and backup setup.", "Hybrid inverters with batteries.", "Backup may cover only critical loads.", ['SRC-FRONIUS-BU', 'SRC-SMA-BU'], "Manufacturer docs: backup needs compatible battery plus backup wiring/switching; not automatic."),
         claim('E004', 3, 'technical', "An off-grid system has no grid connection and relies on its batteries when there is no sun.", "Stand-alone systems.", "Some use generators as well.", ['SRC-DOE-STORAGE'], "Definition of off-grid; storage supplies loads when PV is not producing.")],
 caption={"main": "Grid-tied, hybrid, o off-grid? Ang grid-tied ay namamatay sa brownout para sa safety. Ang hybrid backup ay depende sa battery at setup. Ang off-grid ay battery ang sandalan. Hindi pare-pareho ang backup! 🔋\n\nSoSmart viewers, ano'ng appliances ang gusto n'yong tumakbo sa brownout? 👇", "short": "Grid-tied ≠ hybrid ≠ off-grid. 🔋", "thumbnailHeadline": "Grid-Tied, Hybrid, Off-Grid", "pinnedComment": "Sources: ERC/DOE net-metering interconnection framework; Fronius and SMA backup documentation; CleanTechnica May 2026 (checked 24 Nov 2026). Iba-iba ang backup depende sa equipment at wiring.", "discussionQuestion": "Brownout backup o mas mababang bill: alin ang priority mo?", "hashtags": TAGS, "cta": "Ano'ng loads ang kailangan mo sa brownout?"})

EP['E005'] = dict(
 title="Saan Galing ang Kuryente sa Bahay?", pillar="E", template="T05-energy-flow", cover=["Saan Galing", "ang Kuryente?"],
 audience="Solar owners and prospects", premise="Daytime: solar supplies the home first; surplus can be exported under net metering or charge a battery. At night: battery or grid.",
 scenes={"hook": {"type": "hook", "icon": "house", "chip": "Solar? Grid? Battery?"},
         "day": {"type": "path", "steps": [{"icon": "sun", "label": "Araw"}, {"icon": "panel", "label": "Solar"}, {"icon": "house", "label": "Gamit muna ng bahay"}]},
         "export": {"type": "path", "steps": [{"icon": "house", "label": "Sobra"}, {"icon": "grid", "label": "Export (net metering)"}], "kuyaLeft": True},
         "charge": {"type": "sky", "sky": "sunny", "level": 0.9, "battery": "charge", "chip": "Kung may battery: charge"},
         "night": {"type": "sky", "sky": "night", "level": 0, "battery": "discharge", "chip": "Gabi: battery o grid", "barLabel": "solar"},
         "recap": {"type": "checklist", "title": "Saan galing?", "items": ["Araw: solar muna", "Sobra: export o battery", "Gabi: battery o grid"]},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: Meralco Solar & Net Metering and DER pages;", "U.S. DOE Homeowner's Guide to Going Solar (checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "Saan nga ba galing ang kuryente sa bahay mo?", ["kuryente"], pause=0.35), GREET,
       cue(3, "day", "Habang may araw, solar ang unang sumusuplay sa bahay.", ["solar"], pause=0.3),
       cue(4, "export", "Kapag sobra, puwedeng i-export sa grid kung naka-net metering.", ["net metering"], pause=0.3),
       cue(5, "charge", "Kung may battery, puwede rin itong mag-charge.", ["battery"], pause=0.3),
       cue(6, "night", "Sa gabi, battery o grid na ang nagsu-supply.", ["battery", "grid"], pause=0.3),
       cue(7, "recap", "Kapag alam mo ang daloy, mas madaling magtipid.", ["magtipid"], pause=0.4), *CLOSE],
 claims=[claim('E005', 1, 'technical', "While generating, a solar system supplies the home first.", "Grid-connected self-consumption systems (Meralco area).", "Depends on load at that moment.", ['SRC-MER-NM'], "Meralco: 'Your system supplies the property first while it is generating.'"),
         claim('E005', 2, 'regulatory', "Surplus solar can be exported to the grid under net metering.", "Net-metered customers in the Meralco franchise area.", "Requires an approved net-metering application; export credit is not one-for-one at retail.", ['SRC-MER-NM'], "Meralco net-metering page describes export and peso credits."),
         claim('E005', 3, 'technical', "A battery can store daytime solar for use at night.", "Systems with storage.", "Capacity and configuration limit how much.", ['SRC-DOE-STORAGE'], "DOE: storage lets solar energy be used later, e.g. at night."),
         claim('E005', 4, 'technical', "At night, supply comes from the battery or the grid.", "Grid-connected systems.", "", ['SRC-MER-DER'], "Meralco DER: at night the grid provides electricity.")],
 caption={"main": "Saan galing ang kuryente sa bahay? Araw: solar muna. Sobra: export sa grid (net metering) o charge ng battery. Gabi: battery o grid. 🏠☀️\n\nSoSmart viewers, net metering o battery: alin ang mas bagay sa inyo? 👇", "short": "Solar → bahay → grid/battery. Simple! 🏠", "thumbnailHeadline": "Saan Galing ang Kuryente?", "pinnedComment": "Sources: Meralco Solar & Net Metering and DER pages; U.S. DOE Homeowner's Guide to Going Solar (checked 24 Nov 2026).", "discussionQuestion": "Net metering o battery: alin ang mas bagay sa inyo?", "hashtags": TAGS, "cta": "I-share sa may solar na kakilala!"})

EP['E006'] = dict(
 title="Hybrid-Ready Ba, Automatic Backup Na?", pillar="B", template="T04-myth-check", cover=["Hybrid-Ready ≠", "Automatic Backup"],
 audience="Buyers comparing quotes that say 'hybrid-ready'", premise="'Hybrid-ready' means a battery can be added; backup only works with a compatible battery, backup wiring or critical-loads panel, and a backup-configured inverter.",
 scenes={"hook": {"type": "hook", "icon": "inverter", "icon2": "battery", "chip": "\"Hybrid-ready\" daw"},
         "ne": {"type": "equation", "lines": [{"text": "Hybrid-ready"}, {"text": "≠", "color": "gold", "size": 120}, {"text": "automatic backup"}]},
         "need": {"type": "checklist", "title": "Para may backup", "items": ["Compatible na battery", "Backup wiring / critical loads", "Inverter na naka-set sa backup"]},
         "out": {"type": "outage", "backup": "none", "daytime": False, "chip": "Kulang ang setup: brownout pa rin"},
         "verify": {"type": "cards", "cards": [{"title": "Bago bumili", "lines": ["Ipa-verify sa installer", "ang buong backup setup"], "tone": "gold"}]},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: Fronius Backup Power Function; SMA Battery-Backup Function", "manual (checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "Hybrid-ready daw ang inverter mo. May backup ka na ba?", ["Hybrid-ready", "backup"], pause=0.35), GREET,
       cue(3, "ne", "Hindi pa. Ibig sabihin lang, puwede itong lagyan ng battery.", ["battery"], pause=0.3),
       cue(4, "need", "Para gumana ang backup, kailangan ng compatible na battery,", ["battery"], pause=0.05),
       cue(5, "need", "tamang backup wiring o critical loads panel,", ["wiring"], pause=0.05),
       cue(6, "need", "at inverter na naka-set up talaga para sa backup.", ["backup"], pause=0.3),
       cue(7, "out", "Kung kulang ang mga 'yan, puwedeng brownout ka pa rin.", ["brownout"], pause=0.3),
       cue(8, "verify", "Kaya bago bumili, ipa-verify ang buong backup setup.", ["ipa-verify"], pause=0.4), *CLOSE],
 claims=[claim('E006', 1, 'commercial', "'Hybrid-ready' means a battery can be added; it does not by itself provide backup.", "Battery-ready / hybrid-ready inverters.", "Terminology varies by brand.", ['SRC-FRONIUS-BU', 'SRC-SMA-BU'], "Battery-ready inverters run grid-tied until a compatible battery and backup setup are added."),
         claim('E006', 2, 'technical', "Backup needs a compatible battery, backup wiring or a critical-loads panel, and an inverter configured for backup.", "Hybrid systems.", "Exact requirements depend on the model.", ['SRC-FRONIUS-BU', 'SRC-SMA-BU'], "Manufacturer docs require battery + backup switching/wiring + backup configuration."),
         claim('E006', 3, 'technical', "Without these, the home can still lose power in a brownout.", "Grid-connected inverters without functioning backup.", "", ['SRC-PH-ANTIISL', 'SRC-ERC-NMIS'], "Without backup, anti-islanding shuts the inverter down when the grid fails.")],
 caption={"main": "Hybrid-ready ≠ automatic backup. Para may backup sa brownout: compatible na battery, tamang backup wiring o critical loads panel, at inverter na naka-set up para sa backup. 🔌\n\nSoSmart viewers, naka-hybrid-ready ba ang quote n'yo? 👇", "short": "Hybrid-ready ≠ backup. Ipa-verify muna! 🔌", "thumbnailHeadline": "Hybrid-Ready ≠ Backup", "pinnedComment": "Sources: Fronius Backup Power Function; SMA Battery-Backup Function manual (checked 24 Nov 2026). Iba-iba ang requirements depende sa brand at model.", "discussionQuestion": "Ano'ng gusto n'yong tumakbo pag brownout?", "hashtags": TAGS, "cta": "I-check ang quote mo!"})

EP['E007'] = dict(
 title="Gumagana Ba ang Solar Kapag Maulan?", pillar="B", template="T04-myth-check", cover=["Gumagana Ba", "Kapag Maulan?"],
 audience="Prospects worried about rainy season", premise="Clouds and rain reduce output, sometimes a lot, but generation is often not zero because diffuse light still reaches the panels; judge by monthly kWh.",
 scenes={"hook": {"type": "hook", "icon": "cloud", "chip": "Tag-ulan na!"},
         "sunny": {"type": "sky", "sky": "sunny", "level": 0.9, "chip": "Maaraw"},
         "cloudy": {"type": "sky", "sky": "cloudy", "level": 0.4, "chip": "Maulap: bawas"},
         "rain": {"type": "sky", "sky": "rain", "level": 0.2, "chip": "Maulan: mas bawas"},
         "diffuse": {"type": "sky", "sky": "cloudy", "level": 0.25, "chip": "Diffuse light: hindi zero"},
         "month": {"type": "meter", "appliance": "house", "show": "kwh", "kwhFrom": 0, "kwhTo": 300, "kwhLabel": "tingnan ang buong buwan"},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: U.S. DOE Office of Science; NOAA SciJinks", "\"Solar energy and clouds\" (checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "Umuulan. May silbi pa ba ang solar mo?", ["Umuulan"], pause=0.35), GREET,
       cue(3, "sunny", "Oo, pero mas mahina ang output.", ["mahina"], pause=0.25),
       cue(4, "cloudy", "Kapag maulap, nababawasan ang liwanag sa panels.", ["maulap"], pause=0.1),
       cue(5, "rain", "Kaya bumababa ang output, minsan malaki ang bawas.", ["bumababa"], pause=0.3),
       cue(6, "diffuse", "Pero madalas hindi zero, dahil may diffuse light pa rin.", ["diffuse"], pause=0.3),
       cue(7, "month", "Ang tamang tingin: kWh sa buong buwan, hindi isang araw.", ["kWh"], say="Ang tamang tingin: kilowatt-hours sa buong buwan, hindi isang araw.", pause=0.4), *CLOSE],
 claims=[claim('E007', 1, 'technical', "Clouds and rain reduce solar output, sometimes substantially.", "PV in overcast conditions.", "Reduction varies with cloud thickness; no percentage named.", ['SRC-DOE-CLOUD', 'SRC-NOAA-CLOUD'], "DOE: cloudy days hamper production; NOAA: clouds reduce sunlight reaching panels."),
         claim('E007', 2, 'technical', "Output is often not zero under clouds because diffuse light still reaches the panels.", "Daytime overcast conditions.", "Very heavy cloud can bring output close to zero.", ['SRC-NOAA-CLOUD'], "NOAA SciJinks: clouds reduce but don't completely block sunlight; diffuse light still reaches panels."),
         claim('E007', 3, 'commercial', "Judge solar performance by monthly kWh rather than a single day.", "Performance expectations.", "Advice, not a technical claim.", ['SRC-EIA-UNITS'], "Billing and production are measured in kWh over the billing period.")],
 caption={"main": "Gumagana ba ang solar kapag maulan? Oo, pero mas mahina. Madalas hindi zero dahil may diffuse light pa rin. Ang tamang tingin: kWh sa buong buwan. 🌧️☀️\n\nSoSmart viewers, kumusta ang solar n'yo nitong tag-ulan? 👇", "short": "Maulan? Bawas, pero madalas hindi zero. 🌧️", "thumbnailHeadline": "Solar Kapag Maulan?", "pinnedComment": "Sources: U.S. DOE Office of Science; NOAA SciJinks 'Solar energy and clouds' (checked 24 Nov 2026). Iba-iba ang bawas depende sa kapal ng ulap.", "discussionQuestion": "Kumusta ang solar n'yo nitong tag-ulan?", "hashtags": TAGS, "cta": "I-share sa nagtatanong tungkol sa tag-ulan!"})

EP['E008'] = dict(
 title="Gumagana Ba ang Solar sa Gabi?", pillar="B", template="T04-myth-check", cover=["Gumagana Ba", "ang Solar sa Gabi?"],
 audience="Prospects", premise="Panels need light, so there is no solar generation at night; night-time 'solar' power is stored battery energy from the day, otherwise the grid.",
 scenes={"hook": {"type": "hook", "icon": "moon", "chip": "Solar sa gabi?"},
         "nogen": {"type": "sky", "sky": "night", "level": 0, "chip": "Walang araw, walang output", "barLabel": "solar"},
         "batt": {"type": "sky", "sky": "night", "level": 0, "battery": "discharge", "chip": "Battery: naipon noong araw", "barLabel": "solar", "expr": "smile"},
         "grid": {"type": "path", "dark": True, "steps": [{"icon": "grid", "label": "Grid"}, {"icon": "house", "label": "Gabi"}], "flowColor": "#7FB8EE", "kuyaLeft": True},
         "diff": {"type": "cards", "cards": [{"title": "Solar generation", "lines": ["Habang may liwanag"], "tone": "gold", "icon": "sun"}, {"title": "Stored energy", "lines": ["Battery, para sa gabi"], "tone": "navy", "icon": "battery"}]},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: U.S. EIA Photovoltaics; U.S. DOE Homeowner's Guide;", "Meralco DER page (checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "Gumagana ba ang solar panels sa gabi?", ["gabi"], pause=0.35), GREET,
       cue(3, "nogen", "Hindi. Kailangan ng liwanag para gumawa ng kuryente.", ["liwanag"], pause=0.3),
       cue(4, "batt", "Kung solar ang gamit mo sa gabi,", ["solar"], pause=0.05),
       cue(5, "batt", "galing 'yan sa battery na nag-charge noong araw.", ["battery"], pause=0.3),
       cue(6, "grid", "Kapag wala o ubos na ang battery, grid na ang kukunan.", ["grid"], pause=0.3),
       cue(7, "diff", "Magkaiba ang solar generation at stored energy.", ["stored"], pause=0.4), *CLOSE],
 claims=[claim('E008', 1, 'technical', "Solar panels do not generate electricity at night.", "PV modules.", "Negligible output from artificial or moonlight.", ['SRC-EIA-PV'], "EIA: PV output depends on sunlight."),
         claim('E008', 2, 'technical', "Night-time solar use comes from a battery charged during the day.", "Systems with storage.", "", ['SRC-DOE-STORAGE'], "DOE: storage holds daytime solar for use later."),
         claim('E008', 3, 'technical', "Without a battery, or when it runs out, a grid-connected home uses the grid at night.", "Grid-connected homes.", "", ['SRC-MER-DER'], "Meralco DER: at night the grid provides electricity.")],
 caption={"main": "Gumagana ba ang solar sa gabi? Hindi, kailangan ng liwanag. Kung solar ang gamit mo sa gabi, galing 'yan sa battery na nag-charge noong araw. Kapag wala o ubos na, grid ang kukunan. 🌙🔋\n\nSoSmart viewers, may battery ba kayo o grid lang sa gabi? 👇", "short": "Solar sa gabi? Battery 'yan, hindi panels. 🌙", "thumbnailHeadline": "Solar sa Gabi?", "pinnedComment": "Sources: U.S. EIA Photovoltaics; U.S. DOE Homeowner's Guide to Going Solar; Meralco DER page (checked 24 Nov 2026).", "discussionQuestion": "Battery o grid lang sa gabi?", "hashtags": TAGS, "cta": "I-tag ang nagtanong nito sa'yo!"})

EP['E009'] = dict(
 title="6 kWp Solar, 6 kW Inverter: Pareho Ba?", pillar="E", template="T03-comparison", cover=["6 kWp vs 6 kW:", "Pareho Ba?"],
 audience="Buyers reading quotes", premise="kWp is the panels' DC rating at test conditions; inverter kW is its AC output. Arrays can be larger than the inverter (DC-to-AC ratio); excess at peak is clipped, which is normal if designed correctly.",
 scenes={"hook": {"type": "hook", "icon": "panel", "icon2": "inverter", "chip": "6 kWp? 6 kW?"},
         "two": {"type": "cards", "cards": [{"title": "kWp (panels)", "lines": ["DC rating sa test conditions"], "tone": "gold", "icon": "panel"}, {"title": "kW (inverter)", "lines": ["AC output na kaya nito"], "tone": "navy", "icon": "inverter"}]},
         "ratio": {"type": "equation", "lines": [{"text": "DC-to-AC ratio"}, {"text": "kWp ÷ inverter kW", "color": "gold", "size": 64}]},
         "clip": {"type": "meter", "appliance": "inverter", "show": "kw", "level": 1.0, "kwLabel": "Abot na sa max ng inverter", "chip": "Clipping"},
         "ok": {"type": "checklist", "title": "Normal, basta", "items": ["Tama ang ratio", "Swak sa inverter specs", "Tama ang kalkula ng installer"]},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: NREL TP-5K00-82812 (Inverter Loading Ratio); Penn State", "AE 868 datasheet guide; U.S. DOE inverter basics (checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "6 kWp na solar, 6 kW na inverter. Pareho ba 'yan?", ["kWp", "kW"], say="Six kilowatt peak na solar, six kilowatt na inverter. Pareho ba 'yan?", pause=0.35), GREET,
       cue(3, "two", "Hindi. Ang kWp ay DC rating ng panels sa test conditions.", ["kWp", "DC"], say="Hindi. Ang kilowatt peak ay D-C rating ng panels sa test conditions.", pause=0.1),
       cue(4, "two", "Ang kW ng inverter ay AC output na kaya nitong ilabas.", ["AC"], say="Ang kilowatt ng inverter ay A-C output na kaya nitong ilabas.", pause=0.3),
       cue(5, "ratio", "Puwedeng mas malaki ang panels kaysa inverter.", ["mas malaki"], pause=0.05),
       cue(6, "ratio", "Tinatawag itong DC-to-AC ratio.", ["ratio"], say="Tinatawag itong D-C to A-C ratio.", pause=0.3),
       cue(7, "clip", "Kapag sobra ang DC sa tanghali, may clipping.", ["clipping"], say="Kapag sobra ang D-C sa tanghali, may clipping.", pause=0.3),
       cue(8, "ok", "Normal 'yan, basta tama ang design at kalkula.", ["design"], pause=0.4), *CLOSE],
 claims=[claim('E009', 1, 'technical', "kWp is the panels' DC rating at standard test conditions.", "PV array nameplate.", "", ['SRC-NREL-STC'], "Module ratings are DC power at STC."),
         claim('E009', 2, 'technical', "An inverter's kW rating is its AC output capacity.", "Inverters.", "", ['SRC-DOE-INV', 'SRC-NREL-ILR'], "NREL: ILR = rated DC / rated AC; inverter rating is AC."),
         claim('E009', 3, 'technical', "The array can be larger than the inverter; this is the DC-to-AC ratio.", "System design.", "Within manufacturer limits.", ['SRC-NREL-ILR'], "NREL: ILR = rated DC power / rated AC power; designs increasingly use ratios above 1."),
         claim('E009', 4, 'technical', "When DC power exceeds the inverter's limit at peak, the excess is clipped; normal if designed correctly.", "Oversized arrays.", "Excessive ratios lose more energy.", ['SRC-NREL-ILR'], "NREL: clipping appears as a flat line at the inverter's AC capacity; small losses at typical ratios.")],
 caption={"main": "6 kWp solar, 6 kW inverter: pareho ba? Hindi! Ang kWp ay DC rating ng panels, ang kW ng inverter ay AC output. Puwedeng mas malaki ang panels (DC-to-AC ratio), at normal ang konting clipping basta tama ang design. ⚙️\n\nSoSmart viewers, ano'ng nakasulat sa quote n'yo? 👇", "short": "kWp ≠ inverter kW. ⚙️", "thumbnailHeadline": "6 kWp vs 6 kW", "pinnedComment": "Sources: NREL TP-5K00-82812 (Inverter Loading Ratio); Penn State AE 868 datasheet guide; U.S. DOE inverter basics (checked 24 Nov 2026).", "discussionQuestion": "Ano'ng size ng system sa quote n'yo?", "hashtags": TAGS, "cta": "I-check ang quote mo!"})

EP['E010'] = dict(
 title="Bakit Hindi Laging Full Power ang Panels?", pillar="E", template="T02-explainer", cover=["Bakit Hindi", "Laging Full Power?"],
 audience="New solar owners checking their app", premise="Panel ratings come from standard test conditions (1000 W/m², 25°C cell). On real roofs panels run hotter, and heat lowers output; shade, dust and sun angle also reduce it, so actual output is normally below the rating.",
 scenes={"hook": {"type": "hook", "icon": "panel", "chip": "Rated watts… pero bakit kulang?"},
         "stc": {"type": "equation", "lines": [{"text": "STC (lab test)"}, {"text": "1000 W/m²", "color": "gold"}, {"text": "25°C cell temperature", "size": 60}]},
         "hot": {"type": "sky", "sky": "sunny", "level": 0.75, "chip": "Mainit = bawas output"},
         "factors": {"type": "checklist", "title": "Nakakabawas", "items": ["Init ng panels", "Anino o lilim", "Dumi at alikabok", "Anggulo ng araw"], "mark": "cross"},
         "normal": {"type": "cards", "cards": [{"title": "Rating", "lines": ["Sa lab, ideal"], "tone": "white", "icon": "panel"}, {"title": "Aktwal", "lines": ["Sa bubong, normal na mas mababa"], "tone": "gold", "icon": "sun"}]},
         "close": {"type": "close"}, "endcard": {"type": "endcard", "sources": ["Sources: NREL STC & PVWatts loss model; Penn State AE 868", "datasheet guide (checked 24 Nov 2026)"]}},
 cues=[cue(1, "hook", "Bakit hindi umaabot sa rated watts ang panels mo?", ["rated"], pause=0.35), GREET,
       cue(3, "stc", "Ang rating ay galing sa lab test: standard test conditions.", ["standard"], pause=0.1),
       cue(4, "stc", "1000 W/m² na liwanag at 25°C na cell temperature.", ["1000", "25°C"], say="One thousand watts per square meter na liwanag, at twenty-five degrees na cell temperature.", pause=0.3),
       cue(5, "hot", "Sa totoong bubong, mas mainit ang panels,", ["mainit"], pause=0.05),
       cue(6, "hot", "at kapag mas mainit, bumababa ang output.", ["bumababa"], pause=0.3),
       cue(7, "factors", "May epekto rin ang anino, alikabok, at anggulo ng araw.", ["anino", "alikabok"], pause=0.3),
       cue(8, "normal", "Kaya normal na mas mababa ang aktwal kaysa rating.", ["normal"], pause=0.4), *CLOSE],
 claims=[claim('E010', 1, 'technical', "Panel ratings come from standard test conditions: 1000 W/m² irradiance and 25°C cell temperature.", "PV module datasheets.", "STC also specifies AM1.5 spectrum (not named on screen).", ['SRC-NREL-STC'], "NREL / Penn State: STC = 1000 W/m², 25°C cell, AM1.5."),
         claim('E010', 2, 'technical', "Panels on real roofs run hotter than 25°C, and higher temperature lowers output.", "Crystalline-silicon modules.", "No percentage named; depends on temperature coefficient.", ['SRC-NREL-STC'], "Negative temperature coefficient of power (typ. −0.3 to −0.4 %/°C); rooftop cells usually exceed 25°C in sun."),
         claim('E010', 3, 'technical', "Shade, dust and sun angle also reduce output.", "Rooftop PV.", "", ['SRC-NREL-PVW'], "PVWatts loss model includes soiling and shading; irradiance on panel depends on sun angle."),
         claim('E010', 4, 'technical', "Actual output is normally below the nameplate rating.", "Typical operation.", "Brief exceedance possible in cool, very bright conditions.", ['SRC-NREL-STC', 'SRC-NREL-PVW'], "Follows from claims 1 to 3.")],
 caption={"main": "Bakit hindi laging full power ang panels? Ang rating ay galing sa lab (STC: 1000 W/m², 25°C cell). Sa bubong, mas mainit ang panels, at may anino, alikabok at anggulo ng araw. Kaya normal na mas mababa ang aktwal. 🌡️☀️\n\nSoSmart viewers, ano'ng peak output na nakita n'yo sa app? 👇", "short": "Rated watts = lab result. Normal na mas mababa sa bubong. 🌡️", "thumbnailHeadline": "Bakit Hindi Full Power?", "pinnedComment": "Sources: NREL STC & PVWatts loss model; Penn State AE 868 datasheet guide (checked 24 Nov 2026).", "discussionQuestion": "Ano'ng peak output na nakita n'yo sa app?", "hashtags": TAGS, "cta": "I-share sa bagong may solar!"})

for eid, d in EP.items():
    used = sorted({s for c in d['claims'] for s in c['sources']})
    ep = {"id": eid, "title": d['title'], "pillar": d['pillar'], "template": d['template'], "audience": d['audience'], "premise": d['premise'],
          "openingPattern": "A-question-first", "greetingId": "greet-default", "catchphraseId": "close-signature",
          "scriptBasis": "Claude draft from the 104-episode backlog title/angle, V1.1 brand lines; claims checked online 2026-11-24.", "scriptVersion": 1,
          "voice": "production", "cover": d['cover'], "scenes": d['scenes'], "cues": d['cues'], "claims": d['claims'],
          "sources": [{"id": s, **SRC[s], "published": None, "retrieved": "2026-11-24", "freshness": "re-verify before publication"} for s in used],
          "caption": d['caption']}
    os.makedirs(f'episodes/{eid}', exist_ok=True)
    json.dump(ep, open(f'episodes/{eid}/episode.json', 'w'), ensure_ascii=False, indent=1)
    print(eid, len(ep['cues']), 'cues', max(len(c['text']) for c in ep['cues']), 'max chars')
