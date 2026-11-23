"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

interface ScrollToTopProps {
  threshold?: number;
  className?: string;
  buttonClassName?: string;
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const ScrollToTop = ({
  threshold = 300,
  className,
  buttonClassName = "fixed right-4 bottom-20 z-50 rounded-full bg-yellow-400 p-2 text-gray-900 shadow-lg transition-colors duration-300 hover:bg-yellow-300",
}: ScrollToTopProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [threshold]);

  const button = isVisible ? (
    <button onClick={scrollToTop} className={buttonClassName} aria-label="Scroll to top">
      <ChevronUp size={24} />
    </button>
  ) : null;

  return className ? <div className={className}>{button}</div> : <>{button}</>;
};

export default ScrollToTop;
