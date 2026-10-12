# Publish a new release

How to ship a new version of `socialcalc-ai` to **npm** and **GitHub Packages**.

| Registry | Package name | Published by |
| :--- | :--- | :--- |
| npm | `socialcalc-ai` | The `npm` job in [`publish.yml`](../.github/workflows/publish.yml), using the `NPM_TOKEN` secret |
| GitHub Packages | `@aspiringsdgs/socialcalc-ai` | The `github-packages` job, using the built-in `GITHUB_TOKEN` |

Only the `socialcalc/` folder is published. The demo app, the documentation website (`docs-site/`) and the `Socialcalc-MCP/` copy are not part of the package. The MCP server is released from [aspiringsdgs/socialcalc-mcp](https://github.com/aspiringsdgs/socialcalc-mcp).

Publishing to GitHub Packages is what makes the package appear in this repository's **Packages** sidebar. GitHub only lists packages from its own registry there, never from npmjs.com, and the scope must match the owning organisation. The workflow adds the `@aspiringsdgs` scope at publish time, so the name on npm stays `socialcalc-ai`.

## One-time setup

1. **Add the npm token.** Create a granular access token on npmjs.com with read and write access to `socialcalc-ai`, then store it:

   ```bash
   gh secret set NPM_TOKEN -R aspiringsdgs/socialcalc-ai
   ```

   The npm account that owns the token must be a maintainer of `socialcalc-ai`. If publishing requires two-factor authentication, use an automation or granular token that bypasses it.

2. **Check Actions permissions.** Workflows must be allowed to run in the repository settings. The workflow requests `packages: write` itself, so the default read-only token setting is fine.

The GitHub Packages job needs no secret.

## Release steps

Run these from an up-to-date `main` branch.

1. **Test and build.**

   ```bash
   npm install
   npm run test:run
   npm run build
   node test-socialcalc.js
   ```

2. **Update the docs.** Add the release to **Release Notes** in `socialcalc/README.md`, and set the new version in `docs-site/src/siteConfig.ts` (`PACKAGES.socialcalc.version`).

3. **Bump the version** in `socialcalc/package.json`. The package lives in a subfolder of a repository whose root package is private, so edit the version in that file, either by hand or with:

   ```bash
   cd socialcalc
   npm version patch --no-git-tag-version      # or minor / major
   cd ..
   ```

4. **Check what will ship.**

   ```bash
   cd socialcalc && npm pack --dry-run && cd ..
   ```

   Only `core/`, `modules/`, `components/`, `utils/`, the entry files, typings and `README.md` should be listed, with no test files.

5. **Commit, tag and push.** The tag must be `v` plus the version.

   ```bash
   git add -A
   git commit -m "chore(release): socialcalc-ai v1.0.11"
   git tag v1.0.11
   git push origin main --follow-tags
   ```

6. **Create the GitHub Release.** Publishing the release triggers the workflow.

   ```bash
   gh release create v1.0.11 --generate-notes
   ```

7. **Watch the workflow.**

   ```bash
   gh run watch -R aspiringsdgs/socialcalc-ai
   ```

8. **Verify.**

   ```bash
   npm view socialcalc-ai version
   ```

   The GitHub Packages page is `https://github.com/aspiringsdgs/socialcalc-ai/pkgs/npm/socialcalc-ai`.

Replace `v1.0.11` in the examples with your version.

## What the workflow checks

- The release tag must equal `v` plus the `version` in `socialcalc/package.json`. A mismatch fails the job before anything is published.
- It publishes from the `socialcalc/` directory, using the `files` list in `socialcalc/package.json`. There is no build step because the package ships source files.

## Publishing to one registry only

Open the **Actions** tab, choose **Publish**, then **Run workflow**, and select `github`, `npm` or `both`. Or from the terminal:

```bash
gh workflow run publish.yml -R aspiringsdgs/socialcalc-ai -f registry=github
```

A manual run publishes whatever version is in `socialcalc/package.json` on the branch you select.

## Publishing by hand

Only needed if Actions is unavailable. Run from `socialcalc/`.

**npm**

```bash
npm login
npm publish --access public
```

**GitHub Packages** needs a personal access token (classic) with `write:packages`:

```bash
npm login --scope=@aspiringsdgs --registry=https://npm.pkg.github.com
npm pkg set name=@aspiringsdgs/socialcalc-ai
npm publish --registry=https://npm.pkg.github.com
git checkout package.json          # undo the temporary rename
```

## Things to know

- **A version can be published only once** per registry. If a publish fails halfway, bump the version rather than retrying the same one.
- **npm metadata comes from the published `package.json`.** The repository, issues and homepage links on npmjs.com are taken from `socialcalc/package.json` and only change when a new version is published.
- **Do not edit `name` in `package.json`** to add the scope. The workflow does it on the fly so npm keeps the unscoped name.
- **Backward compatibility.** Exports from `socialcalc/index.js` and `socialcalc/core/index.js` are public API. Removing or renaming one needs a major version.
- To retract a bad npm release within 72 hours, use `npm unpublish socialcalc-ai@<version>`, or prefer `npm deprecate socialcalc-ai@<version> "reason"`, which does not break installs.

## Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| `The NPM_TOKEN repository secret is not set` | Add the secret as described in one-time setup |
| `E403 ... cannot publish over the previously published versions` | That version already exists. Bump and publish again |
| `E401` or `E404` on the GitHub Packages job | Confirm the job has `packages: write` and that `repository.url` in `socialcalc/package.json` points to this repository |
| Release tag does not match package.json version | Delete the release and tag, fix the version, and create the release again |
| `npm run test:run` fails | Fix the failing test before releasing. Releases are not gated on tests in CI, so this check is manual |
| Package is not in the repository sidebar | It appears after the first successful GitHub Packages publish. Check the organisation's packages page and that the package is linked to this repository |
