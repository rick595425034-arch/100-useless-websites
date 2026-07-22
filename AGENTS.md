# Repository instructions

This is the canonical monorepo for the “挑战 100 个整活网站” series.

- Put every new creation in `projects/NNN-kebab-case`, using the next consecutive three-digit id.
- Keep every project independently installable, runnable, testable, and packageable. Do not add cross-project runtime imports.
- Update `catalog.json`, the progress count, and the root README table whenever adding or removing a project.
- Preserve each project's reveal structure: the entry screen must not spoil the final joke.
- Optimize important Chinese copy for 10–30 second screen recordings; critical text must remain legible at 1080p.
- Do not commit dependencies, generated builds, DMGs, screenshots, recordings, native binaries, environment files, credentials, or personal data.
- Run the root catalog tests and the changed project's own tests before committing.
- Existing standalone repositories and deployments are mirrors or historical releases; do not delete or rewrite them unless explicitly requested.
