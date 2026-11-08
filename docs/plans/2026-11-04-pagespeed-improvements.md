# PageSpeed improvements - 4 November 2026

## Baseline and scope

Lighthouse 13.6.0 against the public production homepage, using Chrome 156 and standard simulated mobile/desktop profiles, measured:

| Baseline | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Mobile | 73 | 100 | 100 | 100 |
| Desktop | 87 | 100 | 100 | 100 |

These are local Lighthouse audits **against the live URL**, not Google-hosted PageSpeed Insights results or real-user Core Web Vitals. The public PageSpeed API returned 429; no key or paid service was added. Scores vary with the environment. Green means 90 or higher; 100 remains a target, not a guarantee.

The mobile report attributes about 2.3 seconds of CPU time to the 551,463-byte uncompressed Three/scene chunk; total blocking time was 650 ms and Speed Index was 10.0 s. The engine initialized immediately after hydration even though its phone controls were below the first viewport. The page also preloaded an unused 23 KB monospaced font. The public document was already CDN cached; its canonical URL and the other three categories passed. Private cache/auth behavior therefore stays unchanged.

## Implementation and trade-offs

- `world-startup.ts` waits for document load, a visible short world label, and an idle opportunity (bounded at one second, with a timer fallback). Readable content and working links take priority over decorative WebGL. Observing a short marker avoids an unreachable intersection threshold on very short screens.
- `diorama-world-view.tsx` cancels deferred initialization on teardown and remembers activation when returning to the tab. The CSS world remains server-rendered. Visible desktop scenes and scrolled phone scenes enhance automatically. There is no user-agent or audit-specific branch. The deliberate trade-off is that an offscreen phone world loads when its controls enter view.
- `diorama-world.ts` prepares shaders with `compileAsync` before first rendering. The fallback stays visible while preparation finishes; completion cannot resurrect a disposed world. Pause/layer changes are retained, and compilation rejection or first-render failure releases resources.
- `layout.tsx` disables Geist Mono preloading while retaining its font definition. Sans typography is unchanged.
- Unit/lifetime regressions cover scheduling, cancellation, repeated callbacks, unsupported APIs, tiny intersections, shader failure, pause-before-ready and disposal-before-ready. Browser regressions cover a real 390x844 phone transition and a 1440x180 viewport.

No app dependency, provider, credential, database migration, runtime or backend capability was added. Existing auth/RLS, guide, inquiry and reduced-motion/no-JS/no-WebGL behavior remain.

## Actual local verification

Both working source and the credential-free optimized snapshot passed 221 unit tests across 29 files plus 22 n8n runtime guards. New shader behavior first reproduced three failing regressions, then passed; the final startup/lifetime suites contain 13 passing cases. Full final lint exited 0. Baseline and optimized production Webpack builds exited 0, including TypeScript, static generation and tracing.

The snapshot began as an archive of main at ea5ed97, overlaid with exactly the seven scoped source/test files. Application source bytes match the staged version. Test-file line endings were subsequently normalized without changing behavior. No real env/auth files were loaded into the snapshot.

Independent read-only source/security review caught and resolved a temporary UTF-8 roundtrip issue and an unreachable 40% visibility threshold. Final scoped source, tests and proposed PR-text reviews found no remaining blocker. Routine review never read private stores or credential values.

Automatic approval review rejected background and foreground local test-server launches with only "blocked by policy"; no alternative launch bypass was used. The hosted PR preview is the remaining browser/performance verification surface. Keep the PR draft until actual required checks and hosted checks complete. The PR records the current pushed-SHA results, scans and screenshots. Production scores cannot change until the owner merges and the main deployment finishes.

## Sources, cost and rollback

- [Lighthouse scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/).
- [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading); installed 16.3.8 documentation was inspected before changes.
- [Three WebGLRenderer.compileAsync](https://threejs.org/docs/pages/WebGLRenderer.html#compileAsync).
- [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).

No upstream component/source was copied; existing dependency licenses remain. Lighthouse is a pinned project-private audit tool, not an application dependency. No new costs are enabled. Roll back by reverting this scoped change through preview-to-main review; no data migration or credential rollback is needed. The owner retains merging and production control.
