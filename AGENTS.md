<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All Sun/Earth geometry comes from `src/lib/geometry.ts` (astronomy-engine + IAU Moon frame); UI never fabricates or estimates values — show "unavailable" instead. Why: scientific transparency is a core requirement.
- Site/mission facts live only in `src/data/sites.ts` (zod-validated); shared app state (site, UTC time, comparison, scenarios) lives in `src/lib/store.tsx` with localStorage. Why: one source of truth across pages.
