# Testing Documentation

## Overview

This Next.js(ReactJS) project includes a comprehensive testing setup using **Jest** and **React Testing Library**. The testing framework is fully integrated with the CI/CD pipeline and includes coverage reporting.

## Testing Stack

- **Jest** - JavaScript testing framework
- **React Testing Library** - React component testing utilities
- **jest-environment-jsdom** - DOM simulation for browser-like testing
- **jest-junit** - JUnit XML reporter for CI/CD integration
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements

## Available Test Scripts

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (with junit reporter)
npm run test:ci
```

## Test Structure

Tests are located in the `src/__tests__/` directory with the following naming convention:
- `*.test.tsx` - Component tests
- `*.test.ts` - Utility/logic tests

### Current Test Coverage

- ✅ **Home Page** (`page.test.tsx`) - Tests the main landing page component
- ✅ **Root Layout** (`layout.test.tsx`) - Tests the application layout wrapper
- ✅ **404 Not Found** (`not-found.test.tsx`) - Tests the error page component

## Test Configuration

### Jest Configuration (`jest.config.js`)

- Uses `next/jest` for Next.js integration
- Configured for JSDOM environment
- Includes coverage collection from `src/` directory
- Excludes build outputs and node_modules
- Generates multiple coverage report formats

### Jest Setup (`jest.setup.js`)

Includes mocks for:
- **Next.js Image component** - Prevents image optimization issues in tests
- **Next.js Link component** - Renders as standard anchor tags
- **Next.js Router** - Provides mock router functionality
- **Browser APIs** - ResizeObserver, matchMedia
- **Global test utilities** - Custom Jest matchers

## Writing Tests

### Basic Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import YourComponent from '../path/to/YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Testing Best Practices

1. **Test user interactions, not implementation details**
2. **Use semantic queries** (getByRole, getByLabelText, getByText)
3. **Test accessibility features** (alt text, proper HTML structure)
4. **Mock external dependencies** (APIs, Next.js components)
5. **Keep tests focused and simple**

## Coverage Reports

Coverage reports are generated in multiple formats:
- **Console output** - Immediate feedback during test runs
- **HTML report** - Detailed coverage report in `coverage/` directory
- **LCOV report** - For CI/CD integration
- **JSON summary** - For programmatic analysis

### Coverage Thresholds

Currently achieving **90%+ coverage** across all components:
- Statements: 90.9%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## CI/CD Integration

### GitLab CI Pipeline

The testing pipeline includes:

1. **Build Stage** - Compiles the application
2. **Test Stage** - Runs all tests with coverage
3. **Deploy Stage** - Only runs if tests pass

### Test Stage Configuration

```yaml
test:
  stage: test
  script:
    - npm run test:ci  # Runs tests with junit reporter
    - npm run lint     # ESLint checks
    - npx tsc --noEmit # TypeScript checks
  artifacts:
    reports:
      junit: junit.xml  # Test results for GitLab
    paths:
      - coverage/       # Coverage reports
```

## Adding New Tests

### For New Components

1. Create a test file in `src/__tests__/`
2. Follow the naming convention: `ComponentName.test.tsx`
3. Test key functionality and user interactions
4. Ensure accessibility features are tested

### For New Features

1. Add tests before implementing features (TDD)
2. Test both happy path and edge cases
3. Mock external dependencies appropriately
4. Update this documentation if needed

## Common Testing Patterns

### Testing Forms

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('handles form submission', async () => {
  const user = userEvent.setup()
  render(<MyForm />)
  
  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  
  expect(screen.getByText('Success message')).toBeInTheDocument()
})
```

### Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react'

it('loads data asynchronously', async () => {
  render(<AsyncComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Loaded data')).toBeInTheDocument()
  })
})
```

## Troubleshooting

### Common Issues

1. **JSDOM DOM nesting warnings** - Expected for layout components that render html/body
2. **Image priority prop warnings** - Handled by Next.js Image mock
3. **Router not available** - Handled by Next.js Router mock

### Debug Tips

- Use `screen.debug()` to see the rendered DOM
- Add `console.log()` statements in tests for debugging
- Run tests in watch mode for faster feedback
- Check coverage reports to identify untested code

## Future Enhancements

### Potential Additions

- **E2E Testing** with Playwright for full user journey testing
- **Visual Regression Testing** with tools like Chromatic
- **Performance Testing** with React Testing Library performance utilities
- **API Testing** with MSW (Mock Service Worker)
- **Accessibility Testing** with jest-axe

### Test Organization

As the project grows, consider:
- Creating test utilities in `src/__tests__/utils/`
- Adding shared test fixtures in `src/__tests__/fixtures/`
- Organizing tests by feature/domain
- Setting up test database seeders for integration tests

---

For questions about testing or to contribute to the test suite, please refer to the project's contribution guidelines.
