"use client";
import BenefitsSection from "@/sections/home/benefits-section";
import JobDetailsSection from "@/sections/career/job-details-section";
import { getSingleJob } from "@/utils/getSingleJob";
import React, { useEffect, useState } from "react";
import { Career } from "@/types/careers";
import CommunitySection from "@/sections/home/community-section";
import { ContactSection } from "@/sections/contact-section";
import JobCarouselSection from "@/sections/career/job-carousel-section";

type ClientJobDetailsProps = {
  jobId: string;
  initialJobData?: Career | null; // New prop for SSR data
};

const ClientJobDetails = ({ jobId, initialJobData }: ClientJobDetailsProps) => {
  // Initialize state with server data if available, otherwise undefined
  const [job, setJob] = useState<Career | undefined>(initialJobData ?? undefined);
  
  // Only load if we don't have initial data
  const [loading, setLoading] = useState(!initialJobData);

  useEffect(() => {
    // Skip fetch if we already have data from server
    if (initialJobData) return;

    async function loadJob() {
      if (!jobId) return;
      try {
        setLoading(true);
        const data = await getSingleJob({ id: jobId });
        setJob(data ?? undefined);
      } catch (error) {
        console.error("Error loading job:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadJob();
  }, [jobId, initialJobData]);

  return (
    <>
      <JobDetailsSection career={job} isLoading={loading} />
      <JobCarouselSection />
      {/* Show benefits if we have data (even if technically 'loading' in background, usually instant with SSR) */}
      {(job || !loading) && <BenefitsSection />}
      <CommunitySection />
      <ContactSection />
    </>
  );
};

export default ClientJobDetails;