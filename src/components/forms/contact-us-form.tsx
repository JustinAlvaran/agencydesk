"use client"

import type React from "react"
import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"

export function ContactUsForm({ onSubmit }: ContactFormProps = {}) {
  const [agreed, setAgreed] = useState(false);
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
      if (onSubmit) {
        await onSubmit(data)
      } else {
        await submitContactForm(data)
      }

      toast(
        "Message Sent!",
        {
          description: "Thank you for your message. We'll get back to you soon.",
        }
      )

      form.reset()
    } catch {
      toast(
        "Error",
        {
          description: "Failed to send message. Please try again.",
        }
      )
    }
  }

  return (
    <div className="w-full flex justify-center items-center">
      <Card className="
        flex flex-col gap-7.5
        w-full 
        min-w-90
        max-w-200
        sm:min-w-100
        px-[clamp(1.25rem,2vw,2rem)] py-[clamp(3.125rem,2vw,3.75rem)]
        rounded-[clamp(1.25rem,4vw,2.5rem)] 
        backdrop-blur-sm 
        bg-white/40 
        dark:bg-white/10 
        border 
        border-white/10 
        shadow-[inset_0_0_20px_0_rgba(255,255,255,0.05)]
      ">
        <h3 className="font-bold font-montserrat text-[clamp(2.125rem,3vw,2.5rem)] text-center text-primary mb-[clamp(1.25rem,4vw,2.5rem)]">
          Contact Us
        </h3>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-[clamp(1.25rem,3vw,1.75rem)]">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[clamp(0.875rem,1.5vw,1rem)] text-black dark:text-white font-semibold">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your name"
                      {...field}
                      className="dark:bg-black/40 border-gray-400/20 text-black dark:text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 h-[clamp(2.5rem,5vw,3rem)] py-4 px-5 rounded-[clamp(0.5rem,1.5vw,0.75rem)] text-[clamp(0.875rem,1.5vw,1rem)] transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[clamp(0.75rem,1.5vw,0.875rem)]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[clamp(0.875rem,1.5vw,1rem)] text-black dark:text-white font-semibold">
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      {...field}
                      className="dark:bg-black/40 border-gray-400/20 text-black dark:text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 h-[clamp(2.5rem,5vw,3rem)] py-4 px-5 rounded-[clamp(0.5rem,1.5vw,0.75rem)] text-[clamp(0.875rem,1.5vw,1rem)] transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[clamp(0.75rem,1.5vw,0.875rem)]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[clamp(0.875rem,1.5vw,1rem)] text-black dark:text-white font-semibold">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                      className="dark:bg-black/40 border-gray-400/20 text-black dark:text-white placeholder:text-gray-400 h-[clamp(2.5rem,5vw,3rem)] py-4 px-5 rounded-[clamp(0.5rem,1.5vw,0.75rem)] text-[clamp(0.875rem,1.5vw,1rem)] transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[clamp(0.75rem,1.5vw,0.875rem)]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[clamp(0.875rem,1.5vw,1rem)] text-black dark:text-white font-semibold">
                    Message
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your message here"
                      {...field}
                      className="dark:bg-black/40 border-gray-400/20 text-black dark:text-white placeholder:text-gray-400 min-h-[clamp(6rem,20vw,8rem)] resize-none py-4 px-5 rounded-[clamp(0.5rem,1.5vw,0.75rem)] text-[clamp(0.875rem,1.5vw,1rem)] transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[clamp(0.75rem,1.5vw,0.875rem)]" />
                </FormItem>
              )}
            />

            <div className="pt-[clamp(0.5rem,2vw,1rem)]">
              <Button
                type="submit"
                disabled={isSubmitting || !agreed}
                className="w-full text-[clamp(0.875rem,1.8vw,1.125rem)] font-semibold text-white px-[clamp(1rem,3vw,2rem)] rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-[clamp(2.5rem,5vw,3rem)] hover:scale-[1.02]"
              >
                {isSubmitting ? "SENDING..." : "SUBMIT"}
              </Button>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox id="terms" className="rounded-full" onCheckedChange={() => setAgreed(!agreed)}/>
              <Label htmlFor="terms" className="line-clamp-2 leading-4 text-[clamp(0.8125rem,1.5vw,0.875rem)] text-black dark:text-white">
                I have read and accepted the 
                <Link className="text-primary" href="/terms-of-service"> Terms of Service</Link> & 
                <Link className="text-primary" href="/privacy-policy"> Privacy Policy</Link>.
              </Label>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
}