import { Resvg } from '@resvg/resvg-js';
import { readdirSync } from 'node:fs';
const FONT_DIR = '/usr/share/fonts/opentype/inter';
const fontFiles = (() => { try { return readdirSync(FONT_DIR).filter((f) => /^Inter-(Regular|Medium|SemiBold|Bold|ExtraBold|Black)\.otf$/.test(f)).map((f) => `${FONT_DIR}/${f}`); } catch { return []; } })();
export function svgToPng(svg: string, width?: number): Buffer {
  const r = new Resvg(svg, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' }, fitTo: width ? { mode: 'width', value: width } : { mode: 'original' } });
  return r.render().asPng();
}
