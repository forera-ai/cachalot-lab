# Dive interface refinement

## 0.7.1 layout — 2026-10-09

Profiles and collapsed model discovery share the left rail; selected-profile details and actions use the remaining width. The overview fits the normal native window; the minimum 1100 × 720 layout is checked in browser preview. Basic launch fields use three columns where space permits; response/snapshot defaults and family tuning expand on demand. Values remain in the draft when groups close, and explicit output-changing GLM budget intent remains visible outside tuning. Discovery and runtime output expand explicitly; their long content may scroll. The native app minimum remains 1100 × 720; one-column browser fallback begins below 800 pixels. No storage, process ownership, launch defaults or inference policy changes.

The source review is Cachalot 0.62.22 (`5faababa6bc098400147611d3ffd11cd00e3100d`), including brief 0.62.20. GLM’s shell script now selects budget 2; Lab’s direct CLI empty budget remains off. This layout ships in Lab 0.7.1. Historical 0.5.0 refinement and verification follow.

## Historical 0.5.0 refinement

The owner requested a complete refinement of Dive after reviewing screenshots with a vertically displaced Delete link and preview content touching the action row. This local pass preserves the existing Lab visual language and runtime/profile contracts.

- Controls share a 40-pixel minimum height and 10-pixel action gaps. Delete profile uses the theme error color, a visible border/icon, and separation from launch/edit/preview actions. An inline confirmation explains exactly what is removed and provides Keep profile.
- The selected profile has a state badge, readable wrapping paths, consistent fact spacing, and a clearly separated preview section with executable, arguments, environment overrides, and endpoint. Preview is dismissible; long blocks scroll within bounds. Arguments remain individual JSON-quoted values rather than an executable shell string.
- Discovery has an adjacent scan button on wider windows and a stacked layout on narrow windows. Results keep model details separate from a compact Create profile action. Forms align fields at their top edges, improve label/control spacing, and separate launch settings from runtime tuning.
- Layout moves to one column below 1,000 pixels, and field/discovery layouts stack below 780 pixels. Focus indicators and existing reduced-motion/Silent running behavior remain in place. Recent runtime output is collapsed by default, with a clear disclosure.
- A profile cannot control another profile's runtime: Stop belongs only to the selected owner; Start is blocked while another profile runs. Changing selection discards pending preview results.

45 frontend tests pass, including new delete-confirmation/cancellation, preview dismissal/content, cross-profile ownership, and asynchronous preview-switch tests. Native inspection of the signed installed app covered overview/actions, preview show/hide and code containment, delete confirmation and Keep profile, profile-editor spacing, discovery result rows, and runtime-output expand/collapse in the standard 1380 × 860 window. Both Abyss and Surface were inspected; System appearance and Silent running Off were restored. No profile was saved/deleted and no runtime was launched/stopped. Smaller breakpoint rules were source-reviewed; native resizing below the window minimum of 1,100 pixels was not tested. Surface primary actions now use white text for contrast.

Runtime briefs still end at 0.60.0. The reviewed checkout remains runtime 0.60.1, commit `9d11bc061dcb434c40494be3d507521194d376dc`, with no new Lab contract. This interface ships in Lab 0.5.0.

Final local installation: all four bundle files match the fresh Developer ID signed build; strict signature checks pass. Executable SHA-256 `7b6c6208032d2cb3748699829f01e0ca9cf38e58b7bcc19481eb99698f33a5fe`. Original pre-design installation is preserved at `.release/local-dive-design-2026-10-05/previous-Cachalot Studio.app`, with hashes in `installation.json`. Local version remains 0.4.0; no notarization or publication.

Release note: the development-build hashes and version descriptions above are historical pre-release evidence. Lab 0.5.0 ships the combined changes; its exact source, signed/notarized artifacts, and final verification are recorded in the GitHub Release verification report. Outstanding validation limits above still apply.
