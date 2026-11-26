#!/bin/bash
# Rebuilds the whole Kuya SoLight brand package into ./out
set -e
cd "$(dirname "$0")"
rm -rf out/01-social-media out/02-print out/03-apparel-drifit out/04-vehicle-L300-decal
python3 social.py >/dev/null
python3 printkit.py >/dev/null
python3 vanview.py
cd out
F=/usr/share/fonts/opentype/inter
montage -label '%t' -pointsize 22 -font $F/Inter-Bold.otf -geometry 520x400+14+14 -tile 4x -background '#f2f4f7' \
 01-social-media/profile/profile-character-1080.png 01-social-media/profile/profile-logo-mark-1080.png 01-social-media/covers/facebook-cover-1640x924.png 01-social-media/covers/youtube-banner-2560x1440.png \
 01-social-media/post-templates/reel-cover-story-1080x1920.png 01-social-media/post-templates/tip-post-portrait-1080x1350.png 01-social-media/post-templates/question-post-1080x1350.png 01-social-media/post-templates/youtube-thumbnail-1280x720.png \
 02-print/business-card/proofs/business-card-front-proof.png 02-print/business-card/proofs/business-card-back-proof.png 02-print/flyer/proofs/flyer-A4-proof.png 02-print/tarpaulin/proofs/tarpaulin-6x3ft-proof.png \
 02-print/standee/proofs/rollup-standee-85x200cm-proof.png 02-print/sticker/proofs/sticker-80mm-round-proof.png 03-apparel-drifit/mockups/drifit-mockup.png 04-vehicle-L300-decal/L300-layout-overview.png /tmp/sheet-body.png
convert -size 2192x140 xc:'#0B3B7A' -font $F/Inter-Black.otf -pointsize 64 -fill '#F5AE0B' -annotate +40+92 'Kuya' -fill white -annotate +235+92 'SoLight  Brand Package (preview)' -font $F/Inter-SemiBold.otf -pointsize 30 -fill '#F5AE0B' -annotate +1560+88 'Life is SoLight with Solar.' /tmp/head.png
convert /tmp/head.png /tmp/sheet-body.png -append -depth 8 -quality 88 00-PREVIEW-SHEET.jpg
