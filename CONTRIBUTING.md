# ### 🚀 Development Workflow

### Branch Strategy

We use **Git Flow** with the following branches:

- **`main`** - Production-ready code, automatically deployed to production via Vercel
- **`develop`** - Integration branch for features, automatically deployed to preview via Vercel
- **`feature/*`** - Feature development branches (get preview deployments on PRs)
- **`hotfix/*`** - Critical fixes for production
- **`release/*`** - Release preparation branches

### Deployment Process

**Vercel handles all deployments automatically:**

- ✅ Push to `main` → Production deployment
- ✅ Push to `develop` → Preview deployment
- ✅ Create PR → Preview deployment with unique URL
- ✅ No manual deployment steps needed
- ✅ No Vercel tokens or secrets requiredng to SearchAlongTrack

## 🚀 Development Workflow

### Branch Strategy

We use **Git Flow** with the following branches:

- **`main`** - Production-ready code, automatically deployed to production
- **`develop`** - Integration branch for features, deployed to staging
- **`feature/*`** - Feature development branches
- **`hotfix/*`** - Critical fixes for production
- **`release/*`** - Release preparation branches

### Getting Started

1. **Clone and setup:**

   ```bash
   git clone <repo-url>
   cd SearchAlongTrack
   npm install
   ```

2. **Start development:**
   ```bash
   npm run dev
   ```

### Feature Development Process

1. **Create feature branch from develop:**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**

   - Write code
   - Add tests
   - Update documentation

3. **Before committing:**

   ```bash
   npm run ci  # Runs linting, type check, and tests
   ```

4. **Commit with conventional format:**

   ```bash
   git commit -m "feat: add error handling for API requests"
   git commit -m "fix: resolve issue with GPX file parsing"
   git commit -m "docs: update README with new features"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request to `develop` branch.

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Quality Standards

#### Before submitting a PR:

- [ ] Code passes all linting rules (`npm run lint`)
- [ ] TypeScript compilation succeeds (`npm run check`)
- [ ] All tests pass (`npm run test`)
- [ ] Code is properly formatted (`npm run format`)
- [ ] New features include tests
- [ ] Documentation is updated if needed

#### PR Requirements:

- [ ] PR title follows conventional commit format
- [ ] Description explains what and why
- [ ] Screenshots for UI changes
- [ ] Tests cover new functionality
- [ ] No console errors or warnings

### Testing

```bash
# Run all tests
npm run test

# Run only unit tests
npm run test:unit

# Run only E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Release Process

#### Regular Releases:

1. Create release branch from develop:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.0
   ```

2. Update version and create PR to main:

   ```bash
   npm version minor  # or patch/major
   git push origin release/v1.2.0
   ```

3. After PR merge, tag the release:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

#### Hotfixes:

1. Create hotfix branch from main:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   ```

2. Fix, test, and merge to both main and develop

### Environment Setup

#### Required:

- Node.js 20+
- npm or pnpm

#### Recommended:

- VS Code with Svelte extension
- Prettier extension
- ESLint extension

### Project Structure

```
src/
├── lib/           # Shared utilities and stores
├── routes/        # SvelteKit routes and pages
└── app.html       # HTML template

static/            # Static assets
e2e/              # End-to-end tests
```

## 🤝 Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

Thank you for contributing! 🙏
