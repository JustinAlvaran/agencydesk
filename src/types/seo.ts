export interface Website {
  id: string;
  name: string;
  domain: string;
  default_meta_title?: string;
  default_meta_description?: string;
  default_og_image?: string | null;
}

export interface SEOData {
  id: string;
  page_slug: string;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string | null;
  og_title?: string;
  og_description?: string;
  og_image?: string | null;
  twitter_card?: string | null;
  structured_data?: string | null;
  website: Website;
}

export interface DirectusSEOResponse {
  data: SEOData[];
}
