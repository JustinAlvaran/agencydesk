import {isDemo} from '@/lib/env';
import {InquiryForm} from './inquiry-form';
import {MarketingHeader,MarketingFooter} from '@/components/marketing';
import {websiteContent} from '@/lib/website-content';
export const metadata={title:'Project inquiry'};
export default function Page(){return <div className="marketing"><MarketingHeader/><main id="main-content" className="inquiry-page"><h1>{websiteContent.site_settings.contact_heading}</h1><p>{websiteContent.site_settings.contact_description}</p><InquiryForm available={!isDemo()}/></main><MarketingFooter/></div>;}
