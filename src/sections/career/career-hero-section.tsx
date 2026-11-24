"use client";
import React from "react";
import Image from "next/image";
import SearchBar from "@/components/ui/search-bar";

type Props = {
  headline: string;
  subheadline: string;
  heroImage: string;
  onSearch: (query: string) => void;
  onClear: () => void;
};

const CareerHeroSection = (props: Props) => {
  const words = props.headline.trim().split(" ");
  const lastWord = words.pop();
  const firstPart = words.join(" ");

  return (
    <section className="relative w-screen h-screen flex flex-col justify-center items-center overflow-hidden">
      <Image
        src={props.heroImage}
        alt="Career Hero Section Background Image"
        className="absolute object-cover aspect-video grayscale -z-10"
        fill
      />
      <div className="absolute h-screen w-screen bg-linear-to-b from-white/85 via-white/40 to-white/85 dark:from-black/95 dark:via-black/75 dark:to-black/95" />

      <h1 className="text-[clamp(2.75rem,2.5vw,5rem)] font-bold font-montserrat z-20 text-center sm:px-5 sm:max-w-100 md:max-w-none">
        {firstPart}
        <span className="text-primary"> {lastWord}</span>
      </h1>
      <h2 className="text-[clamp(1rem,1.5vw,1.5rem)] text-center 2xl:font-medium font-lato z-20 sm:max-w-100 md:max-w-none">
        {props.subheadline}
      </h2>

      {/* Search bar now calls parent onSearch */}
      <SearchBar
        onSearch={props.onSearch}
        onClear={props.onClear}
        className="translate translate-y-10"
      />
    </section>
  );
};

export default CareerHeroSection;
