import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders with placeholder and handles input changes', () => {
    const mockOnChange = jest.fn();
    
    render(
      <Textarea 
        placeholder="Enter your message here..." 
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByPlaceholderText('Enter your message here...');
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'Test message content' } });
    expect(mockOnChange).toHaveBeenCalled();
  });
});