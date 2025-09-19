import { render, screen } from '@testing-library/react';
import App from '../App';
import '@testing-library/jest-dom';

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock axios to avoid API calls during tests
jest.mock('axios', () => ({
  create: () => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })
}));

test('renders without crashing', () => {
  render(<App />);
  expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
});

test('renders login form when not authenticated', () => {
  render(<App />);
  expect(screen.getByText(/Sign in to manage/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});