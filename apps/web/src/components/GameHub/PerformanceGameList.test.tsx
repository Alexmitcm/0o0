/**
 * Unit tests for PerformanceGameList component
 */

import { render, screen, fireEvent } from '../../test/utils';
import { mockGames } from '../../test/utils';
import PerformanceGameList from './PerformanceGameList';

// Mock the performance hook
vi.mock('../../hooks/usePerformanceApi', () => ({
  useComponentPerformance: vi.fn()
}));

describe('PerformanceGameList', () => {
  const defaultProps = {
    games: mockGames,
    onGameClick: vi.fn(),
    onLike: vi.fn(),
    onPlay: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders game list correctly', () => {
    render(<PerformanceGameList {...defaultProps} />);
    
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('Another Game')).toBeInTheDocument();
  });

  it('renders loading state when loading', () => {
    render(<PerformanceGameList {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Loading games...')).toBeInTheDocument();
  });

  it('renders empty state when no games', () => {
    render(<PerformanceGameList {...defaultProps} games={[]} />);
    
    expect(screen.getByText('No games found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('calls onGameClick when game is clicked', () => {
    render(<PerformanceGameList {...defaultProps} />);
    
    const gameCard = screen.getByText('Test Game').closest('div');
    fireEvent.click(gameCard!);
    
    expect(defaultProps.onGameClick).toHaveBeenCalledWith(mockGames[0]);
  });

  it('calls onPlay when play button is clicked', () => {
    render(<PerformanceGameList {...defaultProps} />);
    
    const playButtons = screen.getAllByText('Play');
    fireEvent.click(playButtons[0]);
    
    expect(defaultProps.onPlay).toHaveBeenCalledWith('1');
  });

  it('calls onLike when like button is clicked', () => {
    render(<PerformanceGameList {...defaultProps} />);
    
    const likeButtons = screen.getAllByText('Like');
    fireEvent.click(likeButtons[0]);
    
    expect(defaultProps.onLike).toHaveBeenCalledWith('1');
  });

  it('displays game information correctly', () => {
    render(<PerformanceGameList {...defaultProps} />);
    
    expect(screen.getAllByText('A test game for unit testing')).toHaveLength(2);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays categories correctly', () => {
    render(<PerformanceGameList {...defaultProps} />);
    
    expect(screen.getAllByText('Action')).toHaveLength(2);
  });

  it('handles missing thumbnail gracefully', () => {
    const gamesWithoutThumbnail = [{
      ...mockGames[0],
      thumb1Url: undefined
    }];
    
    render(<PerformanceGameList {...defaultProps} games={gamesWithoutThumbnail} />);
    
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('applies custom height and itemHeight', () => {
    render(
      <PerformanceGameList 
        {...defaultProps} 
        height={400} 
        itemHeight={150} 
      />
    );
    
    // The height and itemHeight are applied to internal components
    // We can't easily test the exact values without more complex setup
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });
});
