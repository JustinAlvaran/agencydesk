import React from "react";

interface ResponsiveSectionProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string; // Optional: control max width (e.g., 'max-w-screen-xl')
}

const ResponsiveSectionWrapper: React.FC<ResponsiveSectionProps> = ({
  children,
  className = "",
  maxWidth = "max-w-screen-2xl",
}) => {
  return (
    <section className={`w-full flex justify-center ${className}`}>
      <div
        className={`
          w-full ${maxWidth}
          px-4 py-8            /* Base (mobile) */
          sm:px-6 sm:py-12     /* Small screens */
          md:px-8 md:py-16     /* Tablets */
          lg:px-12 lg:py-20    /* Laptops */
          xl:px-16 xl:py-24    /* Desktops */
          2xl:px-20 2xl:py-28  /* Large desktops */
          3xl:px-[100px] 3xl:py-[100px] /* Ultra-wide displays */
        `}
      >
        {children}
      </div>
    </section>
  );
};

export default ResponsiveSectionWrapper;
