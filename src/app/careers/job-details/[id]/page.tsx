const DIRECTUS_URL = "";
import { Suspense, cache } from "react";
import { Metadata, ResolvingMetadata } from "next";
import ClientJobDetails from "./client-job-details";
import Loader from "@/components/ui/loader";
import { getSingleJob } from "@/utils/getSingleJob"; 



type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Dedupes the fetch request for a single job.
 * This ensures the data is fetched once per request lifecycle
 * and shared between generateMetadata and the page component.
 * * @param id - The UUID of the job position.
 */
const getJobData = cache(async (id: string) => {
  return await getSingleJob({ id });
});

/**
 * Generates the static paths for all available job positions.
 * Used for Static Site Generation (SSG) to pre-render job pages.
 * * @returns An array of params objects containing job IDs.
 */
export async function generateStaticParams() { return []; }

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobData(id);

  if (!job) {
    return {
      title: "Job Not Found | AgencyDesk",
    };
  }

  const title = `${job.title} | AgencyDesk Careers`;
  
  const plainTextDescription = job.description
    ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 160) + "..."
    : "Join our team at AgencyDesk. Apply now!";

  const previousImages = (await parent).openGraph?.images || [];

  // Support Directus relational field being either a string ID or an object with an `id` field
  const imageId =
    typeof job.image === "string"
      ? job.image
      : job.image && typeof job.image === "object" && "id" in job.image
      ? (job.image as { id: string }).id
      : null;

  const jobImageUrl = imageId
    ? `${DIRECTUS_URL}/assets/${imageId}?width=1200&height=630&fit=cover`
    : null;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://agencydesk-theta.vercel.app"),
    title: title,
    description: plainTextDescription,
    openGraph: {
      title: title,
      description: plainTextDescription,
      images: jobImageUrl ? [jobImageUrl, ...previousImages] : previousImages,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: plainTextDescription,
      images: jobImageUrl ? [jobImageUrl] : [],
    },
  };
}

/**
 * The main server component for the Job Details page.
 * Fetches initial data and passes it to the client component.
 * It also pre-calculates the full image URL to prevent 404 errors on the client.
 */
export default async function JobDetailsPage({ 
  params 
}: Props) {
  const { id } = await params;
  const initialJobData = await getJobData(id);
  
  if (initialJobData && initialJobData.image) {
    const imgId =
      typeof initialJobData.image === "string"
        ? initialJobData.image
        : typeof initialJobData.image === "object" && "id" in initialJobData.image
        ? (initialJobData.image as { id: string }).id
        : null;

    if (imgId) {
      initialJobData.fullImageUrl = `${DIRECTUS_URL}/assets/${imgId}`;
    }
  }

  return (
    <div className="radial-gradient-bg min-h-screen py-10">
      <Suspense fallback={<div className="text-center py-20 backdrop-blur-2xl"><Loader /></div>}>
        <ClientJobDetails jobId={id} initialJobData={initialJobData} />
      </Suspense>
    </div>
  );
}