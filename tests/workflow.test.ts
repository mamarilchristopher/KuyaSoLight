import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, invalidationsForEdit, Facts } from '../server/workflow.ts';
import { subtitleQA, breakLines } from '../pipeline/render/subtitles.ts';

const base: Facts = { claims: [{ id: 'C1', status: 'verified', sourceCount: 1, technicalSignoff: 'pending' }], hasScript: true, scriptHasHook: true, hasStoryboard: true, subtitleQaPassed: true, latestRender: { blockingFailures: [] }, ownerApproved: false, logoSupplied: false, characterApproved: true };

test('cannot skip stages', () => assert.equal(canTransition('SCRIPT_DRAFT', 'SCRIPT_APPROVED', ['owner'], base).ok, false));
test('script approval needs technical sign-off on every claim', () => {
  assert.equal(canTransition('TECHNICAL_REVIEW', 'SCRIPT_APPROVED', ['reviewer'], base).ok, false);
  assert.equal(canTransition('TECHNICAL_REVIEW', 'SCRIPT_APPROVED', ['reviewer'], { ...base, claims: [{ ...base.claims[0], technicalSignoff: 'approved' }] }).ok, true);
});
test('producer cannot approve technical review', () => assert.equal(canTransition('TECHNICAL_REVIEW', 'SCRIPT_APPROVED', ['producer'], { ...base, claims: [] }).ok, false));
test('claims need sources and must not be stale', () => {
  assert.equal(canTransition('RESEARCH_REQUIRED', 'CLAIMS_VERIFIED', ['reviewer'], { ...base, claims: [{ id: 'C', status: 'verified', sourceCount: 0, technicalSignoff: 'pending' }] }).ok, false);
  assert.equal(canTransition('RESEARCH_REQUIRED', 'CLAIMS_VERIFIED', ['reviewer'], { ...base, claims: [{ id: 'C', status: 'verified', sourceCount: 1, technicalSignoff: 'pending', stale: true }] }).ok, false);
});
test('ready-to-publish blocked without logo, owner approval and sign-off', () => {
  const v = canTransition('OWNER_APPROVAL', 'READY_TO_PUBLISH', ['owner'], base);
  assert.equal(v.ok, false); assert.ok(v.reasons.some((r) => /logo/.test(r))); assert.ok(v.reasons.some((r) => /Owner approval/.test(r)));
});
test('render QA failures block owner review', () => assert.equal(canTransition('AV_QA', 'OWNER_APPROVAL', ['editor'], { ...base, latestRender: { blockingFailures: ['SUB-TRANSCRIPT-MATCH'] } }).ok, false));
test('rejection only to allowed earlier stages', () => {
  assert.equal(canTransition('OWNER_APPROVAL', 'STORYBOARD', ['owner'], base).ok, true);
  assert.equal(canTransition('OWNER_APPROVAL', 'IDEA', ['owner'], base).ok, false);
});
test('editing a claim cue after approval invalidates technical approval', () => {
  const r = invalidationsForEdit('VIDEO_RENDER', { claimCuesChanged: ['C1'], numbersChanged: false, narrationChanged: true });
  assert.equal(r.moveTo, 'TECHNICAL_REVIEW'); assert.deepEqual(r.resetSignoffFor, ['C1']); assert.equal(r.staleRenders, true);
});
test('non-claim narration edit re-runs voice + subtitles', () => assert.equal(invalidationsForEdit('AV_QA', { claimCuesChanged: [], numbersChanged: false, narrationChanged: true }).moveTo, 'VOICE_SUBTITLES'));
test('subtitle QA catches altered numbers and words', () => {
  const qa = subtitleQA('Ang 6 kWp system ay hindi 6 kW inverter.', [{ id: 'a', text: 'Ang 5 kWp system ay hindi 6 kW inverter.', start: 0, end: 3 }], []);
  assert.equal(qa.find((c) => c.id === 'SUB-NUMBERS-MATCH')!.status, 'fail');
  assert.equal(qa.find((c) => c.id === 'SUB-TRANSCRIPT-MATCH')!.status, 'fail');
});
test('locked tagline must be exact', () => {
  const qa = subtitleQA('Life is SoLight with solar', [{ id: 't', text: 'Life is SoLight with solar', start: 0, end: 1 }], ['Life is SoLight with Solar.']);
  assert.equal(qa.find((c) => c.id === 'BRAND-LINE-EXACT')!.status, 'fail');
});
test('line breaking keeps two lines', () => assert.ok(breakLines('Dahil ang gusto ni Kuya SoLight… naka-solar ka na, SoSmart ka pa!').length <= 2));
