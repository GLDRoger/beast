# Mail-client matrix

Loaded from `SKILL.md` coverage step 4 when the app under test reads or sends email.

For mail apps, cover both provider-specific and generic behavior.

## Safe browser checks

- inbox/drafts/sent/archive/folders/labels load states
- search query and URL state
- unread/read filter
- selected thread persistence
- thread open/close/back/next
- sender details/contact popover
- attachments visible but do not download unless safe
- reply/forward/compose modal opens
- empty send validation
- schedule-send modal opens and validates fields
- overflow menus show provider-correct labels (`Open in Gmail`, `Open in Outlook`, or generic fallback)
- bulk selection UI and disabled states
- archive/block/unsubscribe controls are identified but not executed on real data

## Seeded-test-only mutation checks

Run only with seeded test Gmail/Outlook accounts:

- compose new email -> save draft -> discard -> send test email
- reply -> discard -> send
- forward -> discard -> send
- schedule send -> cancel -> reschedule
- archive -> undo/recover -> verify provider state
- delete/trash/spam -> recover where supported
- block sender -> unblock/recover
- unsubscribe -> confirm result/failure/undo
- rule create/edit/delete/reorder/test
- process past emails with confirmation/progress/cancel/undo
