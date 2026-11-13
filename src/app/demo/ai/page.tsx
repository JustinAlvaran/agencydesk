import {AppShell} from '@/components/app-shell';
import {A2uiLeadReview} from '@/components/a2ui-lead-review';

export const metadata = {title: 'AI workspace demo'};

export default function Page() {
  return <AppShell title='AI workspace'><A2uiLeadReview/></AppShell>;
}
