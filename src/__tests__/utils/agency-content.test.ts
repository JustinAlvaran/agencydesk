import {fetchFAQs} from '@/utils/getFAQ';
import {getSingleJob} from '@/utils/getSingleJob';
import {getJobList} from '@/utils/getJobList';
import {getStaticProps} from '@/utils/getJobsPosition';
import {getTestimonials} from '@/utils/getTestimonials';
import {fetchSEOData} from '@/utils/seoService';
import {getServiceDetailSSG,getAllServiceSlugs} from '@/utils/getServiceDetailSSG';
it('serves local content without querying or exposing donor company data',async()=>{
 const network=jest.fn();global.fetch=network;
 expect(await getSingleJob({id:'example'})).toBeNull();expect(await getJobList({query:'engineer'})).toEqual({props:{careers:[]}});expect(await getStaticProps()).toEqual({props:{careers:[]}});
 expect(await getTestimonials()).toEqual([]);expect(await fetchSEOData('agencydesk','home')).toBeNull();
 expect((await fetchFAQs()).length).toBeGreaterThan(0);const slugs=await getAllServiceSlugs();expect(slugs).toContain('web-and-mobile-development');expect((await getServiceDetailSSG(slugs[0])).features.length).toBeGreaterThan(0);expect(network).not.toHaveBeenCalled();
});
