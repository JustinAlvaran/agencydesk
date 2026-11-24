import { useState, useCallback } from 'react';
import { JoinUsFormValues } from "@/components/forms/joinus-form-modal";

/**
 * API endpoint for form submission.
 * Falls back to localhost if environment variable is not set.
 */
const API_ENDPOINT =
  "/api/applications";

/**
 * reCAPTCHA action identifier for form submission.
 */
const RECAPTCHA_ACTION = "SUBMIT_APPLICATION";

/**
 * Props for the useFormSubmission hook.
 */
interface UseFormSubmissionProps {
  /**
   * Function to retrieve a reCAPTCHA token for verification.
   * @param action - The reCAPTCHA action identifier
   * @returns A promise that resolves to the token string or null if failed
   */
  getRecaptchaToken: (action: string) => Promise<string | null>;
  
  /**
   * Callback function invoked after successful form submission.
   * Use this to close modals, show notifications, or perform other post-submission actions.
   */
  onSuccess?: () => void;
}

/**
 * Return type for the useFormSubmission hook.
 */
interface UseFormSubmissionResult {
  /** Indicates whether the form is currently being submitted */
  isSubmitting: boolean;
  
  /** Contains error message if submission fails, null otherwise */
  submitError: string | null;
  
  /** Indicates whether the submission was successful */
  submitSuccess: boolean;
  
  /**
   * Function to handle form submission.
   * @param values - Validated form values conforming to JoinUsFormValues type
   */
  handleSubmit: (values: JoinUsFormValues) => Promise<void>;
  
  /**
   * Function to reset all submission-related state.
   * Useful for clearing errors or resetting the form after modal close.
   */
  resetSubmissionState: () => void;
}

/**
 * Custom hook for managing job application form submission.
 * 
 * Handles the complete submission flow including:
 * - reCAPTCHA token verification
 * - FormData construction with file upload
 * - API request to submission endpoint
 * - Loading, error, and success state management
 * 
 * @param props - Configuration object containing getRecaptchaToken and optional onSuccess callback
 * @returns Object containing submission state and handlers
 * 
 * @example
 * ```typescript
 * const { isSubmitting, submitError, submitSuccess, handleSubmit, resetSubmissionState } = 
 *   useFormSubmission({
 *     getRecaptchaToken: async (action) => await executeRecaptcha(action),
 *     onSuccess: () => {
 *       console.log('Application submitted successfully!');
 *       closeModal();
 *     }
 *   });
 * 
 * // In your form component
 * <JoinUsForm onSubmit={handleSubmit} isSubmitting={isSubmitting} ... />
 * ```
 */
export const useFormSubmission = ({
  getRecaptchaToken,
  onSuccess,
}: UseFormSubmissionProps): UseFormSubmissionResult => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /**
   * Resets all submission-related state to initial values.
   * Call this when closing the form or preparing for a new submission.
   */
  const resetSubmissionState = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  /**
   * Handles the complete form submission process.
   * 
   * Flow:
   * 1. Obtains reCAPTCHA token for verification
   * 2. Constructs FormData with all form fields including resume file
   * 3. Sends POST request to API endpoint
   * 4. Handles response and updates state accordingly
   * 5. Invokes onSuccess callback if submission succeeds
   * 
   * @param values - Validated form data from react-hook-form
   */
  const handleSubmit = useCallback(
    async (values: JoinUsFormValues) => {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      // Step 1: Obtain reCAPTCHA token
      const token = await getRecaptchaToken(RECAPTCHA_ACTION);
      if (!token) {
        setSubmitError("Failed to get reCAPTCHA verification. Please try again.");
        setIsSubmitting(false);
        return;
      }

      try {
        // Step 2: Construct FormData with all form fields
        const formData = new FormData();
        formData.append("first_name", values.first_name);
        formData.append("last_name", values.last_name);
        formData.append("email", values.email);
        formData.append("phone", values.phone);
        formData.append("applied_position", values.applied_position);
        formData.append("cover_letter", values.cover_letter || "");
        formData.append("resume", values.resume[0]);
        formData.append("recaptchaToken", token);

        // Step 3: Send POST request
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        // Step 4: Handle response
        if (!response.ok) {
          throw new Error(
            data.message || "An unknown error occurred during submission."
          );
        }

        // Step 5: Update success state and invoke callback
        setSubmitSuccess(true);
        onSuccess?.();
      } catch (err: unknown) {
        setSubmitError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [getRecaptchaToken, onSuccess]
  );

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    handleSubmit,
    resetSubmissionState,
  };
};