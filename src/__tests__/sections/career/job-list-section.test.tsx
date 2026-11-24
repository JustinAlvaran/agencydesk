// src/__tests__/sections/career/job-list-section.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobListSection from '@/sections/career/job-list-section';

/* ------------------ correct mocks ------------------ */
jest.mock('@/components/ui/loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">spinner</div>,
}));

jest.mock('@/components/ui/career-card', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid={`card-${props.id}`}>{props.title}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: (props: any) => <button {...props} disabled={props.disabled} />,
}));
/* --------------------------------------------------- */

const mockJobs = Array.from({ length: 8 }, (_, i) => ({
  id: `${i + 1}`,
  field: 'Eng',
  title: `Job ${i + 1}`,
  description: 'desc',
  employment_type: 'Full-time',
  location: 'PH',
  level: 'Mid',
}));

describe('JobListSection', () => {
  it('shows loader when loading', () => {
    render(<JobListSection jobs={[]} loading={true} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows "No job positions found." when list is empty and not loading', () => {
    render(<JobListSection jobs={[]} loading={false} />);
    expect(screen.getByText(/no job positions found/i)).toBeInTheDocument();
  });

  it('renders only first 6 jobs on initial page 1', () => {
    render(<JobListSection jobs={mockJobs} loading={false} />);
    expect(screen.getAllByTestId(/^card-/)).toHaveLength(6);
    expect(screen.getByText('Job 1')).toBeInTheDocument();
    expect(screen.getByText('Job 6')).toBeInTheDocument();
    expect(screen.queryByText('Job 7')).not.toBeInTheDocument();
  });

  it('navigates to page 2 when Next clicked', async () => {
    render(<JobListSection jobs={mockJobs} loading={false} />);
    const nextBtn = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextBtn);
    expect(screen.getAllByTestId(/^card-/)).toHaveLength(2); // 7-8
    expect(screen.getByText('Job 7')).toBeInTheDocument();
    expect(screen.queryByText('Job 1')).not.toBeInTheDocument();
  });

  it('disables Prev on page 1 and Next on last page', async () => {
    render(<JobListSection jobs={mockJobs} loading={false} />);
  
    // initial state
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();
  
    // jump to last page
    await userEvent.click(nextBtn);
  
    // re-query buttons after render update
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();
  });

  it('jumps to specific page via numbered button', async () => {
    render(<JobListSection jobs={mockJobs} loading={false} />);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getAllByTestId(/^card-/)).toHaveLength(2);
    expect(screen.getByText('Job 7')).toBeInTheDocument();
  });

  it('shows correct range text', () => {
    render(<JobListSection jobs={mockJobs} loading={false} />);
    expect(screen.getByText(/showing 1 to 6 of 8 positions/i)).toBeInTheDocument();
  });
});