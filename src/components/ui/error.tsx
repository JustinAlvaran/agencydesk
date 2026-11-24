"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  message = "Something went wrong. Please try again later.",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center backdrop-blur-2xl text-white p-6">
      <Card className="max-w-md w-full bg-white/10 dark:bg-black/30 backdrop-blur-md border border-red-700/30 shadow-2xl rounded-2xl">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 animate-pulse" />
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
              Error Occurred
            </h1>
          </div>

          <p className="text-gray-200 dark:text-gray-400 text-lg">{message}</p>

          <div className="flex flex-col gap-3 w-full">
            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white transition-all"
              >
                Go Home
              </Button>
            </Link>

            <Link href="/contact">
              <Button
                variant="default"
                className="w-full bg-red-700 hover:bg-red-800 text-white dark:bg-red-600 dark:hover:bg-red-700 transition-all"
              >
                Contact Us
              </Button>
            </Link>
          </div>

          <small className="text-gray-400 dark:text-gray-500 mt-4">
            If you believe this is a mistake, please contact support.
          </small>
        </CardContent>
      </Card>
    </div>
  );
}
