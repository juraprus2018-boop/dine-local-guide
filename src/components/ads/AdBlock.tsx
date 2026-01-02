import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AdBlockProps {
  placementType: 'homepage' | 'city' | 'detail_sidebar' | 'detail_content';
  className?: string;
}

export function AdBlock({ placementType, className }: AdBlockProps) {
  const adRef = useRef<HTMLDivElement>(null);

  // Fetch active ad for this placement type
  const { data: adPlacement } = useQuery({
    queryKey: ['ad-placement', placementType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_placements')
        .select('*')
        .eq('placement_type', placementType)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString().split('T')[0]}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    // If there's ad code, inject it
    if (adPlacement?.ad_code && adRef.current) {
      adRef.current.innerHTML = adPlacement.ad_code;
      
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
  }, [adPlacement?.ad_code]);

  // Don't render anything if no ad is configured
  if (!adPlacement?.ad_code) {
    return null;
  }

  return (
    <div 
      ref={adRef}
      className={cn(
        'ad-container overflow-hidden',
        className
      )}
    />
  );
}
