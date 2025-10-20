/**
 * Unit tests for LoadingState component
 */

import { render, screen } from '../../../test/utils';

import LoadingState from './LoadingState';

describe('LoadingState', () => {
  it('renders spinner by default', () => {
    render(<LoadingState />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingState text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dots variant', () => {
    render(<LoadingState variant="dots" />);
    expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
  });

  it('renders pulse variant', () => {
    render(<LoadingState variant="pulse" />);
    expect(screen.getByTestId('loading-pulse')).toBeInTheDocument();
  });

  it('renders skeleton variant', () => {
    render(<LoadingState variant="skeleton" />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingState size="sm" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('h-4', 'w-4');

    rerender(<LoadingState size="md" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('h-8', 'w-8');

    rerender(<LoadingState size="lg" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('h-12', 'w-12');
  });

  it('renders full screen when specified', () => {
    render(<LoadingState fullScreen text="Loading..." />);
    const fullScreenElement = screen.getByText('Loading...').closest('.fixed');
    expect(fullScreenElement).toHaveClass('inset-0', 'z-50');
  });

  it('applies custom className', () => {
    render(<LoadingState className="custom-class" />);
    expect(screen.getByTestId('loading-spinner').parentElement).toHaveClass('custom-class');
  });
});
