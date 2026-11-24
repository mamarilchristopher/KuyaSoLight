# Kuya SoLight auto-publisher

Posts each owner-approved episode, in order, as a Facebook Reel on the SoLight
Solar PH Page, a YouTube Short, and a TikTok video, each with its own caption from
`E0xx/post/` (`E0xx-facebook.txt`, `E0xx-youtube-shorts.txt`, `E0xx-tiktok.txt`).

```
python3 publisher/publisher.py status          # every episode: approved, ready, where posted
python3 publisher/publisher.py plan            # what is due now, with the exact calls (dry run)
python3 publisher/publisher.py tiktok E001     # TikTok request it would send (dry run)
cd publisher && python3 -m unittest test_publisher
```

## Safety gates (all must pass)

1. `config.json` → `"live": true`. Ships as `false`. Owner turns it on.
2. `ownerApproval.status == "approved"` in the studio's `episodes/E0xx/episode.json`.
3. QA report PASS (a report made before approval may fail only on OWNER-APPROVAL).
4. Exactly one 9:16 video (3 to 90 s, 24 to 60 fps) plus all three captions in `post/`.
5. In order: an episode that isn't ready holds back every later one.
6. One episode per schedule slot; it finishes on every platform before the next starts.
7. Ledger (`/mnt/project-files/kuya-solight/publisher/ledger.json`) blocks any repost.
8. If the video file changes after posting began, it stops until the owner re-approves.

## How each platform posts

| Platform | Route | Needs |
|---|---|---|
| Facebook Reel | Windsor.ai `facebook_organic` → `create_reel` | Page connected (done), public video URL |
| YouTube Short | Windsor.ai `youtube` → `upload_video` (category Education, not for kids, public) | YouTube connected in Windsor, public video URL |
| TikTok | TikTok Content Posting API, Direct Post with file upload | TikTok developer app + access token; posts are private until TikTok audits the app |

Public video URL: Facebook and YouTube download the video from a link. The repo is
public, so once the Claude GitHub App can push to it, approved videos go under
`media/` and `media_url_template` points at their raw GitHub links.

The schedule lives in `config.json` (`schedule`); `ROUTINE.md` is what the
scheduled cloud routine follows.
