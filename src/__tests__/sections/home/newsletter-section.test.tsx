import {render,screen} from '@testing-library/react';
import Newsletter from '@/sections/home/newsletter-section';
it('does not collect emails or promise subscriptions before delivery is configured',()=>{render(<Newsletter/>);expect(screen.getByLabelText('Email address')).toBeDisabled();expect(screen.getByRole('button',{name:/subscriptions coming soon/i})).toBeDisabled();});
