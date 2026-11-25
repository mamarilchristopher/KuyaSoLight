"""Writes episode.json for E011-E020 (scripts, scenes, claims, sources, captions) and the per-platform
upload-pack caption files in /mnt/project-files/kuya-solight/E0xx/post/.
Scripts by Claude from the episode plan (data/episodes.json); claims checked online 2026-11-25.
Style rules (owner feedback): all-Tagalog single-thought lines, no English filler openers, every 'to read 'toh'.
Run: python3 episodes/_make_e011_e020.py   (keeps any existing ownerApproval)"""
import json, os

AT = '2026-11-25T05:45:00+08:00'
POLICY = "Owner (CHRIS) waived the human technical reviewer for now on 2026-11-24; claims checked online against published data instead."
GREET = {"id": "c02", "scene": "identity", "text": "Hello, SoSmart viewers! Kuya SoLight 'to!", "gold": ["SoSmart", "SoLight"], "pauseAfter": 0.35, "elSpeed": 1.15, "standalone": True}
CLOSE = [{"id": "cz1", "scene": "close", "text": "Dahil ang gusto ni Kuya SoLight… naka-solar ka na, SoSmart ka pa!", "gold": ["SoSmart"], "pauseAfter": 0.35, "audioFile": "assets/voice/locked/outro-catchphrase-O3.wav"},
         {"id": "cz2", "scene": "endcard", "text": "Life is SoLight with Solar.", "pauseAfter": 0.2, "audioFile": "assets/voice/locked/outro-tagline-O3.wav"}]
KWH = "kilowatt-hour"

SRC = {
 'SRC-EIA-PV': {"tier": 1, "publisher": "U.S. Energy Information Administration", "title": "Photovoltaics and electricity", "url": "https://www.eia.gov/energyexplained/solar/photovoltaics-and-electricity.php", "jurisdiction": "General technical reference", "excerpts": ["PV cells convert sunlight directly into electricity (DC); output depends on available sunlight."]},
 'SRC-DOE-INV': {"tier": 1, "publisher": "U.S. Department of Energy", "title": "Solar Integration: Inverters and Grid Services Basics", "url": "https://www.energy.gov/eere/solar/solar-integration-inverters-and-grid-services-basics", "jurisdiction": "General technical reference", "excerpts": ["Inverters change the variable direct current (DC) output of PV into alternating current (AC) for the grid and household use."]},
 'SRC-DOE-STORAGE': {"tier": 1, "publisher": "U.S. Department of Energy", "title": "Homeowner's Guide to Going Solar (solar-plus-storage)", "url": "https://www.energy.gov/eere/solar/homeowners-guide-going-solar", "jurisdiction": "General technical reference", "excerpts": ["Batteries can store solar energy produced during the day for use at night or during outages, if the system is designed for it."]},
 'SRC-MER-NM': {"tier": 1, "publisher": "Manila Electric Company (Meralco)", "title": "Solar and Net Metering", "url": "https://www.meralco.com.ph/residential/energy-solutions/solar-and-renewables/solar-net-metering", "jurisdiction": "Philippines, Meralco franchise area", "excerpts": ["Your system supplies the property first while it is generating.", "The Meralco grid supplies the property when renewable generation is not enough.", "an exported kilowatt-hour is not exchanged one-for-one at the full retail rate.", "The Net Metering peso credit is applied to eligible bill charges under the current rules,", "based on the applicable monthly blended generation cost rather than the full retail rate. (FAQ 11)"]},
 'SRC-MER-DER': {"tier": 1, "publisher": "Manila Electric Company (Meralco)", "title": "Distributed Energy Resources", "url": "https://www.meralco.com.ph/residential/energy-solutions/solar-and-renewables/distributed-energy-resources", "jurisdiction": "Philippines, Meralco franchise area", "excerpts": ["At times when there is no sunlight, or at night, the grid will provide electricity."]},
 'SRC-MER-RATES': {"tier": 1, "publisher": "Manila Electric Company (Meralco)", "title": "Summary Schedule of Rates, November 2026 billing", "url": "https://www.meralco.com.ph/uploads/documents/regulatory/rates/11-2026-Rate-Schedule-v2.pdf", "jurisdiction": "Philippines, Meralco franchise area", "excerpts": ["Residential rows list per-kWh components: generation, transmission, system loss, distribution, supply, universal charges, FIT-All, lifeline subsidy, etc."]},
 'SRC-DOE-NM-2017': {"tier": 1, "publisher": "Department of Energy (REMB)", "title": "Net Metering Program presentation", "url": "https://legacy.doe.gov.ph/sites/default/files/pdf/announcements/04_remb_net_metering.pdf", "jurisdiction": "Philippines", "excerpts": ["Qualified end-users apply with their distribution utility; net-metering uses metering that records both import and export energy.", "Interim pricing for export energy is the DU's monthly blended generation cost."]},
 'SRC-FK-BILL': {"tier": 2, "publisher": "FilipiKnow", "title": "How to Compute Your Meralco Bill", "url": "https://filipiknow.net/how-to-compute-meralco-bill/", "jurisdiction": "Philippines, Meralco franchise area", "excerpts": ["Billing period: the date range of the bill, about 30 days.", "kWh consumption = present reading minus previous reading (times the multiplier, usually 1)."]},
 'SRC-MM-BILL': {"tier": 2, "publisher": "Moneymax", "title": "How to Compute Meralco Bill", "url": "https://www.moneymax.ph/personal-finance/articles/meralco-bill-computation", "jurisdiction": "Philippines, Meralco franchise area", "excerpts": ["The bill lists generation, transmission, system loss, distribution and other charges.", "The amount to pay can include remaining balance from a previous bill, so it can be higher than current charges alone."]},
 'SRC-UMD-SIZE': {"tier": 1, "publisher": "University of Maryland Extension", "title": "Working on Solar: Design and System Sizing (FS-2023-0655)", "url": "https://extension.umd.edu/resource/working-solar-design-and-system-sizing-fs-2023-0655", "jurisdiction": "General technical reference", "excerpts": ["Preliminary size: energy use divided by peak sun hours; use 12-24 months of kWh history; treat as a first estimate before site-specific design."]},
 'SRC-UIL-SIZE': {"tier": 1, "publisher": "University of Illinois Extension", "title": "Estimate system size and cost", "url": "https://extension.illinois.edu/energy/estimate-system-size-and-cost", "jurisdiction": "General technical reference", "excerpts": ["Average your monthly kWh from past bills, then divide by local sun hours to estimate system size."]},
 'SRC-NREL-PVW': {"tier": 1, "publisher": "National Renewable Energy Laboratory", "title": "PVWatts Calculator (system losses: soiling, shading, orientation)", "url": "https://pvwatts.nrel.gov/", "jurisdiction": "General technical reference", "excerpts": ["Output depends on location, tilt, azimuth (direction), shading and other system losses."]},
 'SRC-ES-RETRO': {"tier": 2, "publisher": "EnergySage", "title": "Adding a battery to a solar system: can you do it?", "url": "https://www.energysage.com/energy-storage/adding-battery-to-solar-energy-system-as-retrofit/", "jurisdiction": "General technical reference", "excerpts": ["With a hybrid inverter, a compatible battery can usually be added (DC-coupled).", "With a standard inverter, an AC-coupled battery adds its own battery inverter."]},
 'SRC-SQ-READY': {"tier": 2, "publisher": "SolarQuotes", "title": "\"Battery Ready\" Solar Systems, And How To Buy One", "url": "https://www.solarquotes.com.au/battery-storage/battery-ready/", "jurisdiction": "General technical reference", "excerpts": ["\"Battery ready\" is used loosely; being able to simply add batteries later requires a hybrid inverter, so confirm what the seller means."]},
 'SRC-FRONIUS-BU': {"tier": 2, "publisher": "Fronius International (manufacturer documentation)", "title": "Backup power function", "url": "https://www.fronius.com/en-in/india/solar-energy/installers-partners/products-solutions/features/backup-power-function", "jurisdiction": "Manufacturer reference", "excerpts": ["Backup operation requires a compatible battery and the appropriate backup wiring/switching to separate the home circuits from the grid."]},
 'SRC-SMA-BU': {"tier": 2, "publisher": "SMA Solar Technology (manual)", "title": "Battery-backup function", "url": "https://manuals.sma.de/STPHxx-60/en-US/16945435403.html", "jurisdiction": "Manufacturer reference", "excerpts": ["Battery-backup operation must be set up and wired as a backup system."]},
 'SRC-ERC-NMIS': {"tier": 1, "publisher": "Energy Regulatory Commission / DOE", "title": "Net-Metering Rules and Interconnection Standards (Philippine Distribution Code framework)", "url": "https://doe.gov.ph/electric-power/philippine-distribution-code", "jurisdiction": "Philippines", "excerpts": ["Net-metered systems follow the Philippine Distribution Code and ERC Net-Metering Interconnection Standards, which include islanding protection."]},
 'SRC-PH-ANTIISL': {"tier": 2, "publisher": "CleanTechnica (reporting Philippine distributor guidance)", "title": "Guerilla solar installations need to be controlled, says Philippine power distributor", "url": "https://cleantechnica.com/2026/05/04/guerilla-solar-installations-discovered-need-to-be-controlled-says-philippine-power-distributor/", "jurisdiction": "Philippines", "excerpts": ["In a compliant system, the inverter must immediately disconnect when the grid goes down to prevent backfeeding electricity into power lines."]},
 'SRC-NREL-ISL': {"tier": 1, "publisher": "National Renewable Energy Laboratory", "title": "Unintentional islanding requirement of IEEE Std 1547-2018 (NREL/TP-5D00-77782)", "url": "https://www.nrel.gov/docs/fy22osti/77782.pdf", "jurisdiction": "General technical reference", "excerpts": ["Anti-islanding requires inverters to stop energizing a de-energized grid section; a key reason is personnel (line worker) safety."]},
 'SRC-ES-CRIT': {"tier": 2, "publisher": "EnergySage", "title": "Critical load panels, explained", "url": "https://www.energysage.com/energy-storage/what-are-critical-load-panels/", "jurisdiction": "General technical reference", "excerpts": ["Batteries are often wired to a separate critical loads subpanel.", "Typical essential loads: refrigeration, lights, internet equipment, selected outlets; leaving out large air-conditioning/heating loads makes backup last longer."]},
}

def claim(ep, n, wording, scope, caveats, sources, note):
    return {"id": f"CL-{ep}-{n:02d}", "category": "technical", "wording": wording, "scope": scope, "caveats": caveats, "sources": sources, "status": "verified",
            "verifiedBy": None, "technicalSignoff": "online-checked", "onlineCheck": {"by": "Claude (online fact check)", "at": AT, "policy": POLICY, "note": note}}

# Body delivery preset (owner said the energetic body read sounded rushed/unnatural, 2026-11-25).
DELIVERY = json.load(open('assets/voice/production.json')).get('bodyDelivery') or {"stability": 0.40, "style": 0.45, "speed": 1.0, "pause": 0.55}

def cue(i, scene, text, gold=(), say=None, pause=0.25):
    c = {"id": f"c{i:02d}", "scene": scene, "text": text, "gold": list(gold), "pauseAfter": max(pause, DELIVERY['pause'])}
    if say: c["say"] = say
    if i == 1: c.update({"standalone": True, "elSettings": {"stability": 0.25, "style": 0.9}, "pauseAfter": 0.4})  # locked H1 hook style
    else: c.update({"elSettings": {"stability": DELIVERY['stability'], "style": DELIVERY['style']}, "elSpeed": DELIVERY['speed']})
    return c

def end(src): return {"close": {"type": "close"}, "endcard": {"type": "endcard", "sources": src}}

EP = {}
EP['E011'] = dict(title="Paano Basahin ang Meralco Bill?", pillar="C", template="T-explainer", cover=["Paano Basahin", "ang Meralco Bill?"],
 audience="Homeowners reading their bill before asking for a solar quote", premise="Billing period, kWh from meter readings, and itemised charges: the kWh figure is what matters for solar planning.",
 scenes={"hook": {"type": "hook", "icon": "bill", "chip": "Meralco bill"},
         "period": {"type": "cards", "cards": [{"title": "Billing period", "lines": ["Mga isang buwan", "Petsa ng simula at tapos"], "tone": "navy", "icon": "bill"}]},
         "kwh": {"type": "equation", "lines": [{"text": "Present reading"}, {"text": "− Previous reading"}, {"text": "= kWh na nagamit", "color": "gold", "size": 80}]},
         "meter": {"type": "meter", "appliance": "house", "show": "kwh", "kwhFrom": 0, "kwhTo": 250, "kwhLabel": "dami ng nagamit"},
         "charges": {"type": "checklist", "title": "Mga charges", "items": ["Generation", "Transmission", "Distribution", "System loss at iba pa"]},
         "focus": {"type": "cards", "cards": [{"title": "kWh", "lines": ["Basehan ng solar plan"], "tone": "gold", "icon": "panel"}]},
         **end(["Sources: Meralco schedule of rates (Nov 2026); FilipiKnow & Moneymax", "Meralco bill guides; UMD Extension sizing guide (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Alam mo ba kung paano basahin ang Meralco bill mo?", ["Meralco bill"], pause=0.35), GREET,
       cue(3, "period", "Una, tingnan ang billing period, mga isang buwan 'yan.", ["billing period"]),
       cue(4, "kwh", "Ikalawa, ang kWh: present reading bawas previous reading.", ["kWh"], say=f"Ikalawa, ang {KWH}: present reading, bawas previous reading."),
       cue(5, "meter", "'Yan ang totoong dami ng kuryenteng nagamit mo.", ["nagamit"], pause=0.3),
       cue(6, "charges", "Ikatlo, ang mga charges: generation, transmission, distribution, at iba pa.", ["charges"], pause=0.3),
       cue(7, "focus", "Sa solar, ang kWh ang mahalagang basehan, hindi lang ang piso.", ["kWh"], say=f"Sa solar, ang {KWH} ang mahalagang basehan, hindi lang ang piso.", pause=0.4), *CLOSE],
 claims=[claim('E011', 1, "The billing period is the date range covered by the bill, about one month.", "Meralco residential bills.", "Exact days vary.", ['SRC-FK-BILL'], "Bill guides: billing period ~30 days between meter reading dates."),
         claim('E011', 2, "kWh consumption equals present reading minus previous reading (times the meter multiplier, usually 1).", "Meralco residential bills.", "Multiplier not mentioned on screen; usually 1 for homes.", ['SRC-FK-BILL', 'SRC-MM-BILL'], "Bill guides: registered kWh = (present - previous) x multiplier."),
         claim('E011', 3, "The bill itemises charges such as generation, transmission, distribution and system loss.", "Meralco residential bills.", "Full list longer; 'at iba pa' covers the rest.", ['SRC-MER-RATES', 'SRC-MM-BILL'], "Rate schedule lists these per-kWh components."),
         claim('E011', 4, "For solar planning, monthly kWh use is the key basis.", "Preliminary solar sizing.", "", ['SRC-UMD-SIZE', 'SRC-UIL-SIZE'], "Extension guides size systems from kWh history.")],
 caps=dict(fb_hook="Marunong ka bang magbasa ng Meralco bill mo? 🧾", fb_points=["📅 Billing period: mga isang buwan ang sakop", "🔢 kWh = present reading bawas previous reading", "💡 Charges: generation, transmission, distribution, system loss at iba pa", "☀️ Sa solar, kWh ang basehan, hindi lang ang piso"], fb_q="SoSmart viewers, ilang kWh ang nagamit n'yo last month? 👇",
           tt="Paano basahin ang Meralco bill: billing period, kWh at charges 🧾 #MeralcoBill #SolarPH #KuyaSoLight #LearnOnTikTok #TipidKuryente",
           yt_title="Paano Basahin ang Meralco Bill? kWh, Billing Period at Charges #Shorts", yt_lead="Paano ba basahin ang Meralco bill? Heto ang dapat mong tingnan bago humingi ng solar quote:",
           tags="paano basahin meralco bill, meralco bill kwh, meralco bill explained, billing period meralco, solar philippines, kuya solight", hashtags="#MeralcoBill #SolarPH #KuyaSoLight"))

EP['E012'] = dict(title="Total Amount Due vs Current Electricity Use", pillar="C", template="T-explainer", cover=["Total Amount Due", "o Current Use?"],
 audience="Homeowners preparing bill data for a solar quote", premise="Total amount due can include previous balances; size solar from monthly kWh history, ideally 12 months.",
 scenes={"hook": {"type": "hook", "icon": "bill", "chip": "Total amount due?"},
         "two": {"type": "cards", "cards": [{"title": "Current charges", "lines": ["Nagamit ngayong buwan"], "tone": "navy", "icon": "house"}, {"title": "Previous balance", "lines": ["Hindi pa nabayaran dati"], "tone": "white", "icon": "bill"}]},
         "meter": {"type": "meter", "appliance": "house", "show": "kwh", "kwhFrom": 0, "kwhTo": 300, "kwhLabel": "kWh kada buwan"},
         "year": {"type": "checklist", "title": "Para sa solar quote", "items": ["kWh ng 12 buwan", "Average kada buwan", "Hindi ang total amount due"]},
         "fit": {"type": "equation", "lines": [{"text": "Tamang data"}, {"text": "= tamang laki", "color": "gold", "size": 80}, {"text": "ng solar"}], "icon": "panel"},
         **end(["Sources: Moneymax & FilipiKnow Meralco bill guides; UMD and", "Illinois Extension solar sizing guides (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Total amount due ba ang basehan ng solar mo?", ["Total amount due"], pause=0.35), GREET,
       cue(3, "two", "Minsan, kasama sa total ang hindi pa nabayarang balance.", ["balance"]),
       cue(4, "two", "Kaya puwedeng mas malaki ito kaysa sa nagamit mo ngayong buwan.", ["mas malaki"], pause=0.3),
       cue(5, "meter", "Ang dapat tingnan, ang kWh na nagamit kada buwan.", ["kWh"], say=f"Ang dapat tingnan, ang {KWH} na nagamit kada buwan.", pause=0.3),
       cue(6, "year", "Mas maganda kung may kWh ka ng isang taon, para kita ang average.", ["isang taon"], say=f"Mas maganda kung may {KWH} ka ng isang taon, para kita ang average.", pause=0.3),
       cue(7, "fit", "Para tama ang laki ng solar na irerekomenda sa'yo.", ["tama"], pause=0.4), *CLOSE],
 claims=[claim('E012', 1, "The amount due can include a remaining balance from a previous bill.", "Meralco residential bills.", "", ['SRC-MM-BILL'], "Bill guide: amount to pay includes remaining balance from previous bill."),
         claim('E012', 2, "So the total due can be higher than the current month's use.", "Meralco residential bills.", "", ['SRC-MM-BILL'], "Follows from claim 1."),
         claim('E012', 3, "Solar sizing should start from monthly kWh use, ideally averaged over about a year.", "Preliminary sizing.", "Guides suggest 12-24 months.", ['SRC-UMD-SIZE', 'SRC-UIL-SIZE'], "Extension guides: average 12-24 months of kWh.")],
 caps=dict(fb_hook="Total amount due ba ang ginagamit mong basehan para sa solar? 🤔 Baka mali ang laki ng mabili mo!", fb_points=["🧾 Puwedeng kasama sa total ang hindi pa nabayarang balance", "📈 Kaya puwedeng mas malaki ito kaysa sa nagamit mo ngayong buwan", "🔢 Ang tamang basehan: kWh na nagamit kada buwan", "📅 Mas maganda kung may 12 buwan ng kWh para kita ang average"], fb_q="SoSmart viewers, alam n'yo ba ang average kWh n'yo kada buwan? 👇",
           tt="Total amount due ≠ nagamit mong kuryente! kWh ang basehan ng solar 🧾 #MeralcoBill #SolarPH #KuyaSoLight #LearnOnTikTok #SolarTips",
           yt_title="Total Amount Due vs kWh: Ano ang Basehan ng Solar Size? #Shorts", yt_lead="Total amount due ba ang basehan ng solar mo? Heto kung bakit kWh ang dapat tingnan:",
           tags="meralco total amount due, kwh consumption, solar size philippines, solar quote tips, meralco bill solar, kuya solight", hashtags="#MeralcoBill #SolarPH #KuyaSoLight"))

EP['E013'] = dict(title="Daytime vs Nighttime Consumption", pillar="D", template="T-explainer", cover=["Araw o Gabi:", "Kailan Ka Gumagamit?"],
 audience="Homeowners planning solar savings", premise="Solar produces only in daylight; night use comes from grid or battery, so load timing changes how much solar you use directly.",
 scenes={"hook": {"type": "hook", "icon": "sun", "icon2": "moon", "chip": "Araw o gabi?"},
         "day": {"type": "sky", "sky": "sunny", "level": 0.9, "chip": "Solar: araw lang"},
         "dayuse": {"type": "path", "steps": [{"icon": "sun", "label": "araw"}, {"icon": "panel", "label": "solar"}, {"icon": "house", "label": "gamit ngayon"}]},
         "night": {"type": "sky", "sky": "night", "level": 0, "chip": "Gabi: grid o battery", "barLabel": "solar"},
         "loads": {"type": "cards", "cards": [{"title": "Araw", "lines": ["Ref, electric fan, labada"], "tone": "gold", "icon": "sun"}, {"title": "Gabi", "lines": ["Aircon, ilaw, TV"], "tone": "navy", "icon": "moon"}]},
         "shift": {"type": "checklist", "title": "Para mas sulit", "items": ["Alamin kung kailan ka gumagamit", "Ilipat sa araw ang kaya", "Tulad ng labada at plantsa"]},
         **end(["Sources: U.S. EIA solar basics; Meralco Solar & Net Metering", "and DER pages; U.S. DOE (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Kailan ka mas gumagamit ng kuryente? Sa araw, o sa gabi?", ["araw", "gabi"], pause=0.35), GREET,
       cue(3, "day", "Sa araw lang gumagawa ng kuryente ang solar.", ["araw lang"]),
       cue(4, "dayuse", "Kaya pinakasulit ito kapag ginagamit mo habang may araw.", ["pinakasulit"], pause=0.3),
       cue(5, "night", "Sa gabi, galing sa grid o battery ang kuryente mo.", ["grid", "battery"], pause=0.3),
       cue(6, "loads", "Kaya mahalagang alamin kung kailan tumatakbo ang appliances mo.", ["kailan"], pause=0.3),
       cue(7, "shift", "Puwede mo ring ilipat sa araw ang ilang gawain, tulad ng labada.", ["labada"], pause=0.4), *CLOSE],
 claims=[claim('E013', 1, "Solar panels produce electricity only when there is sunlight.", "PV generation.", "", ['SRC-EIA-PV'], "EIA: PV converts sunlight into electricity."),
         claim('E013', 2, "Solar supplies the home first while it is generating, so daytime use gets the most direct benefit.", "Grid-connected homes.", "", ['SRC-MER-NM'], "Meralco: system supplies the property first while generating."),
         claim('E013', 3, "At night, power comes from the grid or a battery.", "Grid-connected homes.", "Battery only if installed.", ['SRC-MER-DER', 'SRC-DOE-STORAGE'], "Meralco DER: at night the grid provides electricity; DOE: batteries store daytime solar."),
         claim('E013', 4, "Shifting some loads like laundry to daytime increases direct solar use.", "Self-consumption.", "Example only; savings depend on setup.", ['SRC-MER-NM'], "Follows from claim 2.")],
 caps=dict(fb_hook="Araw o gabi: kailan ka mas gumagamit ng kuryente? ☀️🌙 Malaking bagay 'to sa solar!", fb_points=["☀️ Sa araw lang gumagawa ng kuryente ang solar", "🏠 Pinakasulit kapag ginagamit habang may araw", "🌙 Sa gabi, grid o battery ang supply", "🧺 Tip: ilipat sa araw ang ilang gawain, tulad ng labada"], fb_q="SoSmart viewers, mas malakas ba kayo sa kuryente sa araw o sa gabi? 👇",
           tt="Solar = araw lang! Kaya alamin kung kailan ka gumagamit ng kuryente ☀️🌙 #SolarPH #TipidKuryente #KuyaSoLight #LearnOnTikTok #SolarTips",
           yt_title="Araw o Gabi? Bakit Mahalaga Kung Kailan Ka Gumagamit ng Kuryente sa Solar #Shorts", yt_lead="Sa araw lang gumagawa ng kuryente ang solar. Kaya mahalaga kung kailan ka gumagamit:",
           tags="solar daytime consumption, solar sa gabi, solar philippines, tipid kuryente, self consumption solar, kuya solight", hashtags="#SolarPH #TipidKuryente #KuyaSoLight"))

EP['E014'] = dict(title="Paano Tinatantiya ang Solar System Size?", pillar="C", template="T-explainer", cover=["Ilang kW ang", "Solar na Kailangan Mo?"],
 audience="Homeowners comparing solar quotes", premise="Preliminary size = daily kWh divided by local sun hours; it is only an estimate until roof, shade and load timing are checked.",
 scenes={"hook": {"type": "hook", "icon": "panel", "chip": "Ilang kW?"},
         "meter": {"type": "meter", "appliance": "house", "show": "kwh", "kwhFrom": 0, "kwhTo": 300, "kwhLabel": "kWh kada buwan"},
         "math": {"type": "equation", "lines": [{"text": "kWh kada araw"}, {"text": "÷ sun hours"}, {"text": "= tantiyang kWp", "color": "gold", "size": 80}]},
         "est": {"type": "cards", "cards": [{"title": "Tantiya lang", "lines": ["Galing lang sa bill"], "tone": "gold", "icon": "bill"}]},
         "check": {"type": "checklist", "title": "Titingnan pa", "items": ["Laki at direksyon ng bubong", "Anino ng puno o gusali", "Kailan ka gumagamit"]},
         "visit": {"type": "cards", "cards": [{"title": "Site visit", "lines": ["Bago ang final quote"], "tone": "navy", "icon": "house"}]},
         **end(["Sources: UMD & Illinois Extension solar sizing guides; NREL PVWatts;", "Meralco Solar & Net Metering (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Paano malalaman kung ilang kW ang solar na kailangan mo?", ["kW"], say="Paano malalaman kung ilang kilowatt ang solar na kailangan mo?", pause=0.35), GREET,
       cue(3, "meter", "Nagsisimula 'yan sa kWh na nagamit mo kada buwan.", ["kWh"], say=f"Nagsisimula 'yan sa {KWH} na nagamit mo kada buwan.", pause=0.3),
       cue(4, "math", "Gawin itong kada araw, tapos hatiin sa sun hours ng lugar mo.", ["sun hours"], pause=0.3),
       cue(5, "est", "Pero tantiya lang 'yan, kasi galing lang sa bill.", ["tantiya lang"], pause=0.3),
       cue(6, "check", "Titingnan pa ang bubong, ang anino, at kung kailan ka gumagamit.", ["bubong", "anino"], pause=0.3),
       cue(7, "visit", "Kaya mahalaga ang site visit bago ang final na quote.", ["site visit"], pause=0.4), *CLOSE],
 claims=[claim('E014', 1, "Preliminary sizing starts from monthly kWh use.", "Residential PV.", "", ['SRC-UMD-SIZE', 'SRC-UIL-SIZE'], "Extension guides."),
         claim('E014', 2, "Rough size = daily kWh divided by local peak sun hours.", "Preliminary sizing.", "Real designs add a derate for losses; not named on screen.", ['SRC-UMD-SIZE', 'SRC-UIL-SIZE'], "Extension guides: energy use / peak sun hours (with efficiency factor)."),
         claim('E014', 3, "A bill-only figure is only an estimate; roof size and direction, shading and load timing affect the final design.", "Residential PV.", "", ['SRC-UMD-SIZE', 'SRC-NREL-PVW', 'SRC-MER-NM'], "UMD: first estimate before site-specific design; PVWatts: orientation and shading change output.")],
 caps=dict(fb_hook="Ilang kW ba talaga ang solar na kailangan mo? ☀️ Heto ang mabilis na paraan para tantiyahin.", fb_points=["🔢 Simulan sa kWh na nagamit mo kada buwan", "➗ Gawing kada araw, tapos hatiin sa sun hours ng lugar mo", "⚠️ Tantiya lang 'yan, galing lang sa bill", "🏠 Titingnan pa ang bubong, anino at oras ng paggamit, kaya mahalaga ang site visit"], fb_q="SoSmart viewers, ilang kW ang na-quote sa inyo? 👇",
           tt="Paano tantiyahin ang laki ng solar mo: kWh ÷ sun hours ☀️ Pero site visit pa rin! #SolarPH #SolarTips #KuyaSoLight #LearnOnTikTok #SolarPanel",
           yt_title="Ilang kW na Solar ang Kailangan Mo? Paano Tantiyahin ang Solar Size #Shorts", yt_lead="Paano tinatantiya ang laki ng solar system? Heto ang basic na paraan, at bakit tantiya lang ito:",
           tags="solar size philippines, ilang kw solar, solar sizing, solar quote philippines, sun hours philippines, kuya solight", hashtags="#SolarPH #SolarTips #KuyaSoLight"))

EP['E015'] = dict(title="Panel, Inverter, Battery: Kanya-Kanyang Trabaho", pillar="E", template="T-explainer", cover=["Panel, Inverter,", "Battery: Ano ang Trabaho?"],
 audience="First-time solar buyers", premise="Panels make DC from light, the inverter converts it to AC for the home, the battery stores energy for later and is optional.",
 scenes={"hook": {"type": "hook", "icon": "panel", "icon2": "battery", "chip": "Sino ang gumagawa ng ano?"},
         "panel": {"type": "cards", "cards": [{"title": "Panel", "lines": ["Gumagawa ng kuryente", "mula sa liwanag"], "tone": "navy", "icon": "panel"}]},
         "inv": {"type": "cards", "cards": [{"title": "Panel", "lines": ["Gumagawa ng kuryente"], "tone": "navy", "icon": "panel"}, {"title": "Inverter", "lines": ["DC → AC para sa bahay"], "tone": "gold", "icon": "inverter"}]},
         "bat": {"type": "cards", "cards": [{"title": "Panel", "lines": ["Gumagawa ng kuryente"], "tone": "navy", "icon": "panel"}, {"title": "Inverter", "lines": ["DC → AC para sa bahay"], "tone": "gold", "icon": "inverter"}, {"title": "Battery", "lines": ["Nag-iimbak para mamaya"], "tone": "white", "icon": "battery"}]},
         "opt": {"type": "path", "steps": [{"icon": "sun", "label": "araw"}, {"icon": "panel", "label": "panel"}, {"icon": "inverter", "label": "inverter"}, {"icon": "house", "label": "bahay"}], "kuyaLeft": True},
         "recap": {"type": "checklist", "title": "Tandaan", "items": ["Panel: gumagawa", "Inverter: nagpapalit", "Battery: nag-iimbak (optional)"]},
         **end(["Sources: U.S. EIA & DOE solar and inverter basics; U.S. DOE", "solar-plus-storage; Meralco Solar & Net Metering (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Ano ba ang trabaho ng panel, inverter, at battery?", ["panel", "inverter", "battery"], pause=0.35), GREET,
       cue(3, "panel", "Ang panel ang gumagawa ng kuryente mula sa liwanag.", ["panel"], pause=0.3),
       cue(4, "inv", "Ang inverter ang nagpapalit nito para magamit sa bahay.", ["inverter"], pause=0.3),
       cue(5, "bat", "Ang battery naman ang nag-iimbak para magamit mamaya.", ["battery"], pause=0.3),
       cue(6, "opt", "Puwedeng walang battery, pero sa araw mo lang direktang magagamit ang solar.", ["walang battery"], pause=0.3),
       cue(7, "recap", "Panel ang gumagawa, inverter ang nagpapalit, battery ang nag-iimbak.", ["gumagawa", "nagpapalit", "nag-iimbak"], pause=0.4), *CLOSE],
 claims=[claim('E015', 1, "Solar panels convert light into electricity (DC).", "PV modules.", "", ['SRC-EIA-PV'], "EIA."),
         claim('E015', 2, "The inverter converts DC into the AC used at home.", "Residential PV.", "", ['SRC-DOE-INV'], "DOE inverter basics."),
         claim('E015', 3, "A battery stores energy for later use.", "Solar-plus-storage.", "", ['SRC-DOE-STORAGE'], "DOE: batteries store daytime solar for night or outages."),
         claim('E015', 4, "A battery is optional; without it, solar is used directly only while it generates (daytime).", "Grid-tied systems.", "", ['SRC-MER-NM', 'SRC-MER-DER'], "Meralco: system supplies the property while generating; grid supplies at night.")],
 caps=dict(fb_hook="Panel, inverter, battery: alam mo ba ang trabaho ng bawat isa? 🔧", fb_points=["☀️ Panel: gumagawa ng kuryente mula sa liwanag", "🔁 Inverter: pinapalitan ito para magamit sa bahay (DC → AC)", "🔋 Battery: nag-iimbak para magamit mamaya", "✅ Optional ang battery, pero sa araw mo lang direktang magagamit ang solar kapag wala nito"], fb_q="SoSmart viewers, may battery ba ang solar n'yo o wala? 👇",
           tt="Panel = gumagawa, inverter = nagpapalit, battery = nag-iimbak 🔋 #SolarPH #SolarBasics #KuyaSoLight #LearnOnTikTok #SolarPanel",
           yt_title="Panel, Inverter, Battery: Ano ang Trabaho ng Bawat Isa? #Shorts", yt_lead="Tatlong pangunahing parte ng solar system, at ang trabaho ng bawat isa:",
           tags="solar panel inverter battery, paano gumagana ang solar, solar basics tagalog, solar philippines, hybrid solar, kuya solight", hashtags="#SolarPH #SolarBasics #KuyaSoLight"))

EP['E016'] = dict(title="Solar Muna, Battery Later?", pillar="D", template="T-explainer", cover=["Solar Muna,", "Battery Later?"],
 audience="Homeowners on a budget planning storage later", premise="Adding a battery later is easiest with a hybrid inverter and a compatible battery; a grid-tied-only inverter needs an extra battery inverter (AC-coupled).",
 scenes={"hook": {"type": "hook", "icon": "battery", "chip": "Battery sa susunod?"},
         "hybrid": {"type": "cards", "cards": [{"title": "Hybrid inverter", "lines": ["Puwedeng dagdagan", "ng compatible na battery"], "tone": "gold", "icon": "inverter"}]},
         "compat": {"type": "cards", "cards": [{"title": "Hybrid inverter", "lines": ["Puwedeng dagdagan", "ng compatible na battery"], "tone": "gold", "icon": "inverter"}, {"title": "Compatible ba?", "lines": ["Brand at model ng battery"], "tone": "white", "icon": "battery"}]},
         "ac": {"type": "cards", "cards": [{"title": "Grid-tied inverter lang", "lines": ["Kailangan ng dagdag", "na battery inverter"], "tone": "navy", "icon": "inverter"}]},
         "ask": {"type": "checklist", "title": "Itanong sa installer", "items": ["Hybrid ba ang inverter?", "Anong battery ang compatible?", "Handa na ba ang backup wiring?"]},
         "plan": {"type": "equation", "lines": [{"text": "Plano ngayon"}, {"text": "= tipid mamaya", "color": "gold", "size": 80}], "icon": "battery"},
         **end(["Sources: EnergySage battery retrofit guide; SolarQuotes \"battery ready\"", "guide; Fronius & SMA backup docs (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Puwede bang solar muna, tapos battery na lang sa susunod?", ["battery"], pause=0.35), GREET,
       cue(3, "hybrid", "Puwede, lalo na kung hybrid inverter ang ilalagay mo ngayon.", ["hybrid inverter"], pause=0.3),
       cue(4, "compat", "Siguraduhin lang na compatible ito sa battery na balak mo.", ["compatible"], pause=0.3),
       cue(5, "ac", "Kung grid-tied inverter lang, puwede pa rin, pero may dagdag na battery inverter.", ["dagdag"], pause=0.3),
       cue(6, "ask", "Itanong din kung handa na ang wiring para sa backup.", ["backup"], pause=0.3),
       cue(7, "plan", "Planuhin na ngayon, para hindi ka magpalit ng inverter sa susunod.", ["Planuhin"], pause=0.4), *CLOSE],
 claims=[claim('E016', 1, "With a hybrid inverter, a compatible battery can usually be added later.", "Residential PV.", "Depends on brand compatibility.", ['SRC-ES-RETRO', 'SRC-SQ-READY'], "EnergySage: compatible DC-coupled battery on hybrid inverter; SolarQuotes: adding batteries later requires hybrid inverter."),
         claim('E016', 2, "Battery compatibility with the inverter must be confirmed.", "Residential PV.", "", ['SRC-SQ-READY', 'SRC-FRONIUS-BU'], "SolarQuotes: 'battery ready' used loosely; Fronius: compatible battery required."),
         claim('E016', 3, "With a grid-tied-only inverter, a battery can still be added via an AC-coupled battery with its own battery inverter.", "Residential PV.", "Less efficient than DC-coupled (not on screen).", ['SRC-ES-RETRO'], "EnergySage: AC coupling adds a battery inverter."),
         claim('E016', 4, "Backup during outages needs proper backup wiring.", "Hybrid/backup systems.", "", ['SRC-FRONIUS-BU', 'SRC-SMA-BU'], "Manufacturer docs.")],
 caps=dict(fb_hook="Solar muna, battery later? 🔋 Puwede, basta tama ang plano ngayon!", fb_points=["⚡ Pinakamadali kung hybrid inverter ang ilalagay ngayon", "✅ Siguraduhing compatible sa battery na balak mo", "🔁 Kung grid-tied inverter lang, puwede pa rin, pero may dagdag na battery inverter", "🔌 Itanong kung handa na ang wiring para sa backup"], fb_q="SoSmart viewers, balak n'yo bang magdagdag ng battery sa susunod? 👇",
           tt="Solar muna, battery later? Puwede, kung hybrid inverter at compatible ang battery 🔋 #SolarPH #HybridSolar #KuyaSoLight #LearnOnTikTok #SolarBattery",
           yt_title="Solar Muna, Battery Later? Ano ang Dapat Ihanda Ngayon #Shorts", yt_lead="Puwede bang mag-solar muna at magdagdag ng battery sa susunod? Heto ang dapat mong malaman:",
           tags="add battery later solar, hybrid inverter philippines, battery ready solar, solar battery philippines, ac coupled battery, kuya solight", hashtags="#SolarPH #HybridSolar #KuyaSoLight"))

EP['E017'] = dict(title="Bakit Namatay ang Grid-Tied Solar sa Brownout?", pillar="F", template="T-explainer", cover=["Bakit Namatay ang", "Solar sa Brownout?"],
 audience="Grid-tied solar owners surprised by outages", premise="Grid-tied inverters must stop exporting when the grid is down (anti-islanding) to protect line workers; backup needs a battery and backup setup.",
 scenes={"hook": {"type": "hook", "icon": "grid", "icon2": "panel", "chip": "Brownout!"},
         "off": {"type": "outage", "backup": "none", "daytime": True, "chip": "Grid-tied: off sa brownout"},
         "anti": {"type": "cards", "cards": [{"title": "Anti-islanding", "lines": ["Kusang patay", "kapag walang grid"], "tone": "navy", "icon": "inverter"}]},
         "back": {"type": "cards", "cards": [{"title": "Anti-islanding", "lines": ["Kusang patay", "kapag walang grid"], "tone": "navy", "icon": "inverter"}, {"title": "Walang balik-kuryente", "lines": ["sa linya ng Meralco"], "tone": "gold", "icon": "grid"}]},
         "safe": {"type": "equation", "lines": [{"text": "Safety"}, {"text": "ng nag-aayos", "color": "gold", "size": 80}, {"text": "ng linya"}], "icon": "grid"},
         "bat": {"type": "outage", "backup": "battery", "daytime": False, "chip": "Battery + backup setup"},
         **end(["Sources: ERC/DOE interconnection standards; NREL IEEE 1547 islanding", "report; CleanTechnica (May 2026); Fronius & SMA (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Bakit namatay ang solar mo noong nag-brownout?", ["brownout"], pause=0.35), GREET,
       cue(3, "off", "Kapag nawala ang grid, kusang namamatay ang grid-tied inverter.", ["namamatay"], pause=0.3),
       cue(4, "anti", "Tawag dito, anti-islanding.", ["anti-islanding"], say="Tawag dito, anti-islanding.", pause=0.3),
       cue(5, "back", "Para walang kuryenteng dumaloy pabalik sa linya.", ["pabalik"], pause=0.3),
       cue(6, "safe", "Proteksyon ito sa mga nag-aayos ng linya.", ["Proteksyon"], pause=0.3),
       cue(7, "bat", "Para may kuryente sa brownout, kailangan ng battery at backup setup.", ["battery", "backup"], pause=0.4), *CLOSE],
 claims=[claim('E017', 1, "When the grid goes down, a compliant grid-tied inverter shuts down.", "Grid-tied PV.", "", ['SRC-ERC-NMIS', 'SRC-PH-ANTIISL'], "ERC standards include islanding protection; inverter must disconnect immediately."),
         claim('E017', 2, "This behaviour is called anti-islanding.", "Grid-tied PV.", "", ['SRC-NREL-ISL'], "NREL IEEE 1547 islanding report."),
         claim('E017', 3, "It prevents electricity from flowing back into the power lines.", "Grid-tied PV.", "", ['SRC-PH-ANTIISL'], "Prevents backfeeding into power lines."),
         claim('E017', 4, "It protects people working on the lines.", "Grid-tied PV.", "", ['SRC-NREL-ISL'], "NREL: personnel safety is a key reason for anti-islanding."),
         claim('E017', 5, "Power during outages needs a battery and a backup setup.", "Hybrid/backup systems.", "", ['SRC-FRONIUS-BU', 'SRC-SMA-BU'], "Manufacturer docs.")],
 caps=dict(fb_hook="Nag-brownout, pero bakit namatay din ang solar mo? ⚡ Hindi sira 'yan!", fb_points=["🔌 Kapag nawala ang grid, kusang namamatay ang grid-tied inverter", "🛡️ Tawag dito: anti-islanding", "⚠️ Para walang kuryenteng dumaloy pabalik sa linya, proteksyon sa mga nag-aayos nito", "🔋 Para may kuryente sa brownout: battery + backup setup"], fb_q="SoSmart viewers, nangyari na ba 'to sa solar n'yo? 👇",
           tt="Bakit namatay ang solar sa brownout? Anti-islanding, para sa safety ⚡ #SolarPH #Brownout #KuyaSoLight #LearnOnTikTok #SolarTips",
           yt_title="Bakit Namamatay ang Grid-Tied Solar sa Brownout? Anti-Islanding Explained #Shorts", yt_lead="Nag-brownout, pero bakit patay din ang solar? Hindi sira 'yan. Heto ang dahilan:",
           tags="solar brownout philippines, grid tied solar brownout, anti islanding, solar safety, hybrid solar backup, kuya solight", hashtags="#SolarPH #Brownout #KuyaSoLight"))

EP['E018'] = dict(title="Ano ang Essential Loads?", pillar="D", template="T-explainer", cover=["Ano ang", "Essential Loads?"],
 audience="Homeowners planning battery backup", premise="Essential loads are the must-run items during an outage (a few lights, internet, fridge); big loads like aircon drain a battery fast, so backup is usually a separate circuit.",
 scenes={"hook": {"type": "hook", "icon": "battery", "chip": "Brownout: ano ang bukas?"},
         "ess": {"type": "checklist", "title": "Essential loads", "items": ["Ilang ilaw", "Wi-Fi router", "Ref"]},
         "big": {"type": "cards", "cards": [{"title": "Malalaking load", "lines": ["Aircon at iba pa", "Mabilis umubos ng battery"], "tone": "navy", "icon": "ac"}]},
         "panel": {"type": "outage", "backup": "battery", "daytime": False, "chip": "Hiwalay na backup circuit"},
         "list": {"type": "checklist", "title": "Ilista muna", "items": ["Anong gamit?", "Ilang oras?", "Gaano kalakas?"]},
         **end(["Sources: EnergySage critical load panels guide; Fronius & SMA", "backup docs; U.S. DOE solar-plus-storage (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Brownout na! Ano ang dapat manatiling bukas sa bahay mo?", ["brownout"], pause=0.35), GREET,
       cue(3, "ess", "Essential loads ang tawag sa mga gamit na pinaka-kailangan mo.", ["Essential loads"], pause=0.2),
       cue(4, "ess", "Kadalasan, ilang ilaw, Wi-Fi, at ref.", ["ilaw", "Wi-Fi", "ref"], pause=0.3),
       cue(5, "big", "Ang malalaking load tulad ng aircon, mabilis umubos ng battery.", ["aircon"], pause=0.3),
       cue(6, "panel", "Kaya madalas, hiwalay na circuit ang ginagawa para sa backup.", ["hiwalay na circuit"], pause=0.3),
       cue(7, "list", "Ilista muna ang gamit at ilang oras mo kailangan, bago pumili ng battery.", ["Ilista"], pause=0.4), *CLOSE],
 claims=[claim('E018', 1, "Essential (critical) loads are the circuits you most need during an outage.", "Battery backup.", "", ['SRC-ES-CRIT'], "EnergySage critical loads guide."),
         claim('E018', 2, "Typical essential loads include some lights, internet equipment and the refrigerator.", "Battery backup.", "Varies by home.", ['SRC-ES-CRIT'], "EnergySage: refrigeration, lights, internet equipment."),
         claim('E018', 3, "Large loads like air-conditioning drain a battery quickly; leaving them out makes backup last longer.", "Battery backup.", "", ['SRC-ES-CRIT'], "EnergySage: excluding large HVAC loads extends backup."),
         claim('E018', 4, "Backup is often wired as a separate circuit or subpanel.", "Battery backup.", "", ['SRC-ES-CRIT', 'SRC-FRONIUS-BU', 'SRC-SMA-BU'], "Critical loads subpanel; manufacturer backup wiring."),
         claim('E018', 5, "List the loads and hours needed before choosing a battery.", "Battery sizing.", "", ['SRC-ES-CRIT', 'SRC-DOE-STORAGE'], "Sizing depends on selected loads and backup duration.")],
 caps=dict(fb_hook="Kapag brownout, ano ang dapat manatiling bukas sa bahay mo? 🔋", fb_points=["💡 Essential loads: ang mga gamit na pinaka-kailangan mo", "📶 Kadalasan: ilang ilaw, Wi-Fi at ref", "❄️ Ang aircon at malalaking load, mabilis umubos ng battery", "📝 Ilista muna ang gamit at ilang oras kailangan, bago pumili ng battery"], fb_q="SoSmart viewers, ano ang number one na gusto n'yong bukas tuwing brownout? 👇",
           tt="Essential loads: ilaw, Wi-Fi, ref. Aircon? Mabilis umubos ng battery! 🔋 #SolarPH #Brownout #KuyaSoLight #LearnOnTikTok #SolarBattery",
           yt_title="Ano ang Essential Loads? Ano ang Kaya ng Battery Tuwing Brownout #Shorts", yt_lead="Bago bumili ng battery para sa brownout, alamin muna ang essential loads mo:",
           tags="essential loads, critical loads solar, solar battery brownout, battery backup philippines, hybrid solar, kuya solight", hashtags="#SolarPH #SolarBattery #KuyaSoLight"))

EP['E019'] = dict(title="Ano ang Net-Metering?", pillar="A", template="T-explainer", cover=["Ano ang", "Net-Metering?"],
 audience="Homeowners considering grid-connected solar", premise="Solar supplies the home first; excess goes to the grid and earns a peso credit on the bill under net-metering, which needs an application with the utility.",
 scenes={"hook": {"type": "hook", "icon": "grid", "icon2": "panel", "chip": "Net-metering?"},
         "first": {"type": "sky", "sky": "sunny", "level": 0.9, "chip": "Solar muna sa bahay"},
         "export": {"type": "path", "steps": [{"icon": "panel", "label": "solar"}, {"icon": "house", "label": "bahay muna"}, {"icon": "grid", "label": "sobra → grid"}]},
         "credit": {"type": "equation", "lines": [{"text": "Sobrang kWh"}, {"text": "→ credit sa bill", "color": "gold", "size": 80}], "icon": "bill"},
         "apply": {"type": "checklist", "title": "Kailangan", "items": ["Application sa Meralco", "Metro na nagbabasa ng import at export"]},
         "next": {"type": "cards", "cards": [{"title": "Credit rate", "lines": ["Iba sa binabayaran mo", "Abangan sa susunod!"], "tone": "gold", "icon": "bill"}]},
         **end(["Sources: Meralco Solar & Net Metering; DOE REMB Net Metering", "Program (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Ano ba talaga ang net-metering?", ["net-metering"], pause=0.35), GREET,
       cue(3, "first", "Habang may araw, solar muna ang nagsu-supply sa bahay mo.", ["solar muna"], pause=0.3),
       cue(4, "export", "Kapag may sobra, napupunta ito sa grid.", ["sobra"], pause=0.3),
       cue(5, "credit", "Sa net-metering, may credit ka sa bill para sa sobrang 'yon.", ["credit"], pause=0.3),
       cue(6, "apply", "Kailangan mag-apply sa Meralco at magpakabit ng tamang metro.", ["mag-apply"], pause=0.3),
       cue(7, "next", "Pero iba ang rate ng credit, at 'yan ang pag-uusapan natin sa susunod.", ["iba ang rate"], pause=0.4), *CLOSE],
 claims=[claim('E019', 1, "While generating, the solar system supplies the home first.", "Net-metered homes.", "", ['SRC-MER-NM'], "Meralco: system supplies the property first."),
         claim('E019', 2, "Excess solar energy is exported to the grid.", "Net-metered homes.", "", ['SRC-MER-NM'], "Meralco net metering page."),
         claim('E019', 3, "Under net-metering, exported energy earns a peso credit applied to the bill.", "Meralco net metering.", "Applied to eligible charges.", ['SRC-MER-NM'], "Meralco: peso credit applied to eligible bill charges."),
         claim('E019', 4, "Net-metering requires an application with the utility and metering that records import and export.", "Philippines.", "", ['SRC-MER-NM', 'SRC-DOE-NM-2017'], "DOE REMB program; Meralco application process."),
         claim('E019', 5, "The export credit rate differs from the retail rate.", "Meralco net metering.", "Detailed in E020.", ['SRC-MER-NM'], "Meralco FAQ 11: blended generation cost, not full retail rate.")],
 caps=dict(fb_hook="Ano ba talaga ang net-metering? ⚡ Simpleng explanation in 1 minute!", fb_points=["☀️ Habang may araw, solar muna ang nagsu-supply sa bahay", "🔁 Kapag may sobra, napupunta ito sa grid", "🧾 Sa net-metering, may credit ka sa bill para doon", "📝 Kailangan mag-apply sa Meralco at tamang metro"], fb_q="SoSmart viewers, naka-net-metering na ba kayo? 👇",
           tt="Net-metering in 1 minute: solar muna sa bahay, sobra → grid → credit sa bill ⚡ #NetMetering #SolarPH #KuyaSoLight #LearnOnTikTok #Meralco",
           yt_title="Ano ang Net-Metering? Simpleng Paliwanag para sa May Solar #Shorts", yt_lead="Ano ang net-metering at paano ka nagkakaroon ng credit sa bill? Heto ang simpleng paliwanag:",
           tags="net metering philippines, ano ang net metering, meralco net metering, solar credit bill, solar philippines, kuya solight", hashtags="#NetMetering #SolarPH #KuyaSoLight"))

EP['E020'] = dict(title="Same Ba ang Export at Import Electricity Rate?", pillar="C", template="T-explainer", cover=["Same Ba ang Export", "at Import Rate?"],
 audience="Net-metering customers and buyers sizing for export", premise="Imports are billed at the full retail rate; export credit is based on the blended generation cost, so each exported kWh is worth less than an imported one.",
 scenes={"hook": {"type": "hook", "icon": "bill", "icon2": "grid", "chip": "Pareho ba?"},
         "imp": {"type": "cards", "cards": [{"title": "Import (binibili)", "lines": ["Buong retail rate", "Generation, transmission at iba pa"], "tone": "navy", "icon": "grid"}]},
         "exp": {"type": "cards", "cards": [{"title": "Import (binibili)", "lines": ["Buong retail rate"], "tone": "navy", "icon": "grid"}, {"title": "Export (credit)", "lines": ["Blended generation cost"], "tone": "gold", "icon": "panel"}]},
         "less": {"type": "equation", "lines": [{"text": "Export credit"}, {"text": "<", "color": "gold", "size": 96}, {"text": "Retail rate"}]},
         "day": {"type": "sky", "sky": "sunny", "level": 0.9, "chip": "Gamitin habang may araw"},
         "size": {"type": "checklist", "title": "Para mas sulit", "items": ["Gamitin ang solar sa araw", "Tamang laki ng system", "Huwag umasa sa export lang"]},
         **end(["Sources: Meralco Solar & Net Metering (FAQ 11); Meralco schedule of", "rates (Nov 2026); DOE REMB Net Metering (checked 25 Nov 2026)"])},
 cues=[cue(1, "hook", "Pareho ba ang presyo ng kuryenteng binibili at ine-export mo?", ["binibili", "ine-export"], pause=0.35), GREET,
       cue(3, "imp", "Ang binibili mo sa grid, buong retail rate ang singil.", ["retail rate"], pause=0.3),
       cue(4, "exp", "Ang ine-export mo, blended generation cost ang basehan ng credit.", ["blended generation cost"], pause=0.3),
       cue(5, "less", "Kaya mas mababa ang credit kada kWh kaysa sa binabayaran mo.", ["mas mababa"], say=f"Kaya mas mababa ang credit kada {KWH} kaysa sa binabayaran mo.", pause=0.3),
       cue(6, "day", "Kaya mas sulit gamitin ang solar habang may araw.", ["mas sulit"], pause=0.3),
       cue(7, "size", "Tamang laki ng system ang susi, hindi puro export.", ["Tamang laki"], pause=0.4), *CLOSE],
 claims=[claim('E020', 1, "Electricity imported from the grid is billed at the full retail rate (all bill components).", "Meralco residential.", "", ['SRC-MER-RATES', 'SRC-MER-NM'], "Rate schedule lists all per-kWh components."),
         claim('E020', 2, "Export credit is based on the blended generation cost.", "Meralco net metering.", "Current rules; may change.", ['SRC-MER-NM', 'SRC-DOE-NM-2017'], "Meralco FAQ 11; DOE REMB: blended generation cost."),
         claim('E020', 3, "So each exported kWh is credited at less than an imported kWh costs.", "Meralco net metering.", "No peso figures named.", ['SRC-MER-NM'], "Meralco: exported kWh not exchanged one-for-one at the full retail rate."),
         claim('E020', 4, "Using solar directly during the day is worth more than exporting it.", "Net-metered homes.", "", ['SRC-MER-NM'], "Follows from claims 1-3."),
         claim('E020', 5, "Right-sizing the system matters more than relying on export.", "Net-metered homes.", "Advice framing.", ['SRC-MER-NM'], "Follows from claims 1-3.")],
 caps=dict(fb_hook="Pareho ba ang presyo ng kuryenteng binibili mo at ine-export ng solar mo? 🤔 Hindi!", fb_points=["🔌 Import (binibili sa grid): buong retail rate", "☀️ Export (sobrang solar): blended generation cost ang basehan ng credit", "📉 Kaya mas mababa ang credit kada kWh kaysa sa binabayaran mo", "✅ Mas sulit gamitin ang solar sa araw, at tamang laki ng system ang susi"], fb_q="SoSmart viewers, magkano ang net-metering credit n'yo last month? 👇",
           tt="Export rate ≠ import rate! Mas mababa ang credit ng sobrang solar 📉 #NetMetering #SolarPH #KuyaSoLight #LearnOnTikTok #MeralcoBill",
           yt_title="Export vs Import Rate: Bakit Mas Mababa ang Net-Metering Credit? #Shorts", yt_lead="Pareho ba ang presyo ng kuryenteng binibili at ine-export mo? Hindi. Heto kung bakit:",
           tags="net metering credit, export rate meralco, blended generation cost, net metering philippines, solar sizing, kuya solight", hashtags="#NetMetering #SolarPH #KuyaSoLight"))

FB_TAGS = "#KuyaSoLight #SoSmartViewers #SolarPH #SolarKlaro #SoLightSolarPH"
YT_SETTINGS = """UPLOAD SETTINGS (YouTube Shorts)
- Audience: No, it's not made for kids
- Altered or synthetic content: No (animated character, not realistic footage)
- Category: Education | Language: Filipino
- Captions: subtitles are burned in, so leave auto-captions off
- Thumbnail: use E0xx-cover.png (opening-question frame)"""

def write_pack(eid, d):
    c = d['caps']; src_line = d['scenes']['endcard']['sources']; src = (src_line[0] + ' ' + src_line[1]).replace('Sources: ', '')
    out = f'/mnt/project-files/kuya-solight/{eid}/post'; os.makedirs(out, exist_ok=True)
    fb = c['fb_hook'] + "\n\n" + "\n".join(c['fb_points']) + "\n\n" + c['fb_q'] + "\n\nI-follow si Kuya SoLight para sa malinaw na solar tips para sa bahay. Life is SoLight with Solar. ☀️\n\n" + FB_TAGS + "\n"
    open(f'{out}/{eid}-facebook.txt', 'w').write(fb)
    open(f'{out}/{eid}-pinned-comment.txt', 'w').write(f"Sources ({src.split('(')[-1].rstrip(')')}): {src.split(' (checked')[0]}.\n")
    open(f'{out}/{eid}-tiktok.txt', 'w').write(c['tt'] + "\n")
    bullets = "\n".join("• " + p.split(' ', 1)[1] for p in c['fb_points'])
    yt = f"TITLE:\n{c['yt_title']}\n\nDESCRIPTION:\n{c['yt_lead']}\n\n{bullets}\n\nMag-subscribe para sa malinaw na solar tips para sa bahay. Life is SoLight with Solar. ☀️\n\nSources: {src}\n\n#Shorts {c['hashtags']}\n\nTAGS:\n{c['tags']}\n\n{YT_SETTINGS.replace('E0xx', eid)}\n"
    open(f'{out}/{eid}-youtube-shorts.txt', 'w').write(yt)

for eid, d in EP.items():
    used = sorted({s for c in d['claims'] for s in c['sources']})
    p = f'episodes/{eid}/episode.json'
    prev = json.load(open(p)) if os.path.exists(p) else {}
    c = d['caps']
    ep = {"id": eid, "title": d['title'], "pillar": d['pillar'], "template": d['template'], "audience": d['audience'], "premise": d['premise'],
          "openingPattern": "A-question-first", "greetingId": "greet-default", "catchphraseId": "close-signature",
          "scriptBasis": "Claude draft from the episode plan (data/episodes.json) title/angle, V1.1 brand lines; claims checked online 2026-11-25.", "scriptVersion": 1,
          "voice": "production", "cover": d['cover'], "scenes": d['scenes'], "cues": d['cues'], "claims": d['claims'],
          "sources": [{"id": s, **SRC[s], "published": None, "retrieved": "2026-11-25", "freshness": "re-verify before publication"} for s in used],
          "caption": {"main": c['fb_hook'], "short": c['tt'].split(' #')[0], "thumbnailHeadline": ' '.join(d['cover']), "discussionQuestion": c['fb_q'], "hashtags": FB_TAGS.split(), "cta": "I-follow si Kuya SoLight"}}
    if 'ownerApproval' in prev: ep['ownerApproval'] = prev['ownerApproval']
    sp = f'episodes/{eid}/seeds.json'  # takes picked by episodes/_pick_takes.py (steadiest pacing, no long mid-line pauses)
    if os.path.exists(sp):
        for x in ep['cues']:
            sd = json.load(open(sp)).get(x['id'])
            if sd: x['elSettings'] = dict(x.get('elSettings') or {}, seed=sd)
    os.makedirs(f'episodes/{eid}', exist_ok=True)
    json.dump(ep, open(p, 'w'), ensure_ascii=False, indent=1)
    write_pack(eid, d)
    print(eid, len(ep['cues']), 'cues', max(len(x['text']) for x in ep['cues']), 'max chars')
