/**
 * Represents the reCAPTCHA Standard (v2/v3) API.
 */
interface GrecaptchaStandard {
    render: (
      container: HTMLElement | string,
      parameters: {
        sitekey: string;
        callback: (token: string) => void;
      }
    ) => void;
    execute: (siteKey: string, options?: { action: string }) => Promise<string>;
    ready?: (callback: () => void) => void;
  }
  
  /**
   * Represents the reCAPTCHA Enterprise API.
   */
  interface GrecaptchaEnterprise {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  }
  
  /**
   * Declares the global window object properties for reCAPTCHA.
   * This unified type allows 'grecaptcha' to be either the Standard API
   * or an object containing the Enterprise API under the 'enterprise' key.
   */
  declare global {
    interface Window {
      /**
       * The global reCAPTCHA object.
       * It can have Standard v2/v3 properties (`render`, `execute`) directly,
       * AND it can optionally have an `enterprise` property for the Enterprise API.
       */
      grecaptcha?: GrecaptchaStandard & {
        enterprise?: GrecaptchaEnterprise;
      };
  
      /**
       * Callback function for the reCAPTCHA Standard v2 script.
       */
      onRecaptchaLoad?: () => void;
    }
  }
  
  export {};