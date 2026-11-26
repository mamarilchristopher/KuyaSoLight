# Kuya SoLight: Brand Guide and Package Index

**Tagline:** Life is SoLight with Solar.
**Show sign-off:** Naka-solar ka na, SoSmart ka pa!
Built 26 Nov 2026 from the official SoLight Solar PH logo pack (left unchanged) and the locked Kuya SoLight character v1.0 (look A1).

---

## 1. Colors

| Role | HEX | RGB | CMYK (for print) | Closest Pantone* |
|---|---|---|---|---|
| **SoLight Navy** (main) | `#0B3B7A` | 11 59 122 | C100 M75 Y10 K20 | PMS 7687 C |
| **SoLight Gold** (accent) | `#F5AE0B` | 245 174 11 | C0 M33 Y100 K0 | PMS 130 C |
| White | `#FFFFFF` | 255 255 255 | C0 M0 Y0 K0 | n/a |
| Cream (soft backgrounds) | `#FFF8E8` | 255 248 232 | C0 M2 Y8 K0 | n/a |
| Charcoal (body text) | `#243443` | 36 52 67 | C75 M55 Y35 K55 | n/a |

*The Pantone matches are approximate. For shirts, tarps and vinyl, ask the printer for a printed proof and match it against the logo colours.

Use mostly navy, with gold for accents (about 60% navy, 30% white or cream, 10% gold). Put gold text only on navy, never on white, because it gets hard to read.

## 2. Fonts

**Inter**, a free font (SIL Open Font License) from Google Fonts or rsms.me/inter.
- Headlines: Inter Black (900) or ExtraBold (800)
- Subheads and labels: Inter Bold (700)
- Body: Inter SemiBold (600) or Regular

The "Kuya SoLight" show title is set in Inter Black, with **Kuya** in gold and **SoLight** in white (on navy) or navy (on light backgrounds).
The PDFs already have the fonts embedded. To edit the SVG templates, install Inter first.

## 3. Logo use (v2, SOLAR PH gold bar)

- **Logo v2 (from 26 Nov 2026):** "SOLAR PH" now sits on a gold bar so it stands out. The mark and the "SoLight" wordmark are unchanged from the original official logo, which is kept in `00-logos/original-v1-official`. Every file in this package uses v2.
- **Files:** `00-logos/SVG` (vector, outlined), `PNG`, `PDF-print-CMYK`, `EPS-sign-shops`, `Icons`. For other projects, use the standalone `SoLight-Solar-PH-Logo-Kit-v2.zip`.
- **Which version to use:**
  - Full colour (navy wordmark, gold bar) on white or cream.
  - Reversed (white wordmark, gold bar) on navy.
  - One-colour navy, black or white (SOLAR PH knocked out of the bar) for single-colour printing, embroidery and vinyl cut.
- **Layouts:** horizontal (the default), stacked (square spaces) and mark only (profile photos, icons).
- **Rules:**
  - Don't redraw, stretch, recolour or add effects.
  - Leave clear space around the logo at least as wide as one solar square of the mark.
  - Minimum sizes: horizontal 30 mm / 160 px, stacked 20 mm / 110 px, mark 10 mm / 32 px.
- **Character:** use Kuya SoLight A1 exactly as provided in `00-logos/character-A1`, with no changes to his face, colors or outfit. When he points, it's an open palm, never a single extended finger.

## 4. What's in the package

### 01-social-media
| File | Size | Use |
|---|---|---|
| profile/profile-character-1080 | 1080×1080 | Profile photo for Facebook, TikTok, YouTube and Instagram (circle-safe) |
| profile/profile-logo-mark-1080 | 1080×1080 | Alternative profile photo using the logo mark |
| covers/facebook-cover-1640x924 | 1640×924 | Facebook page cover (keep key content in the centre band, about 1640×624) |
| covers/youtube-banner-2560x1440 | 2560×1440 | YouTube channel art (text kept inside the 1546×423 safe area) |
| covers/youtube-watermark-150 | 150×150 | YouTube video watermark (Studio > Customization > Branding) |
| post-templates/tip-post-square / portrait | 1080×1080 / 1080×1350 | "Solar tip" carousel or post |
| post-templates/question-post | 1080×1350 | Engagement or question post |
| post-templates/new-episode-announcement | 1080×1080 | New episode alert |
| post-templates/reel-cover-story | 1080×1920 | Reel, TikTok or Shorts cover and Story (text inside the Reels safe area) |
| post-templates/youtube-thumbnail | 1280×720 | Long-form YouTube thumbnail |
| video-overlays/video-lower-third | 1920×220 | Name bar for videos (transparent PNG) |

To change the text, edit the matching file in `svg/` (with Inter installed) and export it as PNG. Episode posts still use each episode's opening question frame as the thumbnail, per the posting rules.

### 02-print (each item: `-CMYK.pdf` for printing, a PNG with bleed, `svg/` editable, `proofs/` with guides)
Proof guides: the **red line** is the trim edge and the **blue dashed line** is the safe area. Keep text inside the safe area.

| Item | Trim size | Bleed | Raster |
|---|---|---|---|
| business-card front / back | 3.5 × 2 in (88.9 × 50.8 mm) | 3 mm | 300 dpi |
| flyer-A4 | 210 × 297 mm | 3 mm | 300 dpi |
| tarpaulin-6x3ft | 1828.8 × 914.4 mm | 20 mm (+50 mm safe for eyelets) | 150 dpi |
| rollup-standee-85x200cm | 850 × 2000 mm | 5 mm (bottom 150 mm hidden in the base) | 150 dpi |
| sticker-80mm-round | 80 mm circle, die-cut | 3 mm | 300 dpi |

The PDFs are vector and DeviceCMYK, so they stay sharp at any size. Tarp and standee printers normally print at 72–150 dpi, so the 150 dpi PNG is enough if they ask for a raster file.

### 03-apparel-drifit (transparent PNG at 300 dpi + CMYK PDF + SVG)
| Placement | Print size | Files |
|---|---|---|
| Front: left chest (default) | 90 mm wide | `front-left-chest-90mm-navy-shirt` / `-white-shirt` (SoLight Solar PH logo only) |
| Front: centre chest (option) | 250 mm wide | `front-center-chest-250mm-navy-shirt` / `-white-shirt` (SoLight Solar PH logo only) |
| Back | 300 × 400 mm | `back-print-300x400mm-navy-shirt` / `-white-shirt` (Kuya SoLight, tagline, phone, FB/YouTube page, TikTok handle) |

Layout rule (CHRIS, 26 Nov 2026): the front carries only the SoLight brand, and the back carries Kuya SoLight with the contact details. There's no sleeve print.
- Use the `navy-shirt` files on navy or dark dri-fit and the `white-shirt` files on white or light shirts.
- Best methods are DTF or sublimation (on white or light polyester). Screen printing works too, but the back print has full-colour skin tones, so it needs CMYK or simulated-process screens.
- `mockups/drifit-mockup.png` shows the placement on the shirt.
- Before a bulk order, ask the printer for one sample shirt.

### 04-vehicle-L300-decal: FINAL = `FINAL-B-Sunrise/`
CHRIS chose **Option B · Sunrise** on 26 Nov 2026. The design is drafted on CHRIS's own L300 FB-body photo (passenger body with two side windows).

| File | Size (trim, +25 mm bleed in the PDF) | Notes |
|---|---|---|
| L300-sunrise-side-LEFT | ~2,680 × 1,365 mm | Driver side. The sun rises at the rear and Kuya sits at the cab end. |
| L300-sunrise-side-RIGHT | ~2,680 × 1,365 mm | Mirror layout. Text reads normally. |
| L300-sunrise-rear | 1,500 × 650 mm (assumed) | Rear door panel below the window. Needs a rear photo to confirm. |
| L300-cab-door-logo (print ×2) | ~1,030 × 275 mm | Logo goes on each cab door, below the handle. |

- The side sizes are estimated from the photo, scaled to the published L300 FB length of 4,260 mm (about 6.26 mm per photo pixel).
- Windows and wheel arches are marked as cut-outs with magenta dashed lines. Don't print inside them.
- **The decal shop must measure the actual van and adjust before printing.**
- `L300-SUNRISE-FINAL-OVERVIEW.jpg` shows both sides on the photo and the rear panel.
- The other options are in `FB-body-options/`. The first generic aluminium-van layout is in `zz-old-aluminium-van-assumption/` and is no longer used.
- Material: cast vinyl with UV laminate.

## 5. Placeholders to replace before printing
The contact details below are placeholders until CHRIS confirms them: phone `0917 XXX XXXX`, email `hello@solight.ph`, TikTok handle, and the name and title on the business card ("Juan Dela Cruz / Solar Consultant"). The flyer also has a QR-code box. Once the details are confirmed, every file can be regenerated in one step with `build.sh` (source code in the repo under `branding/`).
