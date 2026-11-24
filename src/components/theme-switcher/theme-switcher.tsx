"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // avoids hydration mismatch

  const isDark = theme === "dark";

  return (
    <div className="flex items-center">
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="w-[clamp(1.5rem,2vw,1.875rem)] h-[clamp(1.5rem,2vw,1.875rem)] relative cursor-pointer"
      >
        <div
          className={`w-6 h-6 ${
            hovered
              ? "animate-rotate-swap-backward"
              : "animate-rotate-swap-forward"
          }`}
        >
          {hovered ? (
            isDark ? (
              <Image
                src="/theme-icons/lightmode.svg"
                alt="light preview"
                width={24}
                height={24}
              />
            ) : (
              <Image
                src="/theme-icons/darkmode-d.svg"
                alt="dark preview"
                width={24}
                height={24}
              />
            )
          ) : isDark ? (
            <Image
              src="/theme-icons/darkmode.svg"
              alt="darkmode"
              width={24}
              height={24}
            />
          ) : (
            <Image
              src="/theme-icons/lightmode-d.svg"
              alt="lightmode"
              width={24}
              height={24}
            />
          )}
        </div>
      </button>
    </div>
  );
}
