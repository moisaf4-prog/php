import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | Layer7Top` : "Layer7Top - Layer 7 Stress Testing";
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
