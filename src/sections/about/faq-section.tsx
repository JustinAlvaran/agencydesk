"use client"
import React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useState, useEffect } from "react";
import { fetchFAQs, type FAQItem } from "@/utils/getFAQ";
import Loader from "@/components/ui/loader";
import ErrorPage from "@/components/ui/error";

const FaqSection = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        setLoading(true);
        const data = await fetchFAQs();
        setFaqs(data);
      } catch (err) {
        console.error("Failed to load FAQs:", err);
        setError("Failed to load FAQs");
      } finally {
        setLoading(false);
      }
    };

    loadFAQs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorPage />
    )
  }

  return (
    <section
      data-testid="faq-section"
      className="
        flex flex-col items-center justify-center
        w-full bg-transparent backdrop-blur-2xl
        py-12 sm:py-16 md:py-20 lg:py-[100px]
        px-5 sm:px-8 md:px-12 lg:px-[100px]
      "
    >
      {/* Heading */}
      <div className="max-w-4xl text-center space-y-3 sm:space-y-4 mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300">
          Got questions? We&apos;ve got answers!
        </p>
      </div>

      {/* Accordion Section */}
      <div
        className="
          w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl
          flex flex-col justify-center items-center space-y-3 sm:space-y-4 md:space-y-6
        "
      >
        <Accordion
          type="single"
          collapsible
          defaultValue="item-1"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index + 1}`}
            >
              <AccordionTrigger className="h-[clamp(52px,15vw,105px)] w-full">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="w-full">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export default FaqSection
