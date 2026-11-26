#!/usr/bin/env python3
"""Upload one approved episode straight to YouTube with the owner's own OAuth.

Replaces the Windsor.ai YouTube route, which kept failing with "rate-limited"
(Windsor support ref 56246904). Standard library only.

Needs environment variables YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
(scope https://www.googleapis.com/auth/youtube.upload), entered by the owner
in the cloud environment settings. Never print them.

    python3 publisher/youtube_direct.py E003            # dry run: shows what it would send
    python3 publisher/youtube_direct.py E003 --live     # uploads, sets the cover, records it

Note: until the Google Cloud project passes YouTube's API audit, YouTube keeps
API uploads private whatever privacyStatus we ask for.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import publisher as P  # noqa: E402

TOKEN_URL = "https://oauth2.googleapis.com/token"
UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
THUMB_URL = "https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}"


def access_token() -> str:
    body = urllib.parse.urlencode({
        "client_id": os.environ["YT_CLIENT_ID"],
        "client_secret": os.environ["YT_CLIENT_SECRET"],
        "refresh_token": os.environ["YT_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    with urllib.request.urlopen(urllib.request.Request(TOKEN_URL, data=body), timeout=60) as r:
        return json.loads(r.read())["access_token"]


def find_cover(post: Path, ep: str) -> Path | None:
    for name in (f"{ep}-cover.png", f"{ep}-thumbnail.jpg"):
        if (post / name).exists():
            return post / name
    return None


def build(cfg: dict, ep: str) -> dict:
    approvals = P.load_approvals(cfg)
    b = P.episode_bundle(cfg, ep, approvals.get(ep, {}))
    if b["blockers"]:
        raise SystemExit(f"{ep} not ready: {b['blockers']}")
    pc = cfg["platforms"]["youtube"]
    yt = b["youtube"]
    meta = {
        "snippet": {"title": yt["title"], "description": yt["description"], "tags": yt["tags"],
                    "categoryId": pc.get("category_id", "27")},
        "status": {"privacyStatus": pc.get("privacy_status", "public"),
                   "selfDeclaredMadeForKids": bool(pc.get("made_for_kids", False)),
                   "containsSyntheticMedia": True},
    }
    post = Path(b["video"]["path"]).parent
    return {"episode": ep, "video": b["video"], "metadata": meta, "cover": str(find_cover(post, ep) or "")}


def upload(plan: dict) -> dict:
    tok = access_token()
    v = plan["video"]
    init = urllib.request.Request(UPLOAD_URL, method="POST", data=json.dumps(plan["metadata"]).encode(), headers={
        "Authorization": f"Bearer {tok}", "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(v["bytes"])})
    with urllib.request.urlopen(init, timeout=60) as r:
        session = r.headers["Location"]
    with open(v["path"], "rb") as f:
        put = urllib.request.Request(session, method="PUT", data=f.read(), headers={
            "Authorization": f"Bearer {tok}", "Content-Type": "video/mp4"})
    with urllib.request.urlopen(put, timeout=600) as r:
        res = json.loads(r.read())
    out = {"id": res["id"], "url": f"https://youtube.com/shorts/{res['id']}",
           "privacy": res.get("status", {}).get("privacyStatus")}
    if plan["cover"]:
        ctype = "image/png" if plan["cover"].endswith(".png") else "image/jpeg"
        try:
            with open(plan["cover"], "rb") as f:
                req = urllib.request.Request(THUMB_URL.format(vid=res["id"]), method="POST", data=f.read(),
                                             headers={"Authorization": f"Bearer {tok}", "Content-Type": ctype})
            urllib.request.urlopen(req, timeout=120).read()
            out["cover_set"] = True
        except urllib.error.HTTPError as e:  # Shorts may refuse custom thumbnails
            out["cover_set"] = False
            out["cover_error"] = f"{e.code} {e.read()[:300]!r}"
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("episode")
    ap.add_argument("--live", action="store_true")
    args = ap.parse_args()
    cfg = P.load_config()
    plan = build(cfg, args.episode)
    ledger = P.load_ledger(cfg)
    if args.episode in ledger["episodes"] and "youtube" in ledger["episodes"][args.episode].get("platforms", {}):
        raise SystemExit(f"{args.episode} is already recorded on YouTube; not uploading again")
    if not args.live:
        print(json.dumps({"dry_run": True, **plan}, indent=2, ensure_ascii=False))
        return 0
    missing = [k for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN") if not os.environ.get(k)]
    if missing:
        raise SystemExit(f"missing environment variables: {missing}")
    res = upload(plan)
    P.record(cfg, args.episode, "youtube", res["id"], res["url"], plan["video"]["sha256"])
    print(json.dumps(res, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
