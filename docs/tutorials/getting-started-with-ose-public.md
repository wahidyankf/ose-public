---
title: Getting Started with OSE Public
description: Run the Open Sharia Enterprise public website locally from a supported development environment
category: tutorial
tags:
  - onboarding
  - ose-www
  - development
  - volta
created: 2026-08-07
---

# Getting Started with OSE Public

In this tutorial, you will run the OSE public website on your computer. When you finish, the home
page will be available at <http://localhost:3100> and will show the **Open Sharia Enterprise
Platform** heading. Port 3100 is a default rather than a fixed address — if you have set
`OSE_WWW_PORT`, the site listens on that port instead.

This repository is the public upstream for Open Sharia Enterprise. It is pre-alpha, so interfaces
and architecture can change as the platform takes shape.

## Choose a supported environment

The onboarding path is verified on macOS and Ubuntu Linux. WSL2 may work, but it is neither
supported nor verified by this project; use one of the supported environments when you need a
dependable path.

You need a terminal, an internet connection, and permission to install development tools. The
commands below use the shell provided by macOS or Ubuntu.

### macOS

Git is supplied by Xcode Command Line Tools. If this command cannot find Git, start the Apple
installer, complete it, then return to this tutorial:

```bash
git --version || xcode-select --install
```

### Ubuntu

Install the command-line build tools, Git, and curl:

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl git
```

## Install the required runtimes

The repository pins its Node.js and npm versions in `package.json`; Volta reads those pins when
you enter the cloned repository. The repository tool checker is an F#/.NET application, so the
.NET SDK must also be available before its checks can run.

Install Volta on either supported operating system:

```bash
curl https://get.volta.sh | bash
```

Install the .NET SDK with Homebrew on macOS, or follow Microsoft's package instructions on Ubuntu:

```bash
# macOS
brew install dotnet
```

Close and reopen the terminal so the installers can update its command path. Confirm the tools are
available before continuing:

```bash
git --version
volta --version
dotnet --version
```

Each command should print a version. If `volta` or `dotnet` is still not found, reopen the terminal
once more and follow the recovery guidance below.

## Clone and prepare OSE

Clone the public repository and enter it:

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd ose-public
```

Now install the workspace dependencies through the pinned HIPPO consumer. Volta selects the Node.js
and npm versions declared by this checkout; the guarded install also installs the repository's Git
hooks.

```bash
node --version
npm --version
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
```

The first two commands print versions matching the `volta` values in this checkout's
`package.json`. The installation can take a while and ends after npm has installed the workspace
dependencies.

Run the read-only tool check:

```bash
npm run doctor
```

The check probes every toolchain the repository declares and installs nothing. This website path
needs only Git, Volta, Node.js, and npm, so a report that names only other toolchains, such as
Docker, Go, or Java, does not block this tutorial.

## Run the public website

This repository is an [Nx](https://nx.dev/) monorepo — one repository holding several
independently deployable applications, with Nx coordinating the tasks that build and run them.
Start its development target for `ose-www`:

```bash
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:dev
```

Nx starts Next.js on the resolved port — 3100 unless `OSE_WWW_PORT` says otherwise — and keeps the
terminal occupied while the server runs. Next.js prints the address it chose as its `Local:` line;
open that address in a browser. You have succeeded when the page shows **Open Sharia
Enterprise Platform** and the product description beginning “Open-source (MIT) platform for
Sharia-compliant enterprise solutions.”

When you are finished, return to the terminal running the server and press <kbd>Ctrl</kbd>+<kbd>C</kbd>.

## Recover from common setup problems

### `volta` or `dotnet` is not found

The installer has not yet updated the current shell. Close and reopen the terminal, then rerun the
matching version command. If it is still missing, rerun the relevant installer from
[Install the required runtimes](#install-the-required-runtimes), reopen the terminal, and try again.

### The tool check reports Docker as missing

Docker is not needed to run `ose-www`, so you can continue with this tutorial. Other repository
targets may require it. When you need one, install Docker Desktop on macOS or Docker Engine on
Ubuntu, then confirm the check finds it:

```bash
npm run doctor
```

For the complete, multi-language environment and Docker guidance, see
[Set Up Your Development Environment](../how-to/setup-development-environment.md).

### Port 3100 is already in use

Another local server is using the website's default port. If it is an earlier OSE development
server, stop it with <kbd>Ctrl</kbd>+<kbd>C</kbd> in its terminal, then rerun the development command.
Do not stop an unfamiliar process just to free the port.

When the port is held by something you do not recognize, move the website instead of the other
process. The development target reads `OSE_WWW_PORT` and falls back to 3100 only when that variable
is unset:

```bash
OSE_WWW_PORT=4000 ./hippo run --class service --resource-tier standard --disk-path . -- \
  npm exec nx -- run ose-www:dev
```

Open <http://localhost:4000> instead. A value that is not a usable port number stops startup and
names the variable, rather than quietly reverting to 3100. Every app that serves a port takes the same
override, under its own variable name — see
[Overriding a port](../reference/web-sites.md#overriding-a-port).

### A generated artifact is missing or stale

Regenerate the website build through its declared Nx target, then start development again:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:build
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:dev
```

The build target regenerates its search data before creating the local Next.js output.

## Choose your next step

You now have a working public-site development loop. To understand the product direction, read the
[roadmap](../../roadmap.md). To explore this website's architecture and available development
targets, continue with the [ose-www README](../../apps/ose-www/README.md).
