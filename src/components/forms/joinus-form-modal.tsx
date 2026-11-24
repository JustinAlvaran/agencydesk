"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useJobPositions } from "@/hooks/useJobPositions";
import { toast } from "sonner";
import ResumeDropzone from "@/components/ui/resume-dropzone";

/**
 * Zod schema defining validation rules for the Join Us application form.
 * Exported so parent components can use the type.
 */
export const JoinUsFormSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(11, { message: "Phone number must be exactly 11 characters." }).max(11, { message: "Phone number must be exactly 11 characters." }),
  applied_position: z.string().nonempty({ message: "Please select a job position." }),
  cover_letter: z.string().optional(),
  resume: z
    .custom<File[]>()
    .refine((files) => files && files.length > 0, { message: "A resume is required." })
    .refine((files) => files && files.every((file) => file.size <= 2 * 1024 * 1024), { message: "Max file size is 2MB." })
    .refine(
      (files) =>
        files &&
        files.every((file) =>
          ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)
        ),
      { message: "Only .pdf and .docx formats are accepted." }
    ),
});

/**
 * Inferred type from the Zod schema.
 * Exported for parent components to use in the onSubmit prop.
 */
export type JoinUsFormValues = z.infer<typeof JoinUsFormSchema>;

/**
 * Props for the JoinUsFormModal component.
 */
interface JoinUsFormProps {
  /** 
   * ID of the job position being applied for.
   * This will pre-populate the "Position of Interest" field.
   */
  job_applied: string;
  
  /** 
   * Function to handle the form submission with validated data.
   * Typically provided by the useFormSubmission hook.
   */
  onSubmit: (values: JoinUsFormValues) => Promise<void>;
  
  /** 
   * Flag indicating if the form is currently submitting.
   * Used to disable inputs and show loading states.
   */
  isSubmitting: boolean;
  
  /** 
   * Error message to display if submission fails.
   * Set to null when there's no error.
   */
  submissionError: string | null;
  
  /** 
   * Flag indicating if the submission was successful.
   * Used to trigger success notifications and form reset.
   */
  submissionSuccess: boolean;
}


/**
 * Job application form component with validation and file upload.
 * 
 * Features:
 * - Client-side validation using Zod schema
 * - File upload with drag-and-drop support
 * - Toast notifications for success/error states
 * - Automatic form reset on successful submission
 * - Responsive layout for mobile and desktop
 * 
 * @param props - Component props
 * 
 * @example
 * ```typescript
 * // In parent component
 * const { handleSubmit, isSubmitting, submitError, submitSuccess } = useFormSubmission({
 *   getRecaptchaToken: async (action) => await executeRecaptcha(action),
 *   onSuccess: () => closeModal()
 * });
 * 
 * <JoinUsFormModal
 *   job_applied="position-id-123"
 *   onSubmit={handleSubmit}
 *   isSubmitting={isSubmitting}
 *   submissionError={submitError}
 *   submissionSuccess={submitSuccess}
 * />
 * ```
 */
const JoinUsFormModal = ({
  job_applied,
  onSubmit,
  isSubmitting,
  submissionError,
  submissionSuccess,
}: JoinUsFormProps) => {
  // Fetch available job positions for the dropdown
  const { positions, positionsLoading, positionsError } = useJobPositions();

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<JoinUsFormValues>({
    resolver: zodResolver(JoinUsFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      applied_position: job_applied || "",
      cover_letter: "",
      resume: [],
    },
  });

  // Sync the job_applied prop with the form's state
  // This ensures the position field is correctly pre-populated
  useEffect(() => {
    if (job_applied) {
      form.setValue("applied_position", job_applied, { shouldValidate: true });
    }
  }, [job_applied, form]);

  // Show success toast and reset form when submission succeeds
  useEffect(() => {
    if (submissionSuccess) {
      toast.success("Success!", {
        description: "Application Submitted Successfully",
        style: {
          backgroundColor: '#33B31E',
          color: 'white',
        },
      });
      form.reset();
    }
  }, [submissionSuccess, form]);

  // Show error toast when submission fails
  useEffect(() => {
    if (submissionError) {
      toast.error("Submission Failed!", {
        description: submissionError,
        style: {
          backgroundColor: '#E1311A',
          color: 'white',
        },
      });
    }
  }, [submissionError]);

  /**
   * Form submit handler that validates data and calls the onSubmit prop.
   * The actual submission logic is handled by the parent component's hook.
   */
  const handleFormSubmit = async (values: JoinUsFormValues) => {
    await onSubmit(values);
  };

  const inputStyle = "w-full bg-white py-5 rounded-[0.625rem]";

  return (
    <div className="flex flex-col gap-8 w-full items-center lg:px-0">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-10 sm:gap-12 lg:gap-16 justify-center items-center w-full max-w-[1008px]"
        >
          <Label className="self-start font-bold text-2xl lg:text-4xl text-start">Application Form</Label>

          {/* First + Last name */}
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-stretch w-full">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>First Name<span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} className={inputStyle} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Last Name<span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} className={inputStyle} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email + Phone */}
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-stretch w-full">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Email<span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} className={inputStyle} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Phone<span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} className={inputStyle} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Job Position */}
          <FormField
            control={form.control}
            name="applied_position"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Position of Interest<span className="text-red-500">*</span></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={true}
                >
                  <SelectTrigger className="w-full bg-white py-5 rounded-[0.625rem]">
                    <SelectValue
                      placeholder={
                        positionsLoading ? "Loading positions..." : "Select a position"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.title} - {pos.employment_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {positionsError && <p className="text-red-500 text-sm mt-1">{positionsError}</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover Letter */}
          <FormField
            control={form.control}
            name="cover_letter"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Cover Letter<span className="text-primary">*</span></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Your message here"
                    {...field}
                    className="w-full h-32 lg:h-32 rounded-[0.625rem] bg-white"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resume Upload */}
          <Controller
            control={form.control}
            name="resume"
            render={({ field, fieldState }) => (
              <div className="w-full max-w-252">
                <ResumeDropzone
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              </div>
            )}
          />

          {/* Submit button */}
          <Button type="submit" className="w-full max-w-252 py-6" disabled={isSubmitting || positionsLoading}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default JoinUsFormModal;