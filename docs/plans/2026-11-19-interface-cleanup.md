# AgencyDesk interface cleanup

The owner approved using Shadcn Admin's workspace patterns with the Charles design and UX reviews. The direction is calm, legible and task-focused. Staff should find leads, tasks and proposals quickly. Public visitors should see the services, understand delivery and reach the inquiry form.

The previous design repeated uppercase slogans, used blue across navigation and decoration, nested too many bordered surfaces and made supporting text too small. This pass replaces the public page composition, removes redundant labels from the dashboard and sidebar, simplifies service presentation, and uses neutral surfaces and sentence-case navigation. Status colors retain their meaning.

## References

- [Shadcn Admin by Sat Naing](https://github.com/satnaing/shadcn-admin), MIT. Used as a reference for grouped navigation, action placement and readable data rows. Existing AgencyDesk components implement the layout.
- [Charles Unslop](https://github.com/LemonFace0309/charles-skills/tree/main/skills/design/charles-unslop), CC BY 4.0, adapted by Charles Liu from Damir Sokolovsky's Unslop and Emil Kowalski's guidance. Applied its subtraction, spacing and hierarchy review.
- [Charles UX & Animation](https://github.com/LemonFace0309/charles-skills/tree/main/skills/drops/charles-ux-animation). Applied keyboard, touch-target, feedback and reduced-motion guidance.

## Acceptance

Public inquiry navigation, service links, workflow scroll and disclosure controls work on mobile and desktop. The interactive illustration retains its controls and reduced-motion fallback. Staff navigation, lead filters and detail links remain reachable. Existing authoritative metrics and empty states remain accurate. Verify page fit and contrast on public and demo routes, capture representative screenshots and run the existing CI suite.

No dependency, migration or provider configuration is needed. Rollback is a revert of this presentation slice through preview.
