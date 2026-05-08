# better-subnet-calculator

[![Build and publish](https://github.com/Blackout-Industries/better-subnet-calculator/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/Blackout-Industries/better-subnet-calculator/actions/workflows/docker-publish.yml)
[![CodeQL](https://github.com/Blackout-Industries/better-subnet-calculator/actions/workflows/codeql.yml/badge.svg)](https://github.com/Blackout-Industries/better-subnet-calculator/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Blackout-Industries/better-subnet-calculator/badge)](https://scorecard.dev/viewer/?uri=github.com/Blackout-Industries/better-subnet-calculator)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A self-hosted, fully client-side IPv4 subnet calculator. Inspired by
[davidc.net's Visual Subnet Calculator](https://www.davidc.net/sites/default/subnets/subnets.html),
rewritten with a modern UI, dark mode, a tree view, multi-tab workspaces, and
JSON import/export.

Runs entirely in your browser. The container is a static nginx image &mdash;
no backend, no telemetry, no network calls.

**Demo:** <https://blackout-industries.github.io/better-subnet-calculator/>

## Features

- Divide and join subnets interactively.
- Two layouts &mdash; classic rowspan table or an indented tree.
- Multi-tab workspaces with rename, close, and `Ctrl/Cmd + 1-9` switching.
- JSON import and export of the entire workspace.
- Per-subnet notes.
- Dark mode by default; theme persists in localStorage.
- Bookmarkable URLs &mdash; the active tab's tree is encoded in the URL hash.
- Single 50&nbsp;KB gzipped JS bundle, served by nginx.

## Run with Docker

Pull the published image:

```sh
docker run -d --name subnet-calculator -p 8080:80 \
  ghcr.io/blackout-industries/better-subnet-calculator:latest
```

Open <http://localhost:8080>.

Or with compose, from a clone of this repository:

```sh
docker compose up -d --build app
```

Stop:

```sh
docker compose down
```

## Develop

The project requires no host toolchain. Vite, Node, and npm all run inside
containers.

```sh
make dev      # vite dev server with HMR on http://localhost:5173
make test     # one-shot vitest
make build    # production image
make up       # production at http://localhost:8080
make lockfile # regenerate package-lock.json without installing on the host
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Keyboard shortcuts

| Key                | Action                    |
| ------------------ | ------------------------- |
| `t`                | Toggle table / tree view  |
| `d`                | Toggle dark / light theme |
| `Ctrl/Cmd + 1-9`   | Switch between tabs       |
| Double-click a tab | Rename it                 |

## Layout

```text
src/
  lib/
    subnet.ts        IPv4 math and immutable tree operations
    subnet.test.ts   vitest cases
    urlState.ts      hash <-> tree encoding
    workspace.ts     tabs, persistence, import/export
  components/
    InputBar.tsx
    Toolbar.tsx
    TableView.tsx    rowspan layout
    TreeView.tsx     indented tree layout
    TabBar.tsx
    SubnetCells.tsx  shared column definitions
  App.tsx
  main.tsx
index.html
Dockerfile           multi-stage: deps, dev, test, build, runtime
docker-compose.yml
nginx.conf
```

## License

MIT. See [LICENSE](LICENSE).
