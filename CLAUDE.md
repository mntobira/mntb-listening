This is the listening derivative. Read README.md and DERIVATIVE_HANDOFF.md. Preserve dedicated Firebase settings and listening-first UI. Every PR must explicitly state listening delivery decision, reason, affected files, and actual handoff status. Do not claim delivery to another room without evidence.

## UI principles (decided with the user, 2026-09-30) — follow these whenever you design or change a screen
1. **One screen, no scrolling.** A learner should finish the task on a screen without scrolling as far as possible (home, review note, question, explanation, battle). Put details behind "tap to expand" (accordion / details / modal) instead of stacking them vertically.
2. **No duplicates.** Do not show the same control twice on one screen (e.g. a second play button under the main player, a repeated title, the same explanation twice).
3. **Keep the home look.** The home screen's colour balance (cream paper, gold coin card, pastel side buttons, light-blue round battle button) is the reference. Other screens (battle, review note, lists) match its feel; do not recolour the home.
4. **Legibility.** Text ≥ 12px, tap targets ≥ 44px, AA contrast. Tokens live in `src/styles/tokens.css`.
5. **Verify** at 320×568, 375×667, 390×844 and 1280×800: no document scroll, no text < 12px, no overlapping buttons.
