"""Platform captions (Facebook, TikTok, YouTube Shorts) for E002-E010. Same claims as the fact-checked scripts.
Run: python3 episodes/_captions_e002_e010.py  -> writes /mnt/project-files/kuya-solight/E0xx/post/*.txt"""
import json, os
FOLLOW_FB = "I-follow si Kuya SoLight para sa weekly solar tips na klaro at walang hype."
SUB_YT = "Subscribe para sa weekly solar tips para sa Pinoy homeowners: walang hype, puro klaro."
C = {
'E002': dict(
 fb="""May solar ka na, pero may Meralco bill ka pa rin? 🤔 Normal 'yan, at heto kung bakit.

☀️ Sa araw, solar ang tumutulong sa gamit ng bahay
🌙 Kapag kulang ang solar o gabi na (at walang battery), sa grid ka kumukuha
🧾 May bill charges na hindi basta nawawala kahit may solar

Kaya ingat sa "automatic zero bill" na pangako. Ang tamang tanong: gaano kalaki ang matitipid mo, depende sa setup at gamit mo.

SoSmart viewers, magkano ang ibinaba ng bill n'yo mula nang mag-solar? 👇

{follow}

#KuyaSoLight #SolarPH #MeralcoBill #SoSmartViewers #SoLightSolarPH""",
 tt="May solar na pero may Meralco bill pa rin? 🤔 Grid sa gabi + charges na hindi nawawala. Walang automatic zero bill! #solarph #meralco #solarpanels #LearnOnTikTok #KuyaSoLight",
 yt_title="May Solar Pero May Meralco Bill Pa Rin? 🤔 Here's Why #Shorts",
 yt="""Bakit may bill ka pa rin kahit may solar na? Si Kuya SoLight ang mag-e-explain.

☀️ Sa araw, solar ang tumutulong sa bahay
🌙 Gabi o kulang ang solar → grid ang supply (kung walang battery)
🧾 May bill charges na hindi basta nawawala
❌ Kaya walang "automatic zero bill"

{sub}""",
 tags="meralco bill solar, solar zero bill, net metering philippines, solar panels philippines, solar tagalog, Kuya SoLight"),
'E003': dict(
 fb="""kW o kWh? Parehong nasa quote at bill mo, pero magkaiba sila! ⚡

⚡ kW = power, gaano kabilis gumamit ng kuryente
🔋 kWh = energy, gaano karami ang nagamit
📺 Halimbawa: 100-watt na TV na bukas nang 10 oras = 1 kWh
🧾 Sa Meralco bill, kWh ang basehan ng energy charges

Kapag alam mo 'to, mas madali mong maiintindihan ang solar quote mo.

SoSmart viewers, ilang kWh ang konsumo n'yo last month? 👇

{follow}

#KuyaSoLight #SolarPH #kWh #SoSmartViewers #SoLightSolarPH""",
 tt="kW vs kWh: ano'ng pagkakaiba? ⚡ kW = bilis, kWh = dami. 100W TV x 10 oras = 1 kWh. #kwh #solarph #meralco #LearnOnTikTok #KuyaSoLight",
 yt_title="kW vs kWh: Ano ang Pagkakaiba? ⚡ Easy Explanation #Shorts",
 yt="""kW at kWh, pareho lang ba? Hindi! Si Kuya SoLight ang mag-e-explain.

⚡ kW = power (gaano kabilis)
🔋 kWh = energy (gaano karami)
📺 100-watt TV × 10 oras = 1 kWh
🧾 Sa Meralco bill, kWh ang basehan ng energy charges

{sub}""",
 tags="kw vs kwh, kilowatt hour tagalog, meralco bill kwh, solar panels philippines, electricity bill philippines, Kuya SoLight"),
'E004': dict(
 fb="""Grid-tied, hybrid, o off-grid: alin ang para sa bahay mo? 🔋

🔌 Grid-tied: solar + grid, walang battery. Kapag brownout, kusang namamatay para sa safety
🔋 Hybrid: may battery, pero ang backup ay depende sa setup
🏝️ Off-grid: walang grid, battery ang sandalan

Hindi pare-pareho ang backup nila, kaya alamin muna kung anong appliances ang kailangan mong tumakbo sa brownout.

SoSmart viewers, ano'ng appliance ang pinaka-kailangan n'yo kapag brownout? 👇

{follow}

#KuyaSoLight #SolarPH #Brownout #SoSmartViewers #SoLightSolarPH""",
 tt="Grid-tied vs hybrid vs off-grid ☀️🔋 Alin ang may backup kapag brownout? #solarph #brownout #solarbattery #LearnOnTikTok #KuyaSoLight",
 yt_title="Grid-Tied vs Hybrid vs Off-Grid Solar: Alin ang Para Sa'yo? #Shorts",
 yt="""Grid-tied, hybrid, o off-grid? Si Kuya SoLight ang mag-e-explain ng pagkakaiba.

🔌 Grid-tied: walang battery, namamatay sa brownout para sa safety
🔋 Hybrid: may battery, backup depende sa setup
🏝️ Off-grid: walang grid, battery ang sandalan

{sub}""",
 tags="grid tied vs hybrid solar, off grid solar philippines, solar brownout backup, hybrid inverter philippines, solar tagalog, Kuya SoLight"),
'E005': dict(
 fb="""Saan nga ba galing ang kuryente sa bahay mo kapag may solar? 🏠

☀️ Sa araw: solar ang unang sumusuplay
⚡ Kapag sobra: puwedeng i-export sa grid (net metering)
🔋 Kung may battery: puwede itong mag-charge
🌙 Sa gabi: battery o grid ang supply

Kapag alam mo ang daloy, mas madaling magtipid.

SoSmart viewers, net metering o battery: alin ang mas bagay sa inyo? 👇

{follow}

#KuyaSoLight #SolarPH #NetMetering #SoSmartViewers #SoLightSolarPH""",
 tt="Saan galing ang kuryente sa bahay na may solar? ☀️ Araw: solar. Sobra: grid o battery. Gabi: battery o grid. #netmetering #solarph #solarpanels #LearnOnTikTok #KuyaSoLight",
 yt_title="Saan Galing ang Kuryente sa Bahay na May Solar? ☀️🏠 #Shorts",
 yt="""Solar, grid, o battery: saan galing ang kuryente mo? Si Kuya SoLight ang mag-e-explain.

☀️ Araw: solar muna
⚡ Sobra: export sa grid (net metering)
🔋 May battery: nagcha-charge
🌙 Gabi: battery o grid

{sub}""",
 tags="net metering philippines, solar battery philippines, how solar works tagalog, solar panels philippines, meralco net metering, Kuya SoLight"),
'E006': dict(
 fb=""""Hybrid-ready" daw ang inverter mo. Ibig sabihin ba may backup ka na? 🤔 Hindi pa!

✅ Kailangan ng compatible na battery
✅ Tamang backup wiring o critical loads panel
✅ Inverter na naka-set up talaga para sa backup

Kung kulang ang mga 'yan, puwedeng brownout ka pa rin. Kaya bago bumili, ipa-verify ang buong backup setup.

SoSmart viewers, may "hybrid-ready" ba sa quote n'yo? 👇

{follow}

#KuyaSoLight #SolarPH #HybridInverter #SoSmartViewers #SoLightSolarPH""",
 tt="Hybrid-ready = may backup na? ❌ Hindi pa! Kailangan ng battery, backup wiring at tamang setup. #hybridinverter #solarph #brownout #LearnOnTikTok #KuyaSoLight",
 yt_title="Hybrid-Ready Inverter = May Backup Na? ❌ Hindi Pa! #Shorts",
 yt="""Hybrid-ready ang inverter mo? Hindi ibig sabihin may backup ka na. Si Kuya SoLight ang mag-e-explain.

✅ Compatible na battery
✅ Backup wiring o critical loads panel
✅ Inverter na naka-set up para sa backup

{sub}""",
 tags="hybrid ready inverter, solar backup philippines, hybrid inverter philippines, solar battery backup, solar brownout, Kuya SoLight"),
'E007': dict(
 fb="""Tag-ulan na. May silbi pa ba ang solar mo? 🌧️

☁️ Kapag maulap, nababawasan ang liwanag sa panels
📉 Kaya bumababa ang output, minsan malaki ang bawas
☀️ Pero madalas hindi zero, dahil may diffuse light pa rin
📅 Ang tamang tingin: kWh sa buong buwan, hindi isang araw

SoSmart viewers, kumusta ang solar n'yo nitong tag-ulan? 👇

{follow}

#KuyaSoLight #SolarPH #TagUlan #SoSmartViewers #SoLightSolarPH""",
 tt="Gumagana ba ang solar kapag maulan? 🌧️ Oo, pero mas mahina. Madalas hindi zero! #solarph #tagulan #solarpanels #LearnOnTikTok #KuyaSoLight",
 yt_title="Gumagana Ba ang Solar Panels Kapag Maulan? 🌧️☀️ #Shorts",
 yt="""Umuulan, may silbi pa ba ang solar? Si Kuya SoLight ang sasagot.

☁️ Maulap = bawas ang liwanag
📉 Bumababa ang output
☀️ Pero madalas hindi zero (diffuse light)
📅 Tingnan ang kWh sa buong buwan

{sub}""",
 tags="solar panels rainy season, solar maulan, solar cloudy day, solar panels philippines, solar tagalog, Kuya SoLight"),
'E008': dict(
 fb="""Gumagana ba ang solar panels sa gabi? 🌙

❌ Hindi. Kailangan ng liwanag para makagawa ng kuryente
🔋 Kung "solar" ang gamit mo sa gabi, galing 'yan sa battery na nag-charge noong araw
⚡ Kapag wala o ubos na ang battery, grid na ang kukunan

Magkaiba ang solar generation at stored energy, at mahalaga 'yan sa pagpili ng system.

SoSmart viewers, may battery ba kayo o grid lang sa gabi? 👇

{follow}

#KuyaSoLight #SolarPH #SolarBattery #SoSmartViewers #SoLightSolarPH""",
 tt="Gumagana ba ang solar sa gabi? 🌙 Hindi! Battery 'yan na nag-charge noong araw. #solarbattery #solarph #solarpanels #LearnOnTikTok #KuyaSoLight",
 yt_title="Gumagana Ba ang Solar Panels sa Gabi? 🌙 #Shorts",
 yt="""Solar sa gabi? Si Kuya SoLight ang sasagot.

❌ Walang solar generation sa gabi
🔋 Battery ang supply kung nag-charge noong araw
⚡ Wala o ubos na ang battery → grid

{sub}""",
 tags="solar panels at night, solar battery philippines, solar sa gabi, solar panels philippines, solar tagalog, Kuya SoLight"),
'E009': dict(
 fb="""6 kWp na solar, 6 kW na inverter. Pareho ba 'yan? 🤔 Hindi!

☀️ kWp = DC rating ng panels sa test conditions
🔌 kW ng inverter = AC output na kaya nitong ilabas
📐 Puwedeng mas malaki ang panels kaysa inverter (DC-to-AC ratio)
✂️ Kapag sobra ang DC sa tanghali, may clipping, normal basta tama ang design

SoSmart viewers, ano'ng nakasulat na size sa quote n'yo? 👇

{follow}

#KuyaSoLight #SolarPH #SolarQuote #SoSmartViewers #SoLightSolarPH""",
 tt="6 kWp solar vs 6 kW inverter: pareho ba? ❌ kWp = DC panels, kW = AC inverter. #solarquote #solarph #inverter #LearnOnTikTok #KuyaSoLight",
 yt_title="6 kWp Solar vs 6 kW Inverter: Pareho Ba? ⚙️ #Shorts",
 yt="""kWp at kW sa solar quote mo, pareho ba? Si Kuya SoLight ang mag-e-explain.

☀️ kWp = DC rating ng panels
🔌 kW = AC output ng inverter
📐 DC-to-AC ratio
✂️ Clipping: normal basta tama ang design

{sub}""",
 tags="kwp vs kw, solar inverter sizing, dc ac ratio solar, solar quote philippines, solar panels philippines, Kuya SoLight"),
'E010': dict(
 fb="""Bakit hindi umaabot sa rated watts ang solar panels mo? 🌡️

🧪 Ang rating ay galing sa lab test (STC): 1000 W/m² na liwanag, 25°C na cell temperature
🔥 Sa totoong bubong, mas mainit ang panels, at kapag mas mainit, bumababa ang output
🌳 May epekto rin ang anino, alikabok, at anggulo ng araw

Kaya normal na mas mababa ang aktwal kaysa rating.

SoSmart viewers, ano'ng pinakamataas na output na nakita n'yo sa app? 👇

{follow}

#KuyaSoLight #SolarPH #SolarPanels #SoSmartViewers #SoLightSolarPH""",
 tt="Bakit hindi full power ang solar panels mo? 🌡️ Lab rating vs init, anino at alikabok sa bubong. #solarpanels #solarph #solarenergy #LearnOnTikTok #KuyaSoLight",
 yt_title="Bakit Hindi Full Power ang Solar Panels Mo? 🌡️ #Shorts",
 yt="""Rated watts pero kulang ang output? Si Kuya SoLight ang mag-e-explain.

🧪 Rating = lab test (STC: 1000 W/m², 25°C)
🔥 Mas mainit sa bubong = bawas output
🌳 Anino, alikabok, anggulo ng araw

{sub}""",
 tags="solar panel output low, solar panel rating stc, solar panel heat, solar panels philippines, solar tagalog, Kuya SoLight"),
}
for e, d in C.items():
    ep = json.load(open(f'episodes/{e}/episode.json'))
    src = ep['caption']['pinnedComment']
    P = f'/mnt/project-files/kuya-solight/{e}/post'; os.makedirs(P, exist_ok=True)
    open(f'{P}/{e}-facebook.txt', 'w').write(d['fb'].format(follow=FOLLOW_FB) + '\n')
    open(f'{P}/{e}-tiktok.txt', 'w').write(d['tt'] + '\n')
    open(f'{P}/{e}-youtube-shorts.txt', 'w').write(f"TITLE:\n{d['yt_title']}\n\nDESCRIPTION:\n{d['yt'].format(sub=SUB_YT)}\n\n{src}\n\n#Shorts #SolarPH #SolarPanels #KuyaSoLight #SolarPhilippines\n\nTAGS (YouTube Studio > Tags):\n{d['tags']}\n")
    open(f'{P}/{e}-pinned-comment.txt', 'w').write(src + '\n')
    assert len(d['yt_title']) <= 100, e
    print(e, len(d['tt']), len(d['yt_title']))
