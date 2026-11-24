export interface ContactFormData {
  name: string
  phone: string
  email: string
  message: string
}

export interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>
}

export interface ContactValidationResult {
  isValid: boolean
  errors: string[]
}
