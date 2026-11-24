import { ServiceDetail, Feature } from "@/types/service-detail";

interface RawServiceDetail {
  id: string;
  slug: string;
  services_icon: string;
  heroTitle: string;
  heroSubtitle: string;
  backgroundImage?: string;
  title: string;
  subtitle: string;
  description: string;
  what_can_you_expect: string;
  main_image?: string;
  cta_title: string;
  cta_description: string;
  cta_primary_button: string;
  cta_secondary_button: string;
  features: RawServiceFeatureRelation[];
  status: string;
}

interface RawServiceFeature {
  id: string;
  title: string;
  description: string;
  order?: number;
  status: string;
}

interface RawServiceFeatureRelation {
  service_features_id: RawServiceFeature | null;
}

interface DirectusResponse {
  data: RawServiceDetail[];
}

// Static carousel images for different services
const getCarouselImages = (serviceSlug: string): string[] => {
  const carouselImageSets: Record<string, string[]> = {
    "web-and-mobile-development": [
      "/images/service-detail.webp",
      "/snaps/1.webp",
      "/snaps/2.webp",
      "/snaps/3.webp"
    ],
    "cloud-hosting": [
      "/images/service-detail.webp",
      "/snaps/4.webp",
      "/snaps/5.webp",
      "/snaps/6.webp"
    ],
    "cybersecurity": [
      "/images/service-detail.webp",
      "/snaps/1.webp",
      "/snaps/3.webp",
      "/snaps/5.webp"
    ],
    "content-marketing": [
      "/images/service-detail.webp",
      "/snaps/2.webp",
      "/snaps/4.webp",
      "/snaps/6.webp"
    ],
    "big-data-analytics": [
      "/images/service-detail.webp",
      "/snaps/1.webp",
      "/snaps/4.webp",
      "/snaps/6.webp"
    ],
    "niche-solutions": [
      "/images/service-detail.webp",
      "/snaps/2.webp",
      "/snaps/3.webp",
      "/snaps/5.webp"
    ]
  };

  return carouselImageSets[serviceSlug] || carouselImageSets["web-and-mobile-development"];
};

export async function getServiceDetail(serviceSlug:string): Promise<ServiceDetail|null> {
 return getDefaultServiceDetail(serviceSlug);
}
export const getDefaultServiceDetail = (
  serviceType: string = "web-and-mobile-development"
): ServiceDetail => {
  const defaultData: Record<string, ServiceDetail> = {
    "web-and-mobile-development": {
      id: "default-web-mobile",
      slug: "web-and-mobile-development",
      services_icon: "/icons/webmobile.webp",
      heroTitle: "Web Development",
      heroSubtitle: "Smart, scalable, and user-first digital platforms that drive results",
      backgroundImage: "/images/computer-program-coding-screen.webp",
      title: "What We Do",
      subtitle: "DEFAULT DETAILS",
      description:
        "We empower businesses to thrive in the digital age by designing and developing modern, responsive, and scalable web and mobile applications. Our goal is to create digital solutions that not only look exceptional but also perform seamlessly across every device.\n\nIn today's fast-paced world, users expect smooth, accessible, and reliable digital experiences. That's why we focus on building platforms tailored to your users' needs, whether they're browsing on a desktop at work, shopping from their phone, or managing tasks from home.",
      what_can_you_expect: "Our approach combines technical expertise with forward-thinking strategies to ensure your infrastructure is more than just functional, it becomes a competitive advantage. From designing scalable architectures to implementing top-tier security and monitoring systems, we help you reduce costs, improve efficiency, and achieve reliable uptime. The result: a cloud environment tailored to your business needs today and ready for tomorrow&apos;s growth.",
      main_image: "/images/service-detail.webp",
      cta_title: "Get Started Today!",
      cta_description:
        "Your vision deserves more than just a template, it deserves a digital experience built to last. Let's turn your ideas into a platform that engages users, drives results, and positions your business for long-term success.",
      cta_primary_button: "START YOUR PROJECT",
      cta_secondary_button: "JOIN OUR TEAM",
      carousel_images: getCarouselImages(serviceType),
      features: [
        {
          id: "1",
          title: "Cross-Platform Responsiveness",
          description:
            "Ensure your application works flawlessly across all devices and screen sizes, providing a consistent user experience whether on desktop, tablet, or mobile.",
          order: 1,
          status: "published",
        },
        {
          id: "2",
          title: "Seamless User Experience",
          description:
            "Design intuitive interfaces that guide users naturally through your application, reducing friction and increasing engagement and conversion rates.",
          order: 2,
          status: "published",
        },
        {
          id: "3",
          title: "Scalable Architecture",
          description:
            "Build robust foundations that can grow with your business, handling increased traffic and functionality without compromising performance.",
          order: 3,
          status: "published",
        },
        {
          id: "4",
          title: "Custom UI/UX Design",
          description:
            "Create unique, brand-aligned designs that stand out from the competition while maintaining usability and accessibility standards.",
          order: 4,
          status: "published",
        },
        {
          id: "5",
          title: "Integration & Functionality",
          description:
            "Seamlessly connect with third-party services, APIs, and existing systems to create a comprehensive digital ecosystem for your business.",
          order: 5,
          status: "published",
        },
      ],
      status: "published",
    },
  };

  return defaultData[serviceType] || defaultData["web-and-mobile-development"];
};
