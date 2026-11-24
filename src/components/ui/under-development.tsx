"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FaTools, FaArrowLeft, FaHome } from 'react-icons/fa'
import { motion } from 'framer-motion'

interface UnderDevelopmentProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  estimatedCompletion?: string;
}

const UnderDevelopment: React.FC<UnderDevelopmentProps> = ({
  title = "Under Development",
  description = "We're working hard to bring you something amazing. This page is currently under development and will be available soon.",
  showBackButton = true,
  showHomeButton = true,
  estimatedCompletion
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30 dark:from-black dark:via-black dark:to-red-900/20 text-gray-900 dark:text-white px-4 py-16 lg:py-[150px]">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-white to-red-200/20 dark:from-red-900/10 dark:via-black dark:to-red-950/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-400/10 dark:bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 dark:bg-red-600/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <Image 
            src="/logo/logo-light.svg" 
            alt="CITC Logo" 
            width={120} 
            height={120} 
            className="mx-auto mb-6 dark:hidden"
          />
          <Image 
            src="/logo/logo-dark.svg" 
            alt="CITC Logo" 
            width={120} 
            height={120} 
            className="mx-auto mb-6 hidden dark:block"
          />
        </motion.div>

        {/* Construction Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto bg-red-500/20 border-red-500/40 dark:border-red-500/30 rounded-full flex items-center justify-center border-2">
              <FaTools className="text-4xl text-red-600 dark:text-red-500" />
            </div>
            {/* Animated dots */}
            <div className="absolute -top-2 -right-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-4 h-4 bg-red-600 dark:bg-red-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-gray-900 dark:text-white"
        >
          {title}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg xs:text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          {description}
        </motion.p>

        {/* Estimated Completion */}
        {estimatedCompletion && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-8"
          >
            <div className="inline-block bg-red-100/50 border-red-300/50 dark:bg-red-500/10 dark:border-red-500/30 border rounded-full px-6 py-3">
              <p className="text-red-700 dark:text-red-400 font-medium">
                Expected Launch: {estimatedCompletion}
              </p>
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mb-12"
        >
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 2, delay: 1.2 }}
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex flex-col xs:flex-row gap-4 justify-center items-center"
        >
          {showHomeButton && (
            <Link href="/">
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <FaHome className="text-lg" />
                Back to Home
              </Button>
            </Link>
          )}
          
          {showBackButton && (
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.history.back()}
              className="border-red-600/50 text-red-600 hover:bg-red-50 hover:border-red-600 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:border-red-500 px-8 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <FaArrowLeft className="text-lg" />
              Go Back
            </Button>
          )}
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800"
        >
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Have questions or need immediate assistance?
          </p>
          <Link 
            href="/contact" 
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors duration-300"
          >
            Contact our team →
          </Link>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/6 w-8 h-8 bg-red-400/20 dark:bg-red-500/20 rounded-lg"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/3 right-1/6 w-6 h-6 bg-red-500/20 dark:bg-red-400/20 rounded-full"
        />
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute top-1/2 right-1/4 w-4 h-4 bg-red-600/20 dark:bg-red-600/20 rounded-sm"
        />
      </div>
    </div>
  )
}

export default UnderDevelopment