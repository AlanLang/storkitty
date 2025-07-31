# GitHub Branch Protection Setup

To enable PR protection rules that require the quality checks to pass before merging, follow these steps:

## 1. Go to Repository Settings
- Navigate to your GitHub repository
- Click on "Settings" tab
- Select "Branches" from the left sidebar

## 2. Add Branch Protection Rule
- Click "Add rule" or "Add branch protection rule"
- Enter branch name pattern: `main`

## 3. Configure Protection Settings
Enable the following options:

### Required Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

In the status checks list, add:
- `Code Quality Checks` (job name from our workflow)
- `E2E Tests` (job name from our workflow)

### Additional Recommended Settings
- ✅ **Require pull request reviews before merging**
  - Required number of reviewers: 1 (or as needed)
- ✅ **Dismiss stale pull request reviews when new commits are pushed**
- ✅ **Require review from code owners** (if you have CODEOWNERS file)
- ✅ **Restrict pushes that create files larger than 100MB**
- ✅ **Require signed commits** (optional but recommended)

### Branch Restrictions
- ✅ **Restrict pushes to matching branches**
- Add administrators and/or specific users who can bypass restrictions if needed

## 4. Save Changes
Click "Create" or "Save changes" to apply the branch protection rules.

## 5. Test the Setup
1. Create a test branch with some changes
2. Open a pull request to main
3. Verify that the PR shows "Checks required" status
4. Confirm that merge is blocked until all checks pass

## Workflow Jobs Overview

Our `.github/workflows/pr-checks.yml` includes:

### Code Quality Checks Job
- Runs Biome linting on main project (`bun run check`)
- Runs Biome linting on E2E tests (`bun run test:e2e:check`)
- Fast execution (~1-2 minutes)

### E2E Tests Job
- Builds frontend and backend
- Installs Playwright browsers
- Runs comprehensive end-to-end tests
- Uploads test reports and artifacts
- Longer execution (~5-10 minutes)

Both jobs must pass for PR to be mergeable.