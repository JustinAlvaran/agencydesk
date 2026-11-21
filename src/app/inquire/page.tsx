import {PublicTheme} from '@/components/public-theme';
import {isDemo} from '@/lib/env';
import {InquiryForm} from './inquiry-form';
import {MarketingHeader,MarketingFooter} from '@/components/marketing';
import {publicServices,websiteContent} from '@/lib/website-content';
import {inquiryService} from '@/lib/service-catalog';
export const metadata={title:'Project inquiry',description:'Tell AgencyDesk about your website, application, portal, or CRM automation project. Share your requirements and optional contact preferences.',alternates:{canonical:'/inquire'}};
export default async function Page({searchParams}:{searchParams:Promise<{service?:string|string[]}>}){const {service}=await searchParams;return <PublicTheme><MarketingHeader/><main id="main-content" className="inquiry-page"><div className="inquiry-intro"><h1>{websiteContent.site_settings.contact_heading}</h1><p>{websiteContent.site_settings.contact_description}</p><div className="inquiry-next"><h2>A clear next step.</h2><p>Share what you need. We can work through the requirements, agree on a scope, and put the next steps into a proposal.</p></div></div><div className="inquiry-form-column"><InquiryForm key={typeof service==='string'?service:''} available={!isDemo()} services={publicServices.map(({id,title})=>({id,title}))} initialService={inquiryService(publicServices,service)}/></div></main><MarketingFooter/></PublicTheme>;}
