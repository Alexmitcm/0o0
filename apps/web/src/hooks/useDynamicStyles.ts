import { useEffect } from "react";

/**
 * Hook for applying dynamic styles via data attributes
 */
export const useDynamicStyles = () => {
  const applyDynamicStyles = (element: HTMLElement) => {
    // Apply progress bar styles
    const progressBars = element.querySelectorAll("[data-progress]");
    progressBars.forEach((bar) => {
      const progress = bar.getAttribute("data-progress");
      if (progress) {
        (bar as HTMLElement).style.setProperty(
          "--progress-width",
          `${progress}%`
        );
      }
    });

    // Apply aspect ratio styles
    const aspectRatioElements = element.querySelectorAll("[data-aspect-ratio]");
    aspectRatioElements.forEach((el) => {
      const aspectRatio = el.getAttribute("data-aspect-ratio");
      if (aspectRatio) {
        (el as HTMLElement).style.setProperty("--aspect-ratio", aspectRatio);
      }
    });

    // Apply max height styles
    const maxHeightElements = element.querySelectorAll("[data-max-height]");
    maxHeightElements.forEach((el) => {
      const maxHeight = el.getAttribute("data-max-height");
      if (maxHeight) {
        (el as HTMLElement).style.setProperty("--max-height", maxHeight);
      }
    });

    // Apply max width styles
    const maxWidthElements = element.querySelectorAll("[data-max-width]");
    maxWidthElements.forEach((el) => {
      const maxWidth = el.getAttribute("data-max-width");
      if (maxWidth) {
        (el as HTMLElement).style.setProperty("--max-width", maxWidth);
      }
    });
  };

  return { applyDynamicStyles };
};

/**
 * Hook for applying dynamic styles to a specific element
 */
export const useElementDynamicStyles = (
  elementRef: React.RefObject<HTMLElement>
) => {
  const { applyDynamicStyles } = useDynamicStyles();

  useEffect(() => {
    if (elementRef.current) {
      applyDynamicStyles(elementRef.current);
    }
  }, [elementRef, applyDynamicStyles]);
};

/**
 * Hook for applying dynamic styles to all elements with data attributes
 */
export const useGlobalDynamicStyles = () => {
  const { applyDynamicStyles } = useDynamicStyles();

  useEffect(() => {
    // Apply to all elements on mount
    applyDynamicStyles(document.body);

    // Create observer for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            applyDynamicStyles(node as HTMLElement);
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [applyDynamicStyles]);
};
