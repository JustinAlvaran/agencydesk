"use client";

import { useState, useEffect, useCallback } from 'react';

// NOTE: All 'declare global' blocks are REMOVED 
// because they are now in 'types/recaptcha.d.ts'

/**
 * Props for the useRecaptchaEnterprise hook.
 */
interface UseRecaptchaProps {
  /** The public reCAPTCHA Enterprise Site Key. */
  siteKey: string;
}

/**
 * A hook to manage the Google reCAPTCHA Enterprise script.
 * * This hook handles:
 * 1. Dynamically loading the reCAPTCHA script.
 * 2. Reporting when the script is ready to be used.
 * 3. Providing a function to generate a new token on demand.
 *
 * @example
 * const { isCaptchaReady, getRecaptchaToken } = useRecaptchaEnterprise({
 * siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!
 * });
 */
export const useRecaptchaEnterprise = ({ siteKey }: UseRecaptchaProps) => {
  const [isCaptchaReady, setIsCaptchaReady] = useState(false);

  // Load the Enterprise script
  useEffect(() => {
    // Prevent script from being added multiple times
    if (document.getElementById('recaptcha-enterprise-script')) {
      // If script is already present, just check for readiness
      window.grecaptcha?.enterprise?.ready(() => setIsCaptchaReady(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'recaptcha-enterprise-script';
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // This is now type-safe and correct!
      window.grecaptcha?.enterprise?.ready(() => {
        setIsCaptchaReady(true);
        console.log('reCAPTCHA Enterprise is ready.');
      });
    };

    document.head.appendChild(script);

    // Cleanup: remove the script when the component unmounts
    return () => {
      const scriptEl = document.getElementById('recaptcha-enterprise-script');
      if (scriptEl) {
        document.head.removeChild(scriptEl);
      }
    };
  }, [siteKey]);

  /**
   * Generates a new reCAPTCHA token for a specific action.
   * Call this function immediately before submitting our form.
   *
   * @param {string} action - A string identifying the action (e.g., "SUBMIT_APPLICATION").
   * @returns {Promise<string | null>} A promise that resolves with the token, or null if an error occurs.
   */
  const getRecaptchaToken = useCallback(async (action: string): Promise<string | null> => {
    // This is also now type-safe!
    if (!isCaptchaReady || !window.grecaptcha?.enterprise) {
      console.error('reCAPTCHA is not ready or script not loaded.');
      return null;
    }

    try {
      // And this is type-safe!
      const token = await window.grecaptcha.enterprise.execute(siteKey, { action });
      return token;
    } catch (error) {
      console.error('Error generating reCAPTCHA token:', error);
      return null;
    }
  }, [isCaptchaReady, siteKey]);

  return { isCaptchaReady, getRecaptchaToken };
};