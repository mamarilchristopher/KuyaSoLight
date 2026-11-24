#!/usr/bin/env python3
"""Kuya SoLight auto-publisher.

Posts owner-approved episodes, in order, to the SoLight Solar PH Facebook Page
(Reel), YouTube (Short) and TikTok, each with its own platform caption.

Nothing here posts by itself. `plan` decides what is due and prints the exact
calls to make; the scheduled routine (see ROUTINE.md) makes the Facebook and
YouTube calls through the Windsor.ai connector and runs `tiktok` for TikTok,
then saves each result with `record`. A post goes out only when ALL of these
hold:

  * config.json has "live": true (the owner's go-live switch) and the platform
    is enabled;
  * the episode's ownerApproval.status is "approved" in the studio record;
  * its QA report says PASS;
  * the approved video and all three caption files are in E0xx/post/;
  * every earlier episode has already gone out on that platform (in order);
  * the schedule says a slot is open and nothing went out in this slot yet;
  * the ledger shows the episode was not posted to that platform before.

Standard library only (Python 3.9+). ffprobe is used to check the video.
"""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
PLATFORMS = ("facebook", "youtube", "tiktok")
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


# --------------------------------------------------------------------------- config / ledger

def load_config(path: Path | None = None) -> dict:
    path = path or Path(os.environ.get("KSL_PUBLISHER_CONFIG", HERE / "config.json"))
    cfg = json.loads(Path(path).read_text())
    cfg["_path"] = str(path)
    return cfg


def ledger_path(cfg: dict) -> Path:
    return Path(os.path.expandvars(cfg["ledger"]))


def load_ledger(cfg: dict) -> dict:
    p = ledger_path(cfg)
    if p.exists():
        return json.loads(p.read_text())
    return {"episodes": {}}


def save_ledger(cfg: dict, ledger: dict) -> None:
    p = ledger_path(cfg)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n")
    tmp.replace(p)


# --------------------------------------------------------------------------- approvals

def load_approvals(cfg: dict) -> dict[str, dict]:
    """ownerApproval per episode, read from the studio's episode records.

    Source is either a studio checkout (`studio_dir`) or the studio source zip
    (`studio_zip`) that the render thread keeps in project files.
    """
    src = cfg["approvals"]
    out: dict[str, dict] = {}
    studio_dir = src.get("studio_dir")
    if studio_dir and Path(studio_dir).is_dir():
        for p in sorted(Path(studio_dir).glob("episodes/E*/episode.json")):
            out[p.parent.name] = json.loads(p.read_text()).get("ownerApproval") or {}
        return out
    zpath = Path(os.path.expandvars(src["studio_zip"]))
    with zipfile.ZipFile(zpath) as z:
        for name in z.namelist():
            m = re.fullmatch(r"(?:[^/]+/)?episodes/(E\d{3})/episode\.json", name)
            if m:
                out[m.group(1)] = json.loads(z.read(name)).get("ownerApproval") or {}
    return out


# --------------------------------------------------------------------------- episode files

def parse_youtube(text: str) -> dict:
    """Split E0xx-youtube-shorts.txt into title, description and tags."""
    m_title = re.search(r"^TITLE:\s*\n(.+?)\s*\n\s*\n", text, re.S | re.M)
    m_desc = re.search(r"^DESCRIPTION:\s*\n(.*?)\n\s*TAGS\b[^\n]*:\s*\n", text, re.S | re.M)
    m_tags = re.search(r"^TAGS\b[^\n]*:\s*\n(.+)$", text, re.S | re.M)
    if not (m_title and m_desc and m_tags):
        raise ValueError("youtube caption file is not in TITLE/DESCRIPTION/TAGS form")
    tags = [t.strip() for t in re.split(r"[,\n]", m_tags.group(1)) if t.strip()]
    return {"title": m_title.group(1).strip(), "description": m_desc.group(1).strip(), "tags": tags}


def probe_video(path: Path) -> dict:
    try:
        raw = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height,r_frame_rate:format=duration",
             "-of", "json", str(path)],
            check=True, capture_output=True, text=True).stdout
    except (OSError, subprocess.CalledProcessError) as e:  # ffprobe missing or bad file
        return {"error": str(e)}
    d = json.loads(raw)
    s = d["streams"][0]
    num, den = (int(x) for x in s["r_frame_rate"].split("/"))
    return {"width": s["width"], "height": s["height"],
            "fps": round(num / den, 2) if den else 0,
            "duration": float(d["format"]["duration"])}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def episode_bundle(cfg: dict, ep: str, approval: dict) -> dict:
    """Everything the publisher knows about one episode, plus why it can't go out."""
    root = Path(os.path.expandvars(cfg["episodes_root"])) / ep
    post = root / "post"
    b: dict = {"episode": ep, "blockers": [], "approval": approval}

    if (approval or {}).get("status") != "approved":
        b["blockers"].append("not approved by owner")

    qa_path = root / f"{ep}.qa.json"
    qa = json.loads(qa_path.read_text()) if qa_path.exists() else {}
    b["qa"] = qa.get("verdict", "missing")
    # The QA report also checks owner approval, so a report made before approval
    # can say BLOCKED for that reason alone. Accept that one case.
    if b["qa"] != "PASS":
        fails = [c for c in qa.get("checks", []) if c.get("blocking") and c.get("status") == "fail"]
        only_approval = bool(fails) and all(c.get("id") == "OWNER-APPROVAL" for c in fails)
        if not (only_approval and approval.get("status") == "approved"):
            b["blockers"].append(f"QA verdict {b['qa']}")

    videos = sorted(post.glob("*.mp4"))
    if len(videos) != 1:
        b["blockers"].append(f"expected exactly one video in post/, found {len(videos)}")
    else:
        v = videos[0]
        b["video"] = {"path": str(v), "file": v.name, "bytes": v.stat().st_size, **probe_video(v)}
        b["video"]["sha256"] = sha256(v)
        b["blockers"] += video_problems(b["video"])

    for plat, fname in (("facebook", f"{ep}-facebook.txt"),
                        ("tiktok", f"{ep}-tiktok.txt"),
                        ("youtube", f"{ep}-youtube-shorts.txt")):
        p = post / fname
        if not p.exists():
            b["blockers"].append(f"missing {fname}")
            continue
        text = p.read_text().strip()
        if plat == "youtube":
            try:
                b["youtube"] = parse_youtube(text)
            except ValueError as e:
                b["blockers"].append(str(e))
                continue
            yt = b["youtube"]
            if len(yt["title"]) > 100:
                b["blockers"].append("YouTube title over 100 characters")
            if len(yt["description"]) > 5000:
                b["blockers"].append("YouTube description over 5000 characters")
            if len(", ".join(yt["tags"])) > 500:
                b["blockers"].append("YouTube tags over 500 characters")
        else:
            b[plat] = {"caption": text}
            limit = 2200 if plat == "tiktok" else 63206
            if len(text) > limit:
                b["blockers"].append(f"{plat} caption over {limit} characters")
    pinned = post / f"{ep}-pinned-comment.txt"
    if pinned.exists():
        b["pinned_comment"] = pinned.read_text().strip()
    return b


def video_problems(v: dict) -> list[str]:
    if "error" in v:
        return [f"could not read video: {v['error']}"]
    probs = []
    if not (3 <= v["duration"] <= 90):
        probs.append(f"video is {v['duration']:.1f}s; Facebook Reels need 3 to 90 s")
    if v["width"] * 16 != v["height"] * 9:
        probs.append(f"video is {v['width']}x{v['height']}, not 9:16")
    if v["width"] < 540:
        probs.append("video narrower than 540 px")
    if not (24 <= v["fps"] <= 60):
        probs.append(f"video frame rate {v['fps']} outside 24 to 60")
    if v["bytes"] > 100 * 1024 * 1024:
        probs.append("video over 100 MB")
    return probs


# --------------------------------------------------------------------------- schedule

def last_slot(cfg: dict, now: dt.datetime) -> dt.datetime | None:
    """Most recent scheduled posting time at or before `now` (in the last 8 days)."""
    s = cfg["schedule"]
    tz = ZoneInfo(s["timezone"])
    local = now.astimezone(tz)
    hh, mm = (int(x) for x in s["time"].split(":"))
    days = {DAYS.index(d.lower()[:3]) for d in s["days"]}
    for back in range(0, 8):
        d = (local - dt.timedelta(days=back)).date()
        if d.weekday() in days:
            slot = dt.datetime(d.year, d.month, d.day, hh, mm, tzinfo=tz)
            if slot <= local:
                return slot
    return None


def slot_open(cfg: dict, ledger: dict, now: dt.datetime) -> tuple[bool, str]:
    slot = last_slot(cfg, now)
    if slot is None:
        return False, "no posting day in schedule"
    late = (now - slot).total_seconds() / 3600
    if late > cfg["schedule"].get("grace_hours", 6):
        return False, f"last slot {slot.isoformat()} passed more than grace_hours ago"
    # An episode "starts" in a slot when its first platform post lands. One per slot.
    for ep, epdata in ledger["episodes"].items():
        first = epdata.get("first_posted_at")
        if first and dt.datetime.fromisoformat(first) >= slot:
            in_flight = [p for p in enabled_platforms(cfg) if p not in epdata.get("platforms", {})]
            if not in_flight:
                return False, f"{ep} already went out in the {slot.isoformat()} slot"
    return True, f"slot {slot.isoformat()} open"


def enabled_platforms(cfg: dict) -> list[str]:
    return [p for p in PLATFORMS if cfg["platforms"][p].get("enabled")]


# --------------------------------------------------------------------------- planning

def all_episode_ids(cfg: dict, approvals: dict) -> list[str]:
    root = Path(os.path.expandvars(cfg["episodes_root"]))
    ids = {p.name for p in root.glob("E[0-9][0-9][0-9]") if p.is_dir()} | set(approvals)
    return sorted(ids)


def media_url(cfg: dict, bundle: dict) -> str | None:
    override = cfg.get("media_url_overrides", {}).get(bundle["episode"])
    if override:
        return override
    base = cfg.get("media_url_template")
    if not base or "video" not in bundle:
        return None
    return base.format(episode=bundle["episode"], file=bundle["video"]["file"])


def build_action(cfg: dict, plat: str, b: dict, url: str | None) -> dict:
    pc = cfg["platforms"][plat]
    if plat == "facebook":
        return {"platform": "facebook", "via": "windsor", "connector": "facebook_organic",
                "account": pc["page_id"], "action": "create_reel",
                "params": {"video_url": url, "description": b["facebook"]["caption"]}}
    if plat == "youtube":
        yt = b["youtube"]
        return {"platform": "youtube", "via": "windsor", "connector": "youtube",
                "account": pc.get("channel_id") or "<connect YouTube in Windsor first>",
                "action": "upload_video",
                "params": {"video_url": url, "title": yt["title"], "description": yt["description"],
                           "tags": yt["tags"], "category_id": pc.get("category_id", "27"),
                           "made_for_kids": bool(pc.get("made_for_kids", False)),
                           "privacy_status": pc.get("privacy_status", "public")}}
    return {"platform": "tiktok", "via": "cli",
            "command": f"python3 publisher/publisher.py tiktok {b['episode']} --live"}


def plan(cfg: dict, now: dt.datetime, ignore_schedule: bool = False) -> dict:
    approvals = load_approvals(cfg)
    ledger = load_ledger(cfg)
    result: dict = {"now": now.isoformat(), "live": bool(cfg.get("live")), "actions": [],
                    "notes": []}
    plats = enabled_platforms(cfg)
    if not plats:
        result["notes"].append("no platform enabled in config")
        return result

    ok, why = (True, "schedule ignored") if ignore_schedule else slot_open(cfg, ledger, now)
    result["schedule"] = why

    # Per platform, the next episode is the first one not yet posted there.
    # In-order rule: if that episode isn't ready, nothing later goes out either.
    ids = all_episode_ids(cfg, approvals)
    start_from = cfg.get("start_from_episode", ids[0] if ids else "E001")
    ids = [e for e in ids if e >= start_from]
    bundles: dict[str, dict] = {}
    targets: dict[str, str] = {}
    for plat in plats:
        for ep in ids:
            done = ledger["episodes"].get(ep, {}).get("platforms", {}).get(plat)
            if done:
                continue
            targets[plat] = ep
            break

    if not targets:
        result["notes"].append("every episode is posted on every enabled platform")
        return result

    # Finish an episode on all platforms before starting the next one.
    ep = min(targets.values())
    result["episode"] = ep
    b = bundles.setdefault(ep, episode_bundle(cfg, ep, approvals.get(ep, {})))
    result["blockers"] = list(b["blockers"])
    pinned = ledger["episodes"].get(ep, {}).get("approved_video_sha256")
    if pinned and b.get("video") and pinned != b["video"]["sha256"]:
        result["blockers"].append("video changed after it started posting; owner must re-approve")

    started = ep in ledger["episodes"] and ledger["episodes"][ep].get("platforms")
    if not started and not ok:
        result["notes"].append(f"not due: {why}")
        return result

    if result["blockers"]:
        result["ready"] = False
        result["notes"].append(f"{ep} is next in order but blocked, so nothing goes out")
        return result

    url = media_url(cfg, b)
    for plat in plats:
        if targets.get(plat) != ep:
            continue
        a = build_action(cfg, plat, b, url)
        a["blockers"] = []
        if plat in ("facebook", "youtube") and not url:
            a["blockers"].append("no public video URL (set media_url_template)")
        if plat == "youtube" and not cfg["platforms"]["youtube"].get("channel_id"):
            a["blockers"].append("YouTube not connected in Windsor")
        if plat == "tiktok" and not os.environ.get(cfg["platforms"]["tiktok"].get("token_env", "TIKTOK_ACCESS_TOKEN")):
            a["blockers"].append("no TikTok access token in environment")
        result["actions"].append(a)

    result["video"] = b.get("video")
    if b.get("pinned_comment"):
        result["pinned_comment"] = b["pinned_comment"]
    result["ready"] = (result["live"] and not result["blockers"]
                       and any(not a["blockers"] for a in result["actions"]))
    if not result["live"]:
        result["notes"].append("DRY RUN: config.json live is false, so nothing may be posted")
    return result


# --------------------------------------------------------------------------- record

def record(cfg: dict, ep: str, plat: str, post_id: str, url: str | None, video_sha: str | None,
           now: dt.datetime | None = None) -> None:
    ledger = load_ledger(cfg)
    e = ledger["episodes"].setdefault(ep, {"platforms": {}})
    if plat in e["platforms"]:
        raise SystemExit(f"{ep} is already recorded as posted on {plat}; refusing to overwrite")
    now = (now or dt.datetime.now(dt.timezone.utc)).isoformat(timespec="seconds")
    e["platforms"][plat] = {"id": post_id, "url": url, "posted_at": now}
    e.setdefault("first_posted_at", now)
    if video_sha:
        e.setdefault("approved_video_sha256", video_sha)
    save_ledger(cfg, ledger)


# --------------------------------------------------------------------------- TikTok

TT_API = "https://open.tiktokapis.com"


def _tt(method: str, path: str, token: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        TT_API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {token}",
                 "Content-Type": "application/json; charset=UTF-8"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read())
    if d.get("error", {}).get("code") not in (None, "ok"):
        raise SystemExit(f"TikTok error: {d['error']}")
    return d["data"]


def tiktok_post(cfg: dict, ep: str, live: bool) -> dict:
    """Direct Post through TikTok's Content Posting API, uploading the file itself."""
    approvals = load_approvals(cfg)
    b = episode_bundle(cfg, ep, approvals.get(ep, {}))
    if b["blockers"]:
        raise SystemExit(f"{ep} not ready: {b['blockers']}")
    pc = cfg["platforms"]["tiktok"]
    caption = b["tiktok"]["caption"]
    size = b["video"]["bytes"]
    payload = {
        "post_info": {"title": caption, "privacy_level": pc.get("privacy_level", "PUBLIC_TO_EVERYONE"),
                      "disable_comment": False, "disable_duet": False, "disable_stitch": False,
                      "brand_content_toggle": False, "brand_organic_toggle": True,
                      "is_aigc": bool(pc.get("is_aigc", True))},
        "source_info": {"source": "FILE_UPLOAD", "video_size": size,
                        "chunk_size": size, "total_chunk_count": 1},
    }
    if not (live and cfg.get("live") and pc.get("enabled")):
        return {"dry_run": True, "would_send": payload, "file": b["video"]["path"]}
    token = os.environ[pc.get("token_env", "TIKTOK_ACCESS_TOKEN")]
    info = _tt("POST", "/v2/post/publish/creator_info/query/", token, {})
    allowed = info.get("privacy_level_options", [])
    if payload["post_info"]["privacy_level"] not in allowed:
        # Unaudited TikTok apps may only post SELF_ONLY until TikTok approves them.
        payload["post_info"]["privacy_level"] = "SELF_ONLY" if "SELF_ONLY" in allowed else allowed[0]
    init = _tt("POST", "/v2/post/publish/video/init/", token, payload)
    with open(b["video"]["path"], "rb") as f:
        data = f.read()
    req = urllib.request.Request(init["upload_url"], data=data, method="PUT", headers={
        "Content-Type": "video/mp4", "Content-Length": str(size),
        "Content-Range": f"bytes 0-{size - 1}/{size}"})
    urllib.request.urlopen(req, timeout=300).read()
    return {"publish_id": init["publish_id"], "privacy_level": payload["post_info"]["privacy_level"],
            "video_sha256": b["video"]["sha256"]}


# --------------------------------------------------------------------------- status

def status(cfg: dict) -> list[dict]:
    approvals = load_approvals(cfg)
    ledger = load_ledger(cfg)
    rows = []
    for ep in all_episode_ids(cfg, approvals):
        b = episode_bundle(cfg, ep, approvals.get(ep, {}))
        posted = ledger["episodes"].get(ep, {}).get("platforms", {})
        rows.append({"episode": ep, "approved": approvals.get(ep, {}).get("status") == "approved",
                     "ready": not b["blockers"], "blockers": b["blockers"],
                     "posted": {p: posted.get(p, {}).get("url") or bool(posted.get(p)) for p in PLATFORMS}})
    return rows


# --------------------------------------------------------------------------- CLI

def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--config", type=Path)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sp = sub.add_parser("plan", help="print what is due now and the exact calls to make")
    sp.add_argument("--now", help="ISO time to plan for (default: now)")
    sp.add_argument("--ignore-schedule", action="store_true")
    sub.add_parser("status", help="every episode: approved, ready, where posted")
    sr = sub.add_parser("record", help="save a successful post in the ledger")
    sr.add_argument("episode"); sr.add_argument("platform", choices=PLATFORMS)
    sr.add_argument("--id", required=True); sr.add_argument("--url")
    sr.add_argument("--video-sha256")
    st = sub.add_parser("tiktok", help="post one episode to TikTok (dry run unless --live)")
    st.add_argument("episode"); st.add_argument("--live", action="store_true")
    args = ap.parse_args(argv)
    cfg = load_config(args.config)

    if args.cmd == "plan":
        now = dt.datetime.fromisoformat(args.now) if args.now else dt.datetime.now(dt.timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=dt.timezone.utc)
        print(json.dumps(plan(cfg, now, args.ignore_schedule), indent=2, ensure_ascii=False))
    elif args.cmd == "status":
        print(json.dumps(status(cfg), indent=2, ensure_ascii=False))
    elif args.cmd == "record":
        record(cfg, args.episode, args.platform, args.id, args.url, args.video_sha256)
        print(f"recorded {args.episode} on {args.platform}")
    elif args.cmd == "tiktok":
        print(json.dumps(tiktok_post(cfg, args.episode, args.live), indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
