export interface Feature {
  id: string;
  title: string;
  description: string;
  order?: number;
  status: string;
}

export interface ServiceDetail {
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
  carousel_images: string[];
  features: Feature[];
  status: string;
}

export interface ServiceDetailProps {
  serviceDetail?: ServiceDetail;
  loading?: boolean;
}
