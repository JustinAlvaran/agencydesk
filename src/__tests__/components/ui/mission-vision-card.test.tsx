import { render, screen } from '@testing-library/react';
import MissionVisionCard from '@/components/ui/missionvisioncard';

describe('MissionVisionCard', () => {
  it('renders mission vision information correctly', () => {
    const mockProps = {
      title: 'Our Mission',
      description: 'To provide innovative IT solutions that transform businesses and drive digital success.',
      link: '/mission-vision',
    };

    render(<MissionVisionCard {...mockProps} />);

    expect(screen.getByText('Our Mission')).toBeInTheDocument();
    expect(screen.getByText('To provide innovative IT solutions that transform businesses and drive digital success.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read More' })).toBeInTheDocument();
  });
});