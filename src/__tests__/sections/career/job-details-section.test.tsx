import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobDetailsSection from '@/sections/career/job-details-section';
import { Career } from '@/types/careers';

const mockCareer: Career = {
  id: '1',
  field: 'Engineering',
  title: 'Frontend Wizard',
  description: 'Build cool UIs',
  employment_type: 'Full-time',
  location: 'Remote',
  level: 'Senior',
  about_the_role: 'You will craft interfaces',
  key_responsibilities: '<ul><li>Code</li></ul>',
  qualifications_skills_required: '<ul><li>React</li></ul>',
};

/* ---------- mock next/navigation ---------- */
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

/* ---------- mock icons (optional) ---------- */
jest.mock('react-icons/md', () => ({
  MdWork: () => <span>work</span>,
  MdAccessTime: () => <span>time</span>,
  MdOutlineLocationOn: () => <span>loc</span>,
}));
jest.mock('react-icons/lu', () => ({ LuTarget: () => <span>target</span> }));
jest.mock('react-icons/fa', () => ({
  FaArrowRight: () => <span>arrow</span>,
  FaFacebookF: () => <span>fb</span>,
  FaTwitter: () => <span>tw</span>,
  FaLinkedinIn: () => <span>in</span>,
}));

/* ---------- mock ui components ---------- */
jest.mock('@/components/ui/loader', () => () => <div data-testid="loader">spinner</div>);
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
jest.mock('@/components/ui/cta-button', () => ({ link, title }: any) => (
  <a href={link} data-testid="apply-btn">{title}</a>
));

describe('JobDetailsSection', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows loader while loading', () => {
    render(<JobDetailsSection career={undefined} isLoading={true} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows "Job Not Found" when career is undefined and not loading', () => {
    render(<JobDetailsSection career={undefined} isLoading={false} />);
    expect(screen.getByText(/job not found/i)).toBeInTheDocument();
  });

  it('renders career details when provided', () => {
    render(<JobDetailsSection career={mockCareer} isLoading={false} />);
    expect(screen.getByText('Frontend Wizard')).toBeInTheDocument();
    expect(screen.getByText('Build cool UIs')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByText('Senior')).toBeInTheDocument();
    expect(screen.getByText('You will craft interfaces')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('"Back to Careers" button navigates to /careers', async () => {
    render(<JobDetailsSection career={mockCareer} isLoading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /back to careers/i }));
    expect(mockPush).toHaveBeenCalledWith('/careers');
  });

  it('renders social share links', () => {
    render(<JobDetailsSection career={mockCareer} isLoading={false} />);
    expect(screen.getByLabelText(/share on facebook/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share on x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share on linkedin/i)).toBeInTheDocument();
  });

});