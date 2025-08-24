import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { useAuthStore } from '@/store/authStore';
import SimplePdfViewer from '@/components/drive/SimplePdfViewer';

jest.mock('@/store/authStore', () => ({
  __esModule: true,
  default: jest.fn(),
  useAuthStore: jest.fn(),
}));

describe('SimplePdfViewer', () => {
  const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
  const mockUrl = 'https://example.com/test.pdf';
  const mockCreateElement = document.createElement as jest.MockedFunction<typeof document.createElement>;
  let mockAuthStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStore = {
      token: 'test-token',
      user: { id: 'test-id', email: 'test@example.com' },
      isTokenValid: jest.fn().mockReturnValue(true),
      refreshToken: jest.fn().mockResolvedValue(true),
      logout: jest.fn(),
    };
    mockUseAuthStore.mockReturnValue(mockAuthStore);
  });

  it('renders PDF viewer with toolbar', () => {
    render(<SimplePdfViewer url={mockUrl} />);
    expect(screen.getByText('PDF Viewer')).toBeInTheDocument();
    expect(screen.getByText('Open in new tab')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('opens PDF in new tab when clicking open button', () => {
    const mockWindow = window.open as jest.MockedFunction<typeof window.open>;
    render(<SimplePdfViewer url={mockUrl} />);
    const openButton = screen.getByText('Open in new tab');
    fireEvent.click(openButton);
    expect(mockWindow).toHaveBeenCalledWith(mockUrl, '_blank');
  });

  it('downloads PDF when clicking download button', () => {
    const mockClick = jest.fn();
    const mockRemove = jest.fn();
    const mockAnchor = document.createElement('a');
    Object.assign(mockAnchor, {
      click: mockClick,
      href: '',
      download: '',
      rel: '',
      remove: mockRemove,
    });

    mockCreateElement.mockReturnValue(mockAnchor);

    render(<SimplePdfViewer url={mockUrl} />);
    const downloadButton = screen.getByText('Download');
    fireEvent.click(downloadButton);

    expect(mockClick).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('shows loading state while PDF is loading', () => {
    render(<SimplePdfViewer url={mockUrl} />);
    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
  });

  it('shows error state when PDF fails to load', () => {
    render(<SimplePdfViewer url={mockUrl} error="Failed to load PDF" />);
    expect(screen.getByText('PDF Preview Unavailable')).toBeInTheDocument();
  });

  it('shows retry button when in error state', () => {
    const onRetry = jest.fn();
    render(<SimplePdfViewer url={mockUrl} error="Failed to load PDF" onRetry={onRetry} />);
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('sets correct iframe attributes', () => {
    render(<SimplePdfViewer url={mockUrl} />);
    const iframe = screen.getByTitle('PDF Viewer');
    expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals');
    expect(iframe).toHaveAttribute('src', `${mockUrl}#toolbar=1&navpanes=1&scrollbar=1`);
  });

  it('handles missing URL gracefully', () => {
    render(<SimplePdfViewer url="" />);
    expect(screen.getByText('PDF Preview Unavailable')).toBeInTheDocument();
  });

  it('handles missing auth token gracefully', () => {
    const mockStore = { ...mockAuthStore, token: null };
    mockUseAuthStore.mockReturnValue(mockStore);
    render(<SimplePdfViewer url={mockUrl} />);
    expect(screen.getByText('PDF Preview Unavailable')).toBeInTheDocument();
  });

  it('renders toolbar buttons correctly', () => {
    const { container } = render(<SimplePdfViewer url={mockUrl} />);
    expect(container).toBeInTheDocument();

    const openButton = screen.getByText('Open in new tab');
    const downloadButton = screen.getByText('Download');

    expect(openButton).toBeInTheDocument();
    expect(downloadButton).toBeInTheDocument();
    expect(openButton.closest('button')).toBeInTheDocument();
  });

  it('renders PDF viewer title', () => {
    render(<SimplePdfViewer url={mockUrl} />);
    expect(screen.getByText('PDF Viewer')).toBeInTheDocument();
  });
});