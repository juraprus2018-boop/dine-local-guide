import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LesGMErAAAAANSzhGM295fLOdG36pGy9dEoR5Mg";

export interface ReCaptchaRef {
  getToken: () => string | null;
  reset: () => void;
}

interface ReCaptchaProps {
  onChange?: (token: string | null) => void;
  className?: string;
}

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) return resolve();

    const existing = document.getElementById("recaptcha-script") as
      | HTMLScriptElement
      | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "recaptcha-script";
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
    document.head.appendChild(script);
  });
}

const ReCaptchaComponent = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ onChange, className }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<number | null>(null);
    const [ready, setReady] = useState(false);

    const enabled = useMemo(() => Boolean(RECAPTCHA_SITE_KEY), []);

    useImperativeHandle(ref, () => ({
      getToken: () => {
        const widgetId = widgetIdRef.current ?? undefined;
        const token = window.grecaptcha?.getResponse(widgetId);
        return token || null;
      },
      reset: () => {
        const widgetId = widgetIdRef.current ?? undefined;
        window.grecaptcha?.reset(widgetId);
        onChange?.(null);
      },
    }));

    useEffect(() => {
      if (!enabled) {
        console.warn("reCAPTCHA site key is not configured");
        return;
      }

      let cancelled = false;

      loadRecaptchaScript()
        .then(() => {
          if (cancelled) return;
          setReady(true);
        })
        .catch((e) => {
          console.error(e);
        });

      return () => {
        cancelled = true;
      };
    }, [enabled]);

    useEffect(() => {
      if (!enabled) return;
      if (!ready) return;
      if (!containerRef.current) return;
      if (!window.grecaptcha) return;
      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token) => onChange?.(token),
        "expired-callback": () => onChange?.(null),
        "error-callback": () => onChange?.(null),
      });
    }, [enabled, ready, onChange]);

    if (!enabled) return null;

    return (
      <div className={className}>
        <div ref={containerRef} />
      </div>
    );
  }
);

ReCaptchaComponent.displayName = "ReCaptcha";

export default ReCaptchaComponent;
