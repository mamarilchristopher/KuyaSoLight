# Scheduled posting routine

A Claude cloud routine runs this at every posting slot (default Mon, Wed, Fri at
7:00 PM Manila). It is the only thing that posts. It does nothing unless
`config.json` has `"live": true`, which only the owner (CHRIS) may turn on.

## What the routine does each run

1. Get the code and the latest approvals:
   `unzip -o /mnt/project-files/kuya-solight/kuya-solight-studio-source.zip -d /home/claude/kuya-solight-studio`
   or, preferably, check out the studio branch `claude/project-thread-4y29lq` of
   this repo into `/home/claude/kuya-solight-studio` (approvals live in
   `episodes/E0xx/episode.json`).
2. Make sure the next episode's approved video is hosted: if
   `media/E00x/<file>` is missing for the episode the plan names, copy it from
   `E00x/post/`, commit and push (Facebook and YouTube download it from
   `media_url_template`). Check the raw link returns the same sha256 as the plan.
3. `python3 publisher/publisher.py plan` and read the JSON.
   * `ready` false: post nothing. If `blockers` names something the owner must
     do (approval, a missing file, a sign-in), tell them once in the project thread.
   * `ready` true: for each action whose own `blockers` list is empty, in order
     Facebook, YouTube, TikTok:
     * `via: windsor`: call Windsor.ai `execute_action` with exactly the
       `connector`, `account`, `action` and `params` given. Do not edit captions.
     * `via: owner` (TikTok, owner posts it): post one message in the project
       thread with the video attached (`package.video_path`) and the TikTok
       caption in a code block, ready to paste. Then record it with
       `--id handed-off`. It never holds back the next episode.
     * `via: cli`: run the `command` (only if TikTok is later switched to
       automatic; needs `TIKTOK_ACCESS_TOKEN`).
     * Right after each success, save it:
       `python3 publisher/publisher.py record E00x <platform> --id <post id> --url <url> --video-sha256 <plan.video.sha256>`
       If a call fails, do not retry it in the same run and do not record it.
4. Post a short note in the project thread: episode, links per platform, anything
   that failed. Facebook has no pinned-comment action yet, so include the plan's
   `pinned_comment` text for the owner to paste.

## Rules that never bend

* Never post an episode the plan did not return, and never pass `--ignore-schedule`.
* Never post the same episode to the same platform twice (the ledger refuses it;
  don't work around it).
* Never change `live`, `start_from_episode` or approvals. Only the owner does.
* If the plan says the video changed after posting began, stop and ask the owner.
