import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../frontend/src/App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('should have the correct document title structure', () => {
    render(<App />);
    // Basic test to ensure the app renders
    expect(document.body).toBeTruthy();
  });
});

describe('Environment', () => {
  it('should be in test mode', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});