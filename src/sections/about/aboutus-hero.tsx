import React from 'react';
import Image from 'next/image';

const AboutUsHero = () => {
  return (
    <section className="flex flex-col justify-center items-center gap-[clamp(1rem,3vw,3rem)] aboutus-hero-bg min-h-[60vh] lg:min-h-[75vh] w-full overflow-hidden px-[clamp(1rem,4vw,6rem)] text-center py-20">
      {/* Logo (light/dark modes) */}
      <div className="relative w-[clamp(16rem,40vw,32rem)] h-auto">
        <Image
          className="hidden dark:block w-full h-auto"
          src="/logo/wordmark-dark.svg"
          alt="AgencyDesk Wordmark"
          width={456}
          height={328}
          priority
        />
        <Image
          className="block dark:hidden w-full h-auto"
          src="/logo/wordmark-light.svg"
          alt="AgencyDesk Wordmark"
          width={456}
          height={328}
          priority
        />
      </div>

      {/* Subheading */}
      <p className="font-lato font-medium text-[clamp(1rem,2vw,1.375rem)] text-gray-800 dark:text-gray-200 max-w-2xl leading-relaxed">
        The Modern Operating System for High-Performing Digital Agencies &amp; Transparent Client Delivery
      </p>
    </section>
  );
};

export default AboutUsHero;
