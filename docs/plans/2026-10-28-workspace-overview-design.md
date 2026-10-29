# Workspace shell and overview design - 28 October 2026

Authorized UI-first slice of the continuous-improvement plan. Implement inline with existing React/Radix/Lucide and CSS Modules; preserve all unrelated hosted-chat edits and shared globals. The owner explicitly rejected the paid design MCP; its project configuration is removed. Use Superpowers and existing free components. UI/UX Pro Max is optional only as a verified design reference, without a global install or runtime dependency.

## Design

A dark ink navigation rail with visible AgencyDesk identity, a light violet workspace canvas, clear grouped navigation, a restrained status treatment and responsive header. The overview uses a distinct introductory panel, four honest total cards, a pending-task worklist, bounded pipeline preview and active-project cards. Use semantic links and existing routes; no fake charts, trend percentages, team avatars or metrics. Both live and demo share the same presentation. Demo remains explicitly fictional/read-only; live totals stay supplied by the existing metrics RPC.

## Acceptance and execution

1. Add failing preview tests: closed/archived exclusion, inactive-only projects, open task due ordering without mutation, empty data and list bounds. Implement pure preview derivation without changing all-record totals.
2. Add failing browser acceptance for new overview sections at390/1440px. Preserve pipeline search and no demo mutations; retain mobile Radix focus/escape/route behavior.
3. Change only shared shell, extracted dashboard, scoped styles and a preview helper. Preserve client role navigation, sign-out action, auth/RLS, server queries and existing fixtures. Partial loaded lists are labeled, never described as a complete work queue.
4. Run targeted tests, full unit suite, lint/types and build. Browser-check keyboard, overflow, accessibility, short mobile/desktop navigation reachability and screenshots. Probe shared demo pages; use fictional configuration only, never real providers. Record which checks actually run.
5. Independent security/final reviewer, redacted staged scan and exact staged allowlist. Publish a separate UI PR stacked on the setup feature while PR1 remains unmerged. No production change or merge.

## Rollback and limits

Revert this UI slice. Existing globals, data sources and actions remain available. Live authenticated visual evidence requires verified account binding and is not substituted by demo screenshots. Full inbox/booking/queue/model work stays out of scope.
