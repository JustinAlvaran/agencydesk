import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CareersPage from '@/app/careers/page'; 

import type { Career } from '@/types/careers';

// Mock data
const mockJobs: Career[] = [
  {
    id: '1',
    field: 'Engineering',
    title: 'Frontend Developer',
    description: 'Build UIs',
    employment_type: 'Full-time',
    location: 'Manila',
    level: 'Mid',
  },
  {
    id: '2',
    field: 'Design',
    title: 'Product Designer',
    description: 'Design systems',
    employment_type: 'Full-time',
    location: 'Remote',
    level: 'Senior',
  },
];

/* ------------------------------------------------------------------ */
/* Mock modules                                                       */
/* ------------------------------------------------------------------ */
jest.mock('@/utils/getJobList', () => ({
  getJobList: jest.fn(async ({ query }: { query: string }) => {
    const filtered = mockJobs.filter(j =>
      j.title.toLowerCase().includes(query.toLowerCase())
    );
    return { props: { careers: filtered } };
  }),
}));

jest.mock('@/utils/getJobsPosition', () => ({
  getStaticProps: jest.fn(async () => ({ props: { careers: mockJobs } })),
}));

/* ------------------------------------------------------------------ */
/* Mock child sections (lightweight)                                  */
/* ------------------------------------------------------------------ */
jest.mock('@/sections/career/career-hero-section', () => ({
  __esModule: true,
  default: (
    { 
      onSearch, 
      onClear 
    }: 
    { 
      onSearch: (query: string) => void;
      onClear: () => void;
    }
  ) => (
    <div data-testid="hero">
      <button onClick={() => onSearch('frontend')}>Search</button>
      <button onClick={onClear}>Clear</button>
    </div>
  ),
}));

jest.mock('@/sections/career/job-list-section', () => ({
  __esModule: true,
  default: (
    { 
      jobs, 
      loading 
    }: 
    {
      jobs: Career[];
      loading: boolean;
    }
  ) => (
    <div>
      {loading && <span data-testid="loading">spinner</span>}
      <div data-testid="count">{jobs.length}</div>
      {jobs.map((j: Career) => (
        <div key={j.id} data-testid={`job-${j.id}`}>
          {j.title}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/sections/home/benefits-section', () => ({
  __esModule: true,
  default: () => <div data-testid="benefits" />,
}));

jest.mock('@/sections/home/community-section', () => ({
  __esModule: true,
  default: () => <div data-testid="community" />,
}));

jest.mock('@/sections/contact-section', () => ({
  ContactSection: () => <div data-testid="contact" />,
}));

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */
describe('CareersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders every section', async () => {
    render(<CareersPage />);

    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('benefits')).toBeInTheDocument();
    expect(screen.getByTestId('community')).toBeInTheDocument();
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('loads jobs on mount and stops loading', async () => {
    render(<CareersPage />);

    // initially loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('job-1')).toHaveTextContent('Frontend Developer');
    expect(screen.getByTestId('job-2')).toHaveTextContent('Product Designer');
  });

  it('search flow updates list and localStorage', async () => {
    render(<CareersPage />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

    userEvent.click(screen.getByText('Search')); // searches "frontend"

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(screen.getByTestId('job-1')).toBeInTheDocument();
    expect(screen.queryByTestId('job-2')).not.toBeInTheDocument();

    expect(localStorage.getItem('jobs')).toEqual(
      JSON.stringify(mockJobs.filter(j => j.title.includes('Frontend')))
    );
  });

  it('clear flow reloads all jobs', async () => {
    render(<CareersPage />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

    userEvent.click(screen.getByText('Search')); // single result
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    userEvent.click(screen.getByText('Clear')); // restore all
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
  });

  it('handles empty / malformed server response gracefully', async () => {
    const { getStaticProps } = await import('@/utils/getJobsPosition');
    (getStaticProps as jest.Mock).mockResolvedValueOnce({ props: { careers: null } });

    render(<CareersPage />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});