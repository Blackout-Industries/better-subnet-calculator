# Contributing

Thanks for considering a contribution. The project is small and the workflow
is intentionally minimal &mdash; no host toolchain required, only Docker.

## Quick start

```sh
gh repo clone Blackout-Industries/better-subnet-calculator
cd better-subnet-calculator
make dev    # http://localhost:5173 with HMR
```

## Local commands

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `make dev`      | Vite dev server (Docker) at <http://localhost:5173>   |
| `make test`     | Run vitest in a one-shot container                    |
| `make build`    | Build the production image                            |
| `make up`       | Run the production image at <http://localhost:8080>   |
| `make down`     | Stop the production container                         |
| `make lockfile` | Regenerate `package-lock.json` without host npm       |
| `make clean`    | Remove the local container and its images             |

Do not run `npm install` or `node` directly on the host. Everything builds
and tests inside Docker so the project stays reproducible.

## Code style

- TypeScript strict mode is on. No `any`, no unused locals.
- Pure functions over `Subnet` live in [src/lib/subnet.ts](src/lib/subnet.ts).
  Keep them pure so they remain trivially testable.
- React components stay presentational; state ops go through `workspace.ts`.
- Default to no comments. Only add a comment when the *why* is non-obvious
  (a spec reference, a workaround, a hidden invariant).
- No trailing whitespace, two-space indent, double-quoted strings.

## Tests

All math and tree operations should have a vitest case in
[src/lib/subnet.test.ts](src/lib/subnet.test.ts). Run:

```sh
make test
```

CI runs the same command on every push and pull request. Pull requests must
be green before merging.

## Branching and pull requests

Trunk-based development. `main` is always releasable.

1. Branch from `main` with the prefix `feature/`:

   ```sh
   git switch -c feature/short-description main
   ```

2. Make focused changes &mdash; one fix or feature per PR.
3. Run `make test` and `make build` locally.
4. Open a PR from `feature/*` into `main`. Describe what changed and why.
5. The pipeline runs the `test` job on every PR (vitest + amd64 build, no
   push). The `publish` job only runs after a merge to `main`.

Direct pushes to `main` are blocked by branch protection. All changes flow
through PRs.

## Versioning and releases

Versions are derived automatically from git history by
[GitVersion](https://gitversion.net/). Configuration lives in
[GitVersion.yml](GitVersion.yml).

- Each merge to `main` increments the patch version by default.
- To bump minor or major, include `+semver: minor` or `+semver: major` in the
  commit message.
- After publishing, the workflow tags the commit on GitHub with `vX.Y.Z`.

The published image at
`ghcr.io/blackout-industries/better-subnet-calculator` is tagged with:

- `X.Y.Z` &mdash; the exact version
- `X.Y` &mdash; the latest patch in this minor line
- `X` &mdash; the latest minor in this major line
- `latest` &mdash; the most recent main build

## Reporting issues

Open an issue at
<https://github.com/Blackout-Industries/better-subnet-calculator/issues>.
Include:

- Browser and version.
- The CIDR you started with and the divide/join sequence that reproduces it.
- Whether `make test` passes locally.
