import {isDemo} from '@/lib/env';
import {InquiryForm} from './inquiry-form';
import {MarketingHeader,MarketingFooter} from '@/components/marketing';
import {publicServices,websiteContent} from '@/lib/website-content';
import {inquiryService} from '@/lib/service-catalog';
export const metadata={title:'Project inquiry',description:'Tell AgencyDesk about your website, application, portal, or CRM automation project. Share your requirements and optional contact preferences.',alternates:{canonical:'/inquire'}};
export default async function Page({searchParams}:{searchParams:Promise<{service?:string|string[]}>}){const {service}=await searchParams;return <div className="marketing"><MarketingHeader/><main id="main-content" className="inquiry-page"><h1>{websiteContent.site_settings.contact_heading}</h1><p>{websiteContent.site_settings.contact_description}</p><InquiryForm key={typeof service==='string'?service:''} available={!isDemo()} services={publicServices.map(({id,title})=>({id,title}))} initialService={inquiryService(publicServices,service)}/></main><MarketingFooter/></div>;}
