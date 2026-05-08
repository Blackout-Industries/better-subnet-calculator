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

## Pull requests

1. Fork the repository or create a feature branch.
2. Make focused changes &mdash; one fix or feature per PR.
3. Run `make test` and `make build` locally.
4. Open a PR against `main`. Describe what changed and why.
5. The CI workflow runs the test suite and a production build. The publish
   workflow runs only on push to `main` and on tags.

## Releases

Tag a commit on `main` with `vX.Y.Z`:

```sh
git tag v0.2.0
git push origin v0.2.0
```

The publish workflow builds a multi-arch image (`linux/amd64`, `linux/arm64`)
and pushes it to `ghcr.io/blackout-industries/better-subnet-calculator` with
tags for the version, the major.minor, the major, and `latest` (when the tag
is on `main`).

## Reporting issues

Open an issue at
<https://github.com/Blackout-Industries/better-subnet-calculator/issues>.
Include:

- Browser and version.
- The CIDR you started with and the divide/join sequence that reproduces it.
- Whether `make test` passes locally.
