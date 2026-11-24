"use client";

import React, { useState } from "react";
import CareerCard from "@/components/ui/career-card";
import Loader from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal-container";

import JoinUsFormModal, { JoinUsFormValues } from "@/components/forms/joinus-form-modal";
import { useRecaptchaEnterprise } from "@/hooks/useRecaptchaEnterprise";

// --- Types ---

/**
 * Describes the structure of a single job post.
 */
type Job = {
  id: string;
  field: string;
  title: string;
  description: string;
  employment_type: string;
  location: string;
  level: string;
  // Matches `Career["image"]` type so we can pass `Career[]` directly
  image?: string | { id: string };
};

/**
 * Props for the JobListSection component.
 */
type Props = {
  jobs: Job[];
  loading: boolean;
};

// --- Environment Variables ---

/**
 * The public reCAPTCHA Enterprise Site Key.
 * Loaded from .env.local
 */
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

/**
 * The URL of our secure backend endpoint.
 */
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3001/verify-and-submit-application";

/**
 * Action string for reCAPTCHA. This MUST match the 'expectedAction' in our backend.
 */
const RECAPTCHA_ACTION = "SUBMIT_APPLICATION";

// --- Component ---

/**
 * JobListSection
 *
 * This component displays a paginated list of open job positions.
 * It manages the "Apply" modal and securely handles the entire
 * application submission process, including reCAPTCHA verification,
 * by communicating with a secure backend.
 */
const JobListSection = ({ jobs, loading }: Props) => {
  // --- State ---

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal state
  const [open, setOpen] = useState<boolean>(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // Form submission state (managed by this parent component)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // reCAPTCHA hook state
  const { isCaptchaReady, getRecaptchaToken } = useRecaptchaEnterprise({
    siteKey: RECAPTCHA_SITE_KEY,
  });

  // --- Pagination Logic ---
  const totalPages = Math.ceil(jobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedJobs = jobs.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (window) {
        window.location.href = "#jobs"
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (window) {
        window.location.href = "#jobs"
      }
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    if (window) {
      window.location.href = "#jobs"
    }
  };

  // --- Modal & Form Handlers ---

  /**
   * Opens the application modal and resets any previous form state.
   * @param {string} jobId - The ID of the job to apply for.
   */
  const handleOpenModal = (jobId: string) => {
    setSelectedJobId(jobId);
    // Reset all form states for a clean modal
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(false);
    setOpen(true);
  };

  /**
   * Securely handles the form submission.
   * This function is passed as a prop to the reusable `JoinUsForm`.
   *
   * @param {JoinUsFormValues} values - The validated data from the form.
   */
  const handleApplicationSubmit = async (values: JoinUsFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // 1. Get a reCAPTCHA token
    const token = await getRecaptchaToken(RECAPTCHA_ACTION);
    if (!token) {
      setSubmitError("Failed to get reCAPTCHA verification. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 2. Build the FormData to send file + text
      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("applied_position", values.applied_position);
      formData.append("cover_letter", values.cover_letter || "");
      formData.append("resume", values.resume[0]); // The file itself
      formData.append("recaptchaToken", token); // The token

      // 3. Send to the secure backend
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
        // NOTE: Do not set 'Content-Type' header.
        // The browser sets it automatically with the correct 'boundary' for FormData.
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the error message from the backend
        throw new Error(data.message || "An unknown error occurred during submission.");
      }

      // 4. Handle success
      setSubmitSuccess(true);
      
      // Optionally, close modal after a delay
      setTimeout(() => {
        setOpen(false);
        setSubmitSuccess(false); // Reset for next time
      }, 5000);

    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      // Ensure loading state is turned off
      setIsSubmitting(false);
    }
  };

  // --- Render ---

  return (
    <section id="jobs" data-testid="jobs" className="w-screen 2xl:min-w-[1600px] flex flex-col justify-center items-center gap-5 mx-auto px-4 py-20 text-black dark:text-white backdrop-blur-2xl">
      {/* 
        This modal now contains the reusable form.
        This component passes down all the state and logic to the form.
      */}
      <Modal title="" open={open} onClose={() => setOpen(false)}>
        <JoinUsFormModal
          job_applied={selectedJobId}
          onSubmit={handleApplicationSubmit}
          isSubmitting={isSubmitting}
          submissionError={submitError}
          submissionSuccess={submitSuccess}
        />
        {!isCaptchaReady && !isSubmitting && (
          <p className="text-center text-sm text-gray-500 -mt-4 pb-4 px-6">
            Loading security verification...
          </p>
        )}
      </Modal>

      <h2 className="text-3xl 2xl:text-6xl font-montserrat font-semibold text-center">
        Open Positions
      </h2>
      <p className="font-lato text-sm 2xl:text-xl text-center mb-5">
        Discover opportunities to grow your career with our innovative teams
      </p>

      {loading && <Loader />}

      {!loading && jobs.length === 0 && (
        <p className="text-center text-gray-500">No job positions found.</p>
      )}

      {!loading && jobs.length > 0 && (
        <>
          <div className="flex flex-col lg:grid lg:grid-rows-2 lg:grid-cols-2 justify-center items-center gap-[clamp(20px,5vw,40px)] 3xl:min-w-[1600px]">
            {displayedJobs.map((job) => (
              <CareerCard
                key={job.id}
                id={job.id}
                title={job.title}
                description={job.description}
                field={job.field}
                employment_type={job.employment_type}
                level={job.level}
                location={job.location}
                link={`/apply-now/${job.id}`}
                onApply={handleOpenModal}
              />
            ))}
          </div>

          {/* --- Pagination Controls --- */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 text-black dark:text-white cursor-pointer"
                variant="outline"
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary text-white"
                        : "text-black dark:text-white hover:bg-gray-400 dark:hover:bg-red-500"
                    }`}
                    variant="outline"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2  text-black dark:text-white cursor-pointer"
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Showing {startIndex + 1} to {Math.min(endIndex, jobs.length)} of {jobs.length} positions
          </p>
        </>
      )}
    </section>
  );
};

export default JobListSection;