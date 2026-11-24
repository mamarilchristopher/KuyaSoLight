"""Safety tests for the publisher: run with `python3 -m unittest publisher/test_publisher.py`."""
import datetime as dt
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import publisher as P  # noqa: E402

YT = """TITLE:
Test title #Shorts

DESCRIPTION:
Line one

Line two

TAGS (YouTube Studio > Tags):
a, b, c
"""
WED_7PM = dt.datetime(2026, 11, 25, 11, 5, tzinfo=dt.timezone.utc)   # 19:05 Manila, Wednesday
THU_7PM = dt.datetime(2026, 11, 26, 11, 5, tzinfo=dt.timezone.utc)   # Thursday: not a posting day
FRI_7PM = dt.datetime(2026, 11, 27, 11, 5, tzinfo=dt.timezone.utc)


def make_video(path: Path, colour: str = "black") -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"color={colour}:s=540x960:r=30:d=4",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", str(path)], check=True)


class PublisherTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.video_src = Path(tempfile.mkdtemp()) / "v.mp4"
        make_video(cls.video_src)

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.studio = self.tmp / "studio"
        for ep, approved in (("E001", True), ("E002", True), ("E003", False)):
            self.add_episode(ep, approved)
        self.cfg = {
            "live": False, "episodes_root": str(self.tmp / "files"),
            "ledger": str(self.tmp / "ledger.json"),
            "approvals": {"studio_dir": str(self.studio)},
            "schedule": {"timezone": "Asia/Manila", "days": ["mon", "wed", "fri"],
                         "time": "19:00", "grace_hours": 6},
            "media_url_template": "https://example.org/{episode}/{file}",
            "platforms": {"facebook": {"enabled": True, "page_id": "1"},
                          "youtube": {"enabled": True, "channel_id": "UC1"},
                          "tiktok": {"enabled": False}},
        }

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def add_episode(self, ep, approved):
        d = self.studio / "episodes" / ep
        d.mkdir(parents=True)
        appr = {"status": "approved", "by": "CHRIS"} if approved else None
        (d / "episode.json").write_text(json.dumps({"id": ep, "ownerApproval": appr}))
        post = self.tmp / "files" / ep / "post"
        post.mkdir(parents=True)
        checks = [{"id": "OWNER-APPROVAL", "status": "pass" if approved else "fail", "blocking": True}]
        (post.parent / f"{ep}.qa.json").write_text(json.dumps(
            {"verdict": "PASS" if approved else "BLOCKED", "checks": checks}))
        shutil.copy(self.video_src, post / f"KuyaSoLight-{ep}.mp4")
        (post / f"{ep}-facebook.txt").write_text(f"fb {ep}")
        (post / f"{ep}-tiktok.txt").write_text(f"tt {ep}")
        (post / f"{ep}-youtube-shorts.txt").write_text(YT)

    def post_all(self, ep, plats=("facebook", "youtube"), at=WED_7PM):
        for p in plats:
            P.record(self.cfg, ep, p, f"{ep}-{p}", None, None, now=at)

    def test_dry_run_is_never_ready(self):
        r = P.plan(self.cfg, WED_7PM)
        self.assertEqual(r["episode"], "E001")
        self.assertFalse(r["ready"])
        self.cfg["live"] = True
        self.assertTrue(P.plan(self.cfg, WED_7PM)["ready"])

    def test_youtube_parse(self):
        yt = P.parse_youtube(YT)
        self.assertEqual(yt["title"], "Test title #Shorts")
        self.assertEqual(yt["description"], "Line one\n\nLine two")
        self.assertEqual(yt["tags"], ["a", "b", "c"])

    def test_not_due_on_off_day(self):
        self.cfg["live"] = True
        r = P.plan(self.cfg, THU_7PM)
        self.assertEqual(r["actions"], [])

    def test_one_episode_per_slot_then_next_in_order(self):
        self.cfg["live"] = True
        self.post_all("E001")
        self.assertEqual(P.plan(self.cfg, WED_7PM + dt.timedelta(minutes=30))["actions"], [])
        r = P.plan(self.cfg, FRI_7PM)
        self.assertEqual(r["episode"], "E002")
        self.assertTrue(r["ready"])

    def test_half_posted_episode_finishes_before_next(self):
        self.cfg["live"] = True
        self.post_all("E001", plats=("facebook",))
        r = P.plan(self.cfg, FRI_7PM)
        self.assertEqual(r["episode"], "E001")
        self.assertEqual([a["platform"] for a in r["actions"]], ["youtube"])

    def test_unapproved_episode_blocks_everything_after_it(self):
        self.cfg["live"] = True
        self.post_all("E001"); self.post_all("E002", at=FRI_7PM)
        self.add_episode("E004", True)
        r = P.plan(self.cfg, FRI_7PM + dt.timedelta(days=3))
        self.assertEqual(r["episode"], "E003")
        self.assertIn("not approved by owner", r["blockers"])
        self.assertFalse(r["ready"])

    def test_record_refuses_double_post(self):
        self.post_all("E001", plats=("facebook",))
        with self.assertRaises(SystemExit):
            P.record(self.cfg, "E001", "facebook", "again", None, None)

    def test_changed_video_needs_reapproval(self):
        self.cfg["live"] = True
        P.record(self.cfg, "E001", "facebook", "x", None, "0" * 64)
        r = P.plan(self.cfg, FRI_7PM)
        self.assertFalse(r["ready"])
        self.assertTrue(any("re-approve" in b for b in r["blockers"]))

    def test_missing_caption_blocks(self):
        self.cfg["live"] = True
        (self.tmp / "files/E001/post/E001-youtube-shorts.txt").unlink()
        r = P.plan(self.cfg, WED_7PM)
        self.assertFalse(r["ready"])

    def test_manual_tiktok_gets_package_and_does_not_hold_queue(self):
        self.cfg["live"] = True
        self.cfg["platforms"]["tiktok"] = {"enabled": True, "mode": "manual"}
        r = P.plan(self.cfg, WED_7PM)
        tt = [a for a in r["actions"] if a["platform"] == "tiktok"][0]
        self.assertEqual(tt["via"], "owner")
        self.assertEqual(tt["package"]["caption"], "tt E001")
        self.assertEqual(tt["blockers"], [])
        self.assertTrue(r["ready"])
        # Facebook + YouTube done: the slot is used, and TikTok never holds the queue.
        self.post_all("E001")
        self.assertEqual(P.plan(self.cfg, WED_7PM + dt.timedelta(minutes=30))["actions"], [])
        r = P.plan(self.cfg, FRI_7PM)
        self.assertEqual(r["episode"], "E002")

    def test_tiktok_dry_run_sends_nothing(self):
        out = P.tiktok_post(self.cfg, "E001", live=True)   # config live false + tiktok disabled
        self.assertTrue(out["dry_run"])
        self.assertEqual(out["would_send"]["post_info"]["title"], "tt E001")


if __name__ == "__main__":
    unittest.main()
