import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AdBlockProps {
  placementType: 'homepage' | 'city' | 'detail_sidebar' | 'detail_content';
  className?: string;
  adCode?: string;
}

export function AdBlock({ placementType, className, adCode }: AdBlockProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If there's ad code, inject it
    if (adCode && adRef.current) {
      adRef.current.innerHTML = adCode;
      
      // Execute any scripts in the ad code
      const scripts = adRef.current.querySelectorAll('script');
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = script.textContent;
        script.parentNode?.replaceChild(newScript, script);
      });
    }
  }, [adCode]);

  // Placeholder styles based on placement type
  const placementStyles = {
    homepage: 'h-[250px] w-full',
    city: 'h-[250px] w-full',
    detail_sidebar: 'h-[300px] w-full',
    detail_content: 'h-[90px] w-full',
  };

  if (!adCode) {
    // Show placeholder when no ad is configured
    return (
      <div 
        className={cn(
          'bg-muted/50 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm',
          placementStyles[placementType],
          className
        )}
      >
        <span>Advertentieruimte</span>
      </div>
    );
  }

  return (
    <div 
      ref={adRef}
      className={cn(
        'ad-container overflow-hidden rounded-lg',
        placementStyles[placementType],
        className
      )}
    />
  );
}
