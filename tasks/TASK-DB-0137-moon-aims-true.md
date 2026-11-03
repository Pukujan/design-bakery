# TASK-DB-0137: the moon aims at where the card really is

## Problem
On a guided journey the moon pressed the wrong place. After the page changed and the slow swipe scrolled the list, the card the moon was heading for sat a few pixels under the top edge (scroll puts it at the top), so `visibleLinkFor` judged it "not fully on screen" and the cursor just rested mid-page and pressed there; the card also kept moving for a moment after the scroll.

## Done
- `agentCursor.ts`: `settle()` waits until the target link has stopped moving before aiming; `follow()` keeps the cursor on the link while it glides and presses, so a late layout shift cannot leave it behind; `aimPoint()` aims at the middle of the part of a link that is on screen (cards taller than the window count as on screen); `visibleLinkFor` uses that point.
- `store.ts` `journey()`: the slow scroll now lands the card in the middle of the screen (just under the header when it is taller than the window), waits for the page to settle, and treats the card as in view when its middle is on screen.

## Evidence
A headless-browser run of a journey from /research to the oldest post (id 1, deep in the list) with the moon on a call: before, the moon was 330 to 390 px from the card at press time (the link top was at -4 px); after, 8 px, on a 1280 px window and on a 390 px phone window. tsc and eslint pass.
