"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import { FiClock, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import SocialIcon from "@/components/ui/social-icon";

interface Contacts {
  title: string;
  link: string;
  icon: string;
}

interface FooterProps {
  quicklinks: { title: string; link: string }[];
  services: { title: string; link: string }[];
  contacts: Contacts[];
}

const Footer = ({ quicklinks, services, contacts }: FooterProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "mail":
        return <FiMail className="text-primary shrink-0" />;
      case "phone":
        return <FiPhone className="text-primary shrink-0" />;
      case "location":
        return <FiMapPin className="text-primary shrink-0" />;
      case "clock":
        return <FiClock className="text-primary shrink-0" />;
      default:
        return null;
    }
  };

  if (!mounted) return null;

  return (
    <footer className="w-full border-t border-gray-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md py-16 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 justify-between">
        
        {/* Brand Info */}
        <div className="flex flex-col items-center lg:items-start gap-6 max-w-sm">
          <Link href="/" className="inline-block">
            <Image
              src="/logo/wordmark-dark.svg"
              alt="AgencyDesk"
              width={220}
              height={56}
              className="dark:block hidden w-44 h-auto"
            />
            <Image
              src="/logo/wordmark-light.svg"
              alt="AgencyDesk"
              width={220}
              height={56}
              className="dark:hidden block w-44 h-auto"
            />
          </Link>
          <p className="text-center lg:text-start text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            The complete operating system for modern digital agencies. Capture client inquiries, publish versioned proposals, track project milestones, and automate team delivery.
          </p>
          <div className="flex items-center gap-3">
            <SocialIcon icon={<FaGithub className="text-white"/>} link="https://github.com/JustinAlvaran/agencydesk" ariaLabel="GitHub" />
            <SocialIcon icon={<FaTwitter className="text-white"/>} link="#" ariaLabel="Twitter" />
            <SocialIcon icon={<FaLinkedinIn className="text-white"/>} link="#" ariaLabel="LinkedIn" />
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          
          {/* Quick Links */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
              Platform &amp; Tools
            </h3>
            <div className="flex flex-col gap-2.5 text-center sm:text-start text-xs font-medium text-gray-600 dark:text-gray-400">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <Link href="/crm" className="hover:text-primary transition-colors">CRM Workspace</Link>
              <Link href="/crm/leads" className="hover:text-primary transition-colors">Pipeline Kanban</Link>
              <Link href="/portal" className="hover:text-primary transition-colors">Client Portal</Link>
              <Link href="/inquire" className="hover:text-primary transition-colors">Start Inquiry</Link>
              <Link href="/about" className="hover:text-primary transition-colors">About AgencyDesk</Link>
            </div>
          </div>

          {/* Capabilities */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
              Agency Services
            </h3>
            <div className="flex flex-col gap-2.5 text-center sm:text-start text-xs font-medium text-gray-600 dark:text-gray-400">
              {services?.slice(0, 5).map((service, i) => (
                <Link key={i} href={service.link} className="hover:text-primary transition-colors line-clamp-1">
                  {service.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
              Client Delivery
            </h3>
            <div className="flex flex-col gap-3 text-center sm:text-start text-xs font-medium text-gray-600 dark:text-gray-400">
              {contacts?.map((item, i) => (
                <div key={i} className="flex items-center justify-center sm:justify-start gap-2.5">
                  {renderIcon(item.icon)}
                  {item.link.startsWith("mailto:") || item.link.startsWith("tel:") ? (
                    <a href={item.link} className="hover:text-primary transition-colors">
                      {item.title}
                    </a>
                  ) : (
                    <span>{item.title}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-500 gap-4">
        <p>&copy; {new Date().getFullYear()} AgencyDesk. Modern Agency Operations &amp; Client Delivery.</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="/crm" className="hover:text-primary transition-colors">Staff Portal</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
