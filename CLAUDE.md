This is the listening derivative. Read README.md and DERIVATIVE_HANDOFF.md. Preserve dedicated Firebase settings and listening-first UI. Every PR must explicitly state listening delivery decision, reason, affected files, and actual handoff status. Do not claim delivery to another room without evidence.

**Before reading code, open `docs/code_guide/codemap.md`** (one line per file: path, role, lines, how many files import it). Use it to pick the 2–5 files you need, then open only those. Take paths from this text file, not from the map images (`docs/code_guide/maps/*.png`): in a measured test an image-reading AI turned 2.3% of file names into names that do not exist (`docs/code_guide/research.md` 7.4). The map summarises roles; always confirm details in the source file. After refactoring, run `bash docs/code_guide/tools/update.sh` to refresh it.

## UI principles (decided with the user, 2026-09-30) — follow these whenever you design or change a screen
1. **One screen, no scrolling.** A learner should finish the task on a screen without scrolling as far as possible (home, review note, question, explanation, battle). Put details behind "tap to expand" (accordion / details / modal) instead of stacking them vertically.
2. **No duplicates.** Do not show the same control twice on one screen (e.g. a second play button under the main player, a repeated title, the same explanation twice).
3. **Keep the home look.** The home screen's colour balance (cream paper, gold coin card, pastel side buttons, light-blue round battle button) is the reference. Other screens (battle, review note, lists) match its feel; do not recolour the home.
4. **Legibility.** Text ≥ 12px, tap targets ≥ 44px, AA contrast. Tokens live in `src/styles/tokens.css`.
5. **Verify** at 320×568, 375×667, 390×844 and 1280×800: no document scroll, no text < 12px, no overlapping buttons.

## Promo videos (Instagram / YouTube)
When asked to make an advertising / announcement video, **read `store-assets/VIDEO_PLAYBOOK.md` first**. Everything is in the repo: the editing engine (`store-assets/_tools/promo_engine.py`), recorders, measuring tools, the raw screen recordings (`store-assets/_footage/`, Git LFS — run `bash store-assets/_tools/setup.sh`), BGM rules and credits. Use real app recordings only (no AI-generated video), never claim guaranteed results, and keep the BGM credit (創作堂さくら紅葉 https://yukizakura.net/) in captions.
