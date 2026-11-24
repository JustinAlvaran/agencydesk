"use client";
import React, { useState, useEffect } from "react";
import { getJobList } from "@/utils/getJobList";
import { getStaticProps } from "@/utils/getJobsPosition";
import CareerHeroSection from "@/sections/career/career-hero-section";
import JobListSection from "@/sections/career/job-list-section";
import BenefitsSection from "@/sections/home/benefits-section";
import CommunitySection from "@/sections/home/community-section";
import { ContactSection } from "@/sections/contact-section";
import type { Career } from "@/types/careers";

export default function CareersPage() {
  const [jobs, setJobs] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSearch = async (query: string) => {
    setLoading(true);
    const result = await getJobList({ query });
    if (result && result.props && Array.isArray(result.props.careers)) {
      localStorage.setItem("jobs", JSON.stringify(result.props.careers));
      setJobs(result.props.careers);
    } else {
      setJobs([]);
    }
    setLoading(false);
  };

  const loadJob = async () => {
    setLoading(true);
    const result = await getStaticProps();
    if (result && result.props && Array.isArray(result.props.careers)) {
      setJobs(result.props.careers);
    } else {
      setJobs([]);
    }
    setLoading(false);
  }

  // initial fetch (all jobs)
  useEffect(() => {
    loadJob();
  }, []);

  return (
      <div className="radial-gradient-bg">
        <CareerHeroSection
          headline="Join Our Team of Innovators"
          subheadline="We value talent and innovation. Explore career opportunities and advance your professional journey with us."
          heroImage="/images/CareersHero.webp"
          onSearch={handleSearch}
          onClear={loadJob}
        />

        <JobListSection jobs={jobs} loading={loading} />

        <BenefitsSection />
        <CommunitySection />
        <ContactSection />
      </div>
  );
}
