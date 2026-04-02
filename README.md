# Launchpad

A monorepo of independent web apps. Each app deploys to Netlify on its own.

## Apps

| App | Description | Live URL |
|-----|-------------|----------|
| [swipecart](./swipecart/) | Board game discovery with swipe-based voting | [swipecart.netlify.app](https://swipecart.netlify.app) |

## Shared Standards

See [CLAUDE.md](./CLAUDE.md) for the quality checklist all apps follow.

## Adding a New App

1. Create a new directory at the repo root (e.g. `myapp/`)
2. Scaffold with `npx create-next-app@latest myapp`
3. Add a `netlify.toml` inside the app directory
4. In Netlify, create a new site linked to this repo with **Base directory** set to the app folder name
5. Follow the standards in CLAUDE.md
6. Add your app to the **Apps** table above
