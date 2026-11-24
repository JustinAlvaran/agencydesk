export type Career = {
  id: string;
  field: string;
  title: string;
  description: string;
  employment_type: string;
  location: string;
  level: string;
  image?: string | { id: string };
  about_the_role?: string;
  key_responsibilities?: string;
  qualifications_skills_required?: string;
  fullImageUrl?: string;
};