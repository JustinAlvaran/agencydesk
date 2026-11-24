"use client"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useJobPositions } from "@/hooks/useJobPositions"
import { useRecaptchaEnterprise } from "@/hooks/useRecaptchaEnterprise";
import { JoinUsFormValues } from "@/components/forms/joinus-form-modal";
import ResumeDropzone from "@/components/ui/resume-dropzone";
import { toast } from "sonner";

/**
 * Zod schema defining validation rules for the Join Us application form.
 */
const FormSchema = z.object({
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
})

/**
 * Main form component for submitting job applications.
 * Uses a custom hook to fetch job positions and handles form validation/submission.
 */
const JoinUsForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)

  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
  const RECAPTCHA_ACTION = "SUBMIT_APPLICATION";
  const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3001/verify-and-submit-application";

  // reCAPTCHA hook state  // reCAPTCHA hook state
  const { isCaptchaReady, getRecaptchaToken } = useRecaptchaEnterprise({
    siteKey: RECAPTCHA_SITE_KEY,
  });

  // 🆕 Using custom hook
  const { positions, positionsLoading, positionsError } = useJobPositions()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      applied_position: "",
      cover_letter: "",
      resume: [],
    },
  })

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
        toast.error("Submission Failed!", {
          description: data.message || "An unknown error occurred during submission.",
        });
        throw new Error(data.message || "An unknown error occurred during submission.");
      }

      // 4. Handle success
      setSubmitSuccess(true);
      console.log("Application submitted successfully:", submitSuccess);
      toast.success("Submission Successful!", {
        description: "Application submitted successfully! We will get in touch with you shortly.",
      });

      // Reset the submission state
      setSubmitSuccess(false);
      // 5. Reset the form
      form.reset();

    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
      toast.error("Submission Failed!", {
        description: err instanceof Error ? err.message : `An unexpected error occurred. ${submitError || ""}`,
      });
    } finally {
      // Ensure loading state is turned off
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full bg-white py-5 rounded-[10px]"

  return (
    <div className="flex flex-col gap-8 w-full items-center px-5 lg:px-0">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleApplicationSubmit)}
          className="flex flex-col gap-10 sm:gap-12 lg:gap-16 justify-center items-center rounded-[24px] p-4 sm:p-6 lg:py-12 lg:px-10 backdrop-blur-2xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 w-full max-w-[1008px]"
        >
          <Label className="font-bold text-2xl lg:text-4xl text-red-500 text-center pt-7">Join Our Innovative Team</Label>

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
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting || positionsLoading}>
                <SelectTrigger className="w-full bg-white py-5 rounded-[10px]">
                    <SelectValue
                      placeholder={
                        positionsLoading
                          ? "Loading positions..."
                          : positionsError
                          ? "Error loading positions"
                          : "Select a position"
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

          {/* Why join */}
          <FormField
            control={form.control}
            name="cover_letter"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Cover Letter<span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us why you want to join our team"
                    {...field}
                    className="w-full h-32 lg:h-32 rounded-[10px] bg-white"
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
              <div className="w-full max-w-[1008px]">
                <ResumeDropzone
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  error={fieldState.error?.message}
                />
              </div>
            )}
          />

          {/* Submit button */}
          <Button type="submit" className="w-full max-w-[1008px] py-6" disabled={isSubmitting || positionsLoading || !isCaptchaReady}>
            {isSubmitting  ? "Submitting..." : "Submit Application"}  
          </Button>

          <p className="font-lato text-center text-xs lg:text-lg text-gray-500 dark:text-white w-full max-w-[1008px]">
            By submitting this application, you agree to our privacy policy and consent to the processing of your personal data for recruitment purposes
          </p>
        </form>
      </Form>
    </div>
  )
}

export default JoinUsForm
