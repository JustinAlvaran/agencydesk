"use client";

// --- React & Next.js Imports ---
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// --- UI Component Imports ---
import Loader from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal-container";

// --- Form & Logic Imports ---
import JoinUsFormModal, {
  JoinUsFormValues,
} from "@/components/forms/joinus-form-modal";
import { useRecaptchaEnterprise } from "@/hooks/useRecaptchaEnterprise";

// --- Types ---
import { Career } from "@/types/careers";
import {
  MdWork,
  MdAccessTime,
  MdOutlineLocationOn,
} from "react-icons/md";
import { LuTarget } from "react-icons/lu";
import {
  FaArrowRight,
} from "react-icons/fa";
import { FiFacebook, FiLinkedin, FiTwitter } from "react-icons/fi";

// --- Environment Variables & Constants ---
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
const API_ENDPOINT =
  process.env.NEXT_PUBLIC_API_ENDPOINT ||
  "http://localhost:3001/verify-and-submit-application";
const RECAPTCHA_ACTION = "SUBMIT_APPLICATION";

// --- Component Props ---
type Props = {
  career: Career | undefined;
  isLoading: boolean;
};

// --- Component ---
const JobDetailsSection = ({ career, isLoading }: Props) => {
  const router = useRouter();

  // --- Modal, Form, & reCAPTCHA State ---
  const [open, setOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const { isCaptchaReady, getRecaptchaToken } = useRecaptchaEnterprise({
    siteKey: RECAPTCHA_SITE_KEY,
  });

  // --- Modal & Form Handlers ---

  /**
   * Opens the application modal and resets any previous form state.
   */
  const handleOpenModal = () => {
    // Reset all form states for a clean modal
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(false);
    setOpen(true);
  };

  /**
   * Securely handles the form submission.
   * This function is passed as a prop to the reusable `JoinUsFormModal`.
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
      // 2. Build the FormData
      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("applied_position", values.applied_position);
      formData.append(
        "cover_letter",
        values.cover_letter || ""
      );
      formData.append("resume", values.resume[0]);
      formData.append("recaptchaToken", token);

      // 3. Send to the secure backend
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "An unknown error occurred during submission."
        );
      }

      // 4. Handle success
      setSubmitSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitSuccess(false);
      }, 5000);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <section className="container mx-auto py-16 px-4 h-screen flex justify-center items-center">
        <Loader />
      </section>
    );
  }

  // --- Not Found State ---
  if (!career) {
    return (
      <section className="container mx-auto py-16 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
          <p>Sorry, the job you&apos;re looking for could not be found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container flex flex-col justify-center items-center mx-auto gap-10 lg:gap-20 py-16 lg:py-20 lg:pt-40 px-4 backdrop-blur-2xl">
      <Modal title="" open={open} onClose={() => setOpen(false)}>
        <JoinUsFormModal
          job_applied={career.id}
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

      {/* --- Job Header --- */}
      <div className="
          flex 
          flex-col 
          justify-start 
          items-start 
          max-w-5xl 
          mx-auto 
          bg-white/10 
          dark:bg-white/5 
          backdrop-blur-3xl 
          rounded-[1.875rem] 
          lg:rounded-[3.75rem] 
          sm:px-7.5
          sm:py-10
          md:p-12 
          2xl:p-25 
          border 
          border-white/5 
          min-w-[80vw] 
          shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.80)] 
          dark:shadow-[inset_0_0_20px_0_rgba(255,255,255,0.1)]
        ">
        <div className="flex flex-col lg:flex-row gap-12.5 lg:gap-10">
          <Image
            src="/logo/citc-logo.svg"
            alt="Logo"
            width={128}
            height={128}
            className="min-w-32 sm:self-start lg:min-w-xs"
          />
          <div className="flex flex-col gap-5 justify-between">
            <span className="flex items-center gap-2">
              <MdWork color="red" size={20} />
              <p className="font-lato font-bold text-[clamp(0.75rem,1vw,1rem)] text-gray-700 dark:text-white">
                {career.field || "N/A"}
              </p>
            </span>
            <h1 className="text-3xl md:text-4xl 2xl:text-6xl font-bold mb-4">
              {career.title}
            </h1>
            <p className="font-lato text-gray-700 text-sm lg:text-md 2xl:text-2xl dark:text-white">
              {career.description || "N/A"}
            </p>
            <div className="flex flex-wrap gap-6">
              <span className="flex items-center gap-2">
                <MdAccessTime color="red" size={20} />
                <p className="font-lato text-gray-700 dark:text-white">
                  {career.employment_type || "N/A"}
                </p>
              </span>
              <span className="flex items-center gap-2">
                <MdOutlineLocationOn color="red" size={20} />
                <p className="font-lato text-gray-700 dark:text-white">
                  {career.location || "N/A"}
                </p>
              </span>
              <span className="flex items-center gap-2">
                <LuTarget color="red" size={20} />
                <p className="font-lato text-gray-700 dark:text-white">
                  {career.level || "N/A"}
                </p>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Job Details --- */}
      <div className="
          max-w-4xl 
          mx-auto 
          bg-white/10 
          dark:bg-white/5 
          backdrop-blur-3xl 
          rounded-[1.875rem]
          sm:gap-10
          xl:gap-12.5
          lg:rounded-[60px] 
          py-10 
          px-7.5 
          md:p-12 
          2xl:p-25 
          border 
          border-white/5 
          min-w-[80vw] 
          shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.80)] 
          dark:shadow-[inset_0_0_20px_0_rgba(255,255,255,0.1)]
          ">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">About the Role</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-line">
              {career.about_the_role || "N/A"}
            </p>
          </div>
        </div>

        {career.key_responsibilities && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Key Responsibilities
            </h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: career.key_responsibilities }}
            />
          </div>
        )}

        {career.qualifications_skills_required && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              Qualifications & Skills Required
            </h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: career.qualifications_skills_required,
              }}
            />
          </div>
        )}

        {/* --- Share Section --- */}
        <div className="mt-10 flex flex-col sm:items-center md:items-start sm:pb-[40px] xl:pb-[80px]">
          <p className="text-center text-sm md:text-base text-gray-500 dark:text-gray-400 mb-2">
            Share this job with your network:
          </p>
          <div className="flex gap-4">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 text-black dark:text-white p-3 rounded-full hover:bg-blue-600 transition"
              aria-label="Share on Facebook"
            >
              <FiFacebook />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(career?.title || "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 text-black dark:text-white p-3 rounded-full hover:bg-sky-400 transition"
              aria-label="Share on X (Twitter)"
            >
              <FiTwitter />
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(career?.title || "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 text-black dark:text-white p-3 rounded-full hover:bg-blue-700 transition"
              aria-label="Share on LinkedIn"
            >
              <FiLinkedin />
            </a>
          </div>
        </div>

        {/* --- Action Buttons --- */}
        <div className="mt-10 flex flex-col sm:max-w-100 lg:flex-row justify-center lg:justify-start items-center gap-5 lg:gap-10">
          <Button
            className="rounded-full sm:w-full h-[47px] min-w-[200px] cursor-pointer"
            onClick={() => router.push("/careers")}
            variant="secondary"
          >
            BACK TO CAREERS
          </Button>

          <Button
            className="rounded-full sm:w-full h-[47px] min-w-[200px] flex items-center justify-center gap-2"
            onClick={handleOpenModal}
            disabled={!isCaptchaReady}
          >
            {isCaptchaReady ? (
              <>
                APPLY NOW
                <FaArrowRight color="white" size={20} />
              </>
            ) : (
              "Loading..."
            )}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default JobDetailsSection;