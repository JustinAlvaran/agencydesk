import { z } from "zod"
import type { ContactFormData, ContactValidationResult } from "@/types/contact"

// Zod schema for contact form validation
export const contactFormSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .trim(),
  phone: z.string()
  .min(9, "Phone number is required").nonempty(),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  message: z.string()
    .min(1, "Message is required")
    .min(10, "Message must be at least 10 characters long")
    .trim(),
})

// Type inference from Zod schema
export type ContactFormSchema = z.infer<typeof contactFormSchema>

export function validateContactForm(data: ContactFormData): ContactValidationResult {
  try {
    contactFormSchema.parse(data)
    return {
      isValid: true,
      errors: [],
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(issue => issue.message),
      }
    }
    return {
      isValid: false,
      errors: ["Validation failed"],
    }
  }
}
