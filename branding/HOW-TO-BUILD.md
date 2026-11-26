# Building the Kuya SoLight brand package

1. Unzip the studio source to /home/claude/kuya-solight-studio (see project memory) and run `npm ci` there.
2. `pip install cairosvg pillow` and `apt-get install ghostscript imagemagick`; install the Inter font.
3. Export character A1 poses: `cd /home/claude/kuya-solight-studio && npx tsx <repo>/branding/char.ts` (writes /home/claude/brand/char/*.svg).
4. Copy these scripts to /home/claude/brand and run `./build.sh`. Output goes to /home/claude/brand/out; copy it to /mnt/project-files/kuya-solight/branding/.

Contact details (phone, email, handle) live in `CONTACT` in lib.py.
