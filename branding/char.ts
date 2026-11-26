import { A_VARIANTS } from '/home/claude/kuya-solight-studio/pipeline/characters/variantsA.ts';
import { writeFileSync } from 'node:fs';
const A1 = A_VARIANTS[0];
const shots: Record<string, any> = {
  wave: { view: 'front', expr: 'smile', mouth: 'smile', pose: { lArm: { shoulder: 8, elbow: 6, hand: 'open' }, rArm: { shoulder: 130, elbow: 50, hand: 'wave' }, lLeg: 3, rLeg: 4, lean: 0, headTilt: -3, bob: 0 } },
  present: { view: 'front', expr: 'smile', mouth: 'smile', pose: { lArm: { shoulder: 50, elbow: 30, hand: 'open' }, rArm: { shoulder: 50, elbow: 30, hand: 'open' }, lLeg: 4, rLeg: 4, lean: 0, headTilt: 0, bob: 0 } },
  pointup: { view: 'front', expr: 'explain', mouth: 'smile', pose: { lArm: { shoulder: 8, elbow: 6, hand: 'open' }, rArm: { shoulder: 150, elbow: 12, hand: 'point' }, lLeg: 3, rLeg: 3, lean: 1, headTilt: 5, bob: 0 } },
  explain: { view: 'front', expr: 'explain', mouth: 'eh', pose: { lArm: { shoulder: 10, elbow: 8, hand: 'open' }, rArm: { shoulder: 38, elbow: 95, hand: 'open' }, lLeg: 3, rLeg: 3, lean: 0, headTilt: 3, bob: 0 } },
  idle: { view: 'front', expr: 'smile', mouth: 'smile', pose: { lArm: { shoulder: 8, elbow: 6, hand: 'open' }, rArm: { shoulder: 8, elbow: 6, hand: 'open' }, lLeg: 3, rLeg: 3, lean: 0, headTilt: 0, bob: 0 } },
};
for (const [k, s] of Object.entries(shots)) {
  writeFileSync(`/home/claude/brand/char/${k}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1500" width="600" height="1500">${A1.draw(s)}</svg>`);
}
console.log(A1.id, A1.head, A1.footY);
