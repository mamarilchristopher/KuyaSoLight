// Episode production state machine (spec §14) with mandatory approval gates.
// Pure functions so they can be unit-tested; the API layer supplies the facts.

/** 'online-checked': owner waived the human reviewer (24 Nov 2026); claims were fact-checked online against published sources. */
export const SIGNOFF_OK = ['approved', 'online-checked'];

export const STATES = [
  'IDEA', 'RESEARCH_REQUIRED', 'CLAIMS_VERIFIED', 'SCRIPT_DRAFT', 'TECHNICAL_REVIEW', 'SCRIPT_APPROVED', 'STORYBOARD',
  'VOICE_SUBTITLES', 'VIDEO_RENDER', 'AV_QA', 'OWNER_APPROVAL', 'READY_TO_PUBLISH', 'SCHEDULED', 'PUBLISHED', 'PERFORMANCE_REVIEW',
] as const;
export type State = (typeof STATES)[number];

export const STATE_LABEL: Record<State, string> = {
  IDEA: 'Idea', RESEARCH_REQUIRED: 'Research required', CLAIMS_VERIFIED: 'Claims verified', SCRIPT_DRAFT: 'Script draft',
  TECHNICAL_REVIEW: 'Technical review', SCRIPT_APPROVED: 'Script approved', STORYBOARD: 'Storyboard', VOICE_SUBTITLES: 'Voice & subtitle generation',
  VIDEO_RENDER: 'Video render', AV_QA: 'Audio/visual QA', OWNER_APPROVAL: 'Owner approval', READY_TO_PUBLISH: 'Ready to publish',
  SCHEDULED: 'Scheduled', PUBLISHED: 'Published', PERFORMANCE_REVIEW: 'Performance review',
};

export type Role = 'owner' | 'producer' | 'reviewer' | 'editor' | 'publisher';

/** Rejections may only go back to these earlier stages. */
const REJECT_TO: Partial<Record<State, State[]>> = {
  CLAIMS_VERIFIED: ['RESEARCH_REQUIRED'],
  TECHNICAL_REVIEW: ['SCRIPT_DRAFT', 'RESEARCH_REQUIRED'],
  SCRIPT_APPROVED: ['SCRIPT_DRAFT'],
  STORYBOARD: ['SCRIPT_DRAFT'],
  VOICE_SUBTITLES: ['STORYBOARD', 'SCRIPT_DRAFT'],
  VIDEO_RENDER: ['STORYBOARD', 'VOICE_SUBTITLES'],
  AV_QA: ['STORYBOARD', 'VOICE_SUBTITLES', 'VIDEO_RENDER'],
  OWNER_APPROVAL: ['SCRIPT_DRAFT', 'STORYBOARD', 'VOICE_SUBTITLES', 'VIDEO_RENDER'],
  READY_TO_PUBLISH: ['OWNER_APPROVAL', 'VIDEO_RENDER'],
  SCHEDULED: ['READY_TO_PUBLISH'],
};

/** Who may move an episode INTO a state (forward). Owner can do everything an earlier role can, except it cannot skip gates. */
const ENTER_ROLES: Record<State, Role[]> = {
  IDEA: ['owner', 'producer'], RESEARCH_REQUIRED: ['owner', 'producer'], CLAIMS_VERIFIED: ['owner', 'reviewer'],
  SCRIPT_DRAFT: ['owner', 'producer'], TECHNICAL_REVIEW: ['owner', 'producer'], SCRIPT_APPROVED: ['reviewer', 'owner'],
  STORYBOARD: ['owner', 'producer', 'editor'], VOICE_SUBTITLES: ['owner', 'producer', 'editor'], VIDEO_RENDER: ['owner', 'producer', 'editor'],
  AV_QA: ['owner', 'producer', 'editor'], OWNER_APPROVAL: ['owner', 'producer', 'editor'], READY_TO_PUBLISH: ['owner'],
  SCHEDULED: ['owner', 'publisher'], PUBLISHED: ['owner', 'publisher'], PERFORMANCE_REVIEW: ['owner', 'publisher', 'producer'],
};

export interface Facts {
  claims: { id: string; status: string; sourceCount: number; technicalSignoff: string; stale?: boolean }[];
  hasScript: boolean;
  scriptHasHook: boolean;
  hasStoryboard: boolean;
  subtitleQaPassed: boolean;
  latestRender?: { blockingFailures: string[] } | null;
  ownerApproved: boolean;
  scheduledDate?: string | null;
  publishedUrl?: string | null;
  logoSupplied: boolean;
  characterApproved: boolean;
}

export interface Verdict { ok: boolean; reasons: string[] }

export function gate(to: State, f: Facts): Verdict {
  const r: string[] = [];
  const need = (cond: boolean, msg: string) => { if (!cond) r.push(msg); };
  switch (to) {
    case 'CLAIMS_VERIFIED':
      need(f.claims.length > 0, 'Extract at least one factual claim (or record that the episode makes none).');
      for (const c of f.claims) {
        need(c.status === 'verified' || c.status === 'verified-with-conditions', `Claim ${c.id} is ${c.status}.`);
        need(c.sourceCount > 0, `Claim ${c.id} has no source.`);
        need(!c.stale, `Claim ${c.id} relies on a stale source.`);
      }
      break;
    case 'TECHNICAL_REVIEW':
      need(f.hasScript, 'Script narration is empty.'); need(f.scriptHasHook, 'Script has no hook cue.'); break;
    case 'SCRIPT_APPROVED':
      for (const c of f.claims) need(SIGNOFF_OK.includes(c.technicalSignoff), `Claim ${c.id} lacks technical sign-off.`);
      break;
    case 'STORYBOARD': break;
    case 'VOICE_SUBTITLES': need(f.hasStoryboard, 'Every cue needs a scene in the storyboard.'); break;
    case 'VIDEO_RENDER': need(f.subtitleQaPassed, 'Subtitle/transcript QA has not passed for the current narration.'); break;
    case 'AV_QA': need(!!f.latestRender, 'No render exists for the current version.'); break;
    case 'OWNER_APPROVAL': {
      const allowed = new Set(['OWNER-APPROVAL']);
      const blockers = (f.latestRender?.blockingFailures || []).filter((b) => !allowed.has(b));
      need(!!f.latestRender, 'No render to review.');
      need(blockers.length === 0, `Render QA has blocking failures: ${blockers.join(', ')}`);
      break;
    }
    case 'READY_TO_PUBLISH':
      need(f.ownerApproved, 'Owner approval missing.'); need(f.logoSupplied, 'Official master logo not supplied.'); need(f.characterApproved, 'Character version not approved.');
      for (const c of f.claims) { need(SIGNOFF_OK.includes(c.technicalSignoff), `Claim ${c.id} lacks technical sign-off.`); need(!c.stale, `Claim ${c.id} source is stale — re-verify before publishing.`); }
      break;
    case 'SCHEDULED': need(!!f.scheduledDate, 'Set a scheduled date.'); break;
    case 'PUBLISHED': need(!!f.publishedUrl, 'Record the public post URL.'); break;
  }
  return { ok: r.length === 0, reasons: r };
}

export function canTransition(from: State, to: State, roles: Role[], f: Facts): Verdict {
  const fi = STATES.indexOf(from), ti = STATES.indexOf(to);
  if (fi < 0 || ti < 0) return { ok: false, reasons: ['Unknown state.'] };
  if (ti === fi + 1) {
    if (!roles.some((x) => ENTER_ROLES[to].includes(x))) return { ok: false, reasons: [`Role ${roles.join('/')} cannot move an episode to ${STATE_LABEL[to]}.`] };
    return gate(to, f);
  }
  if (ti < fi) {
    if (!(REJECT_TO[from] || []).includes(to)) return { ok: false, reasons: [`Rejection from ${STATE_LABEL[from]} may only return to: ${(REJECT_TO[from] || []).map((s) => STATE_LABEL[s]).join(', ') || 'none'}.`] };
    if (!roles.some((x) => ['owner', 'reviewer', 'producer', 'editor'].includes(x))) return { ok: false, reasons: ['Role cannot reject.'] };
    return { ok: true, reasons: [] };
  }
  return { ok: false, reasons: ['Skipping stages is not allowed; mandatory gates must be passed in order.'] };
}

export function nextStates(from: State): { forward?: State; back: State[] } {
  const i = STATES.indexOf(from);
  return { forward: STATES[i + 1], back: REJECT_TO[from] || [] };
}

/** What an edit invalidates (spec §14). */
export function invalidationsForEdit(state: State, change: { claimCuesChanged: string[]; numbersChanged: boolean; narrationChanged: boolean }) {
  const out: { resetSignoffFor: string[]; moveTo?: State; staleRenders: boolean; notes: string[] } = { resetSignoffFor: change.claimCuesChanged, staleRenders: false, notes: [] };
  const idx = STATES.indexOf(state);
  if ((change.claimCuesChanged.length || change.numbersChanged) && idx >= STATES.indexOf('TECHNICAL_REVIEW')) {
    out.moveTo = 'TECHNICAL_REVIEW'; out.notes.push('Technical/numerical wording changed: prior technical approval invalidated.');
  } else if (change.narrationChanged && idx >= STATES.indexOf('VOICE_SUBTITLES')) {
    out.moveTo = 'VOICE_SUBTITLES'; out.notes.push('Narration changed: voice, subtitle timing and transcript validation must re-run.');
  }
  if (change.narrationChanged && idx >= STATES.indexOf('VIDEO_RENDER')) out.staleRenders = true;
  if (out.moveTo && STATES.indexOf(out.moveTo) > idx) out.moveTo = undefined;
  return out;
}

export const FRESHNESS_DAYS: Record<string, number> = { 'electricity-rate': 31, regulatory: 30, price: 7, compatibility: 90, evergreen: 365, 'customer-savings': 180 };
