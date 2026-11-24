"use client";

import React from "react";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

const NewsLetterSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
});

type NewsletterValues = z.infer<typeof NewsLetterSchema>;

const NewLetterSection = () => {

  const form = useForm<NewsletterValues>({
    resolver: zodResolver(NewsLetterSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const onSubmit = async () => {
    toast.info("Newsletter subscriptions are not open yet.");
  };

  return (
    <div 
      id="newsletter" 
      className="flex flex-col justify-center items-center bg-transparent py-20 px-4 sm:px-8 w-full max-w-5xl mx-auto"
    >
      <div className="relative w-full rounded-3xl bg-white/70 dark:bg-zinc-950/80 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 p-8 sm:p-14 text-center shadow-2xl overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Stay Ahead
          </span>
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2 leading-tight">
            Agency Insights &amp; Product Updates
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 font-lato leading-relaxed max-w-lg">
            Join agency founders, technical leads, and product operators receiving our monthly teardowns on agency scaling, pipeline optimization, and AI automation.
          </p>

          <div className="w-full max-w-md mt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          aria-label="Email address" disabled placeholder="Enter your work email..."
                          {...field}
                          className="h-12 px-4 rounded-full bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-sm focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-primary mt-1 text-left" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled
                  className="h-12 px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 shrink-0"
                >
                  Subscriptions coming soon
                  <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            </Form>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-4">
            Subscriptions will open when email delivery is configured.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewLetterSection;
