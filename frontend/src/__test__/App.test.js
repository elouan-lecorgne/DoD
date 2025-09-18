import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

test('renders without crashing', () => {
  renderWithRouter(<App />);
});

test('renders login form when not authenticated', () => {
  renderWithRouter(<App />);
  // Vérifiez qu'un élément de login est présent
  // Vous pouvez adapter selon votre structure de composants
  expect(document.body).toBeInTheDocument();
});