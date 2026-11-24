"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import type { ContactFormProps } from "@/types/contact"
import { contactFormSchema, type ContactFormSchema } from "@/lib/contact-validation"
import { submitContactForm } from "@/lib/contact-service"
import { toast } from "sonner"

export function ContactForm({ onSubmit }: ContactFormProps = {}) {
  const form = useForm<ContactFormSchema>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      message: "",
    },
  })

  const { handleSubmit, formState: { isSubmitting } } = form

  const onSubmitForm = async (data: ContactFormSchema) => {
    try {
      const payload = { ...data }

      if (onSubmit) {
        await onSubmit(payload)
      } else {
        await submitContactForm(payload)
      }

      toast.success(
        "Message Sent!",
        {
          description: "Thank you for your message. We'll get back to you soon.",
          style: {
            backgroundColor: '#33B31E',
            color: 'white',
          },
        }
      )

      form.reset()
    } catch {
      toast.error(
        "Error",
        {
          description: "Failed to send message. Please try again.",
        }
      )
    }
  }

  return (
    <Card className="
      flex flex-col gap-6 sm:gap-8 lg:gap-10 justify-around 
      bg-white/80 dark:bg-white/10 backdrop-blur-sm 
      border-2 border-white dark:border-white/10 
      py-6 px-5
      sm:py-12.5 sm:px-10 md:p-8 lg:p-[70px] 
      rounded-[clamp(0.75rem,15vw,2rem)] 
      w-full min-w-sm max-w-md xs:min-w-xs sm:max-w-md md:min-w-xl md:max-w-2xl lg:max-w-3xl lg:h-auto min-h-[500px] 
      sm:min-h-[550px] md:min-h-[600px] lg:min-h-[683px] mx-4 sm:mx-6 md:mx-8 lg:mx-0 
      shadow-[inset_0_0_20px_0_rgba(255,255,255,0.1)] drop-shadow">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 sm:space-y-7.5 lg:space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black dark:text-white text-sm sm:text-base font-medium">
                  Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your name"
                    {...field}
                    className="bg-white/80 dark:bg-black/40 border-gray-400/20 text-black dark:text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 min-h-[50px] sm:min-h-[55px] lg:min-h-[60px] rounded-[10px] sm:rounded-[12px] lg:rounded-[14px] text-sm sm:text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black dark:text-white text-sm sm:text-base font-medium">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    {...field}
                    className="bg-white/80 dark:bg-black/40 border-gray-400/20 text-black dark:text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 min-h-[50px] sm:min-h-[55px] lg:min-h-[60px] rounded-[10px] sm:rounded-[12px] lg:rounded-[14px] text-sm sm:text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black dark:text-white text-sm sm:text-base font-medium">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                    className="bg-white/80 dark:bg-black/40 border-gray-400/20 text-black dark:text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 min-h-[50px] sm:min-h-[55px] lg:min-h-[60px] rounded-[10px] sm:rounded-[12px] lg:rounded-[14px] text-sm sm:text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black dark:text-white text-sm sm:text-base font-medium">
                  Message
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Your message here"
                    {...field}
                    className="bg-white/80 dark:bg-black/40 border-gray-400/20 text-black dark:text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 min-h-[100px] sm:min-h-[110px] lg:min-h-[120px] resize-none rounded-[10px] sm:rounded-[12px] lg:rounded-[14px] text-sm sm:text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="pt-2 sm:pt-5">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-base sm:text-lg text-white font-semibold px-4 sm:px-6 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[50px] sm:min-h-[55px] lg:min-h-[60px]"
            >
              {isSubmitting ? "SENDING..." : "SUBMIT"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}