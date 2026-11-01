# Public card spacing repair

Approved scope: reproduce the owner's service/sample-project screenshot defects; fix the existing emerald design rather than replace it. Existing main/preview tips are merged into this isolated feature branch. No root WIP, data, schema, provider or delivery changes.

Root cause hypothesis: broad theme selectors paint divider rows as cards without inner padding. Service action rows sit outside the article; the final CTA is also accidentally painted. Existing project rows have vertical-only padding. Fixed guide trigger can cover content.

Implementation: explicit service/project card classes and scope cards; responsive 32px desktop/20px phone insets, 16-24px internal/section gaps, readable type/line lengths, wrapped links/buttons, no fixed heights/hidden overflow. Preserve content, sample labels and destinations. On these catalog pages only, keep the services-guide trigger in normal footer flow; leave the homepage/guide modal untouched.

Acceptance: reproduce computed inset failures on current source first; verify all catalog cards on /services, /services/business-websites and /case-studies at390/1280/1440px; no page/card clipping, inset>=20pxphone/24pxdesktop, wrapped/reachable CTAs, existing service/inquiry links and short-height guide/focus restoration. Take actual before/after desktop/mobile screenshots. No new sample records or metrics.

Run relevant unit/render, scoped lint/types/production build and serialized browser checks on this exact checkout. Independent read-only security/final review, exact staged allowlist and redacted scans before Justin-only commit/push/PR into preview. Inspect actual remote Actions/Netlify; draft for red/missing checks. Owner controls merge/production. No costs/config/migrations; rollback by feature revert. Keep unrelated CI workflow fix separate.

Design ruling: the services index uses a two-column desktop catalog, sample projects use three equal desktop cards, both stack below900px. Natural heights and wrapped text replace empty edge-flush strips; no clipping or fixed-height placeholders. Detailed scope cards remain one column.
