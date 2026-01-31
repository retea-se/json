# Repo Policy (JSON Toolbox)
- Status: Active (static web tool)
- Branches: main (default)
- Releases: manual tag + upload/dist sync (ingen CI/CD)
- Deploy: manual rsync/upload to mackan.eu/tools/json
- Secrets: inga; ingen serverkod
- Testing: inga automatiska tester; manuell smoke i browser
- Contribution: PRs välkomna; ingen auto-lint krävs men följ kodstil i modules/
- Ownership: workspace maintainer (solo)

## AI / Automation Guardrails
- Inga AI-genererade commits utan manuell review och explicit PR‑beskrivning av vad som genererats.
- Lägg alltid till `Co-authored-by: AI` i commit‑trail om AI‑output används.
- Ingen AI får föreslå eller införa externa CDN:er/bibliotek utan att motivera säkerhet och licens.
- Ingen insamling/loggning av PII; verktyget förblir zero‑telemetry. AI‑förslag som ändrar det ska avvisas.
- Ingen förändring av CSP/säkerhetsrubriker utan manuell genomgång.
- All kod ska hållas offline-kapabel; AI‑förslag som kräver nätverk i runtime ska avvisas.
