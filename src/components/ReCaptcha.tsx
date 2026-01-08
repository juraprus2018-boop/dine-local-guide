import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

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
      // v2 (explicit) API
      render?: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      getResponse?: (widgetId?: number) => string;
      reset?: (widgetId?: number) => void;

      // sometimes reCAPTCHA is exposed under grecaptcha.enterprise
      enterprise?: {
        render?: (
          container: HTMLElement,
          parameters: {
            sitekey: string;
            callback?: (token: string) => void;
            "expired-callback"?: () => void;
            "error-callback"?: () => void;
          }
        ) => number;
        getResponse?: (widgetId?: number) => string;
        reset?: (widgetId?: number) => void;
      };

      // v3 API may exist if a third-party script (e.g. ads) loaded it
      ready?: (cb: () => void) => void;
      execute?: (siteKey: string, options?: { action?: string }) => Promise<string>;
    };

    // internal onload callback (set by this component)
    __happioRecaptchaOnload?: () => void;
  }
}

function getExplicitGrecaptcha() {
  const g = window.grecaptcha;
  if (g && typeof g.render === "function") return g;
  if (g?.enterprise && typeof g.enterprise.render === "function") return g.enterprise;
  return null;
}

function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (getExplicitGrecaptcha()) return resolve();

    let done = false;
    const finish = (err?: Error) => {
      if (done) return;
      done = true;
      if (err) reject(err);
      else resolve();
    };

    // Poll for the explicit API (covers cases where another script overwrote grecaptcha)
    const startedAt = Date.now();
    const poll = () => {
      if (getExplicitGrecaptcha()) return finish();
      if (Date.now() - startedAt > 8000) {
        return finish(
          new Error(
            "reCAPTCHA kon niet laden (render ontbreekt). Mogelijk heeft een advertentie-script reCAPTCHA v3 geladen."
          )
        );
      }
      setTimeout(poll, 100);
    };

    // If we already inserted our explicit script, just start polling.
    const existing = document.getElementById("recaptcha-script-explicit") as
      | HTMLScriptElement
      | null;
    if (existing) {
      poll();
      return;
    }

    // Insert explicit (v2) loader. The onload callback helps when the script is cached.
    window.__happioRecaptchaOnload = () => {
      // don't resolve immediately; poll ensures render exists
      poll();
    };

    const script = document.createElement("script");
    script.id = "recaptcha-script-explicit";
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=__happioRecaptchaOnload&render=explicit";
    script.async = true;
    script.defer = true;
    script.onerror = () => finish(new Error("Failed to load reCAPTCHA script"));
    document.head.appendChild(script);

    poll();
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
        const api = getExplicitGrecaptcha();
        const widgetId = widgetIdRef.current ?? undefined;
        const token = api?.getResponse?.(widgetId);
        return token || null;
      },
      reset: () => {
        const api = getExplicitGrecaptcha();
        const widgetId = widgetIdRef.current ?? undefined;
        api?.reset?.(widgetId);
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
      if (widgetIdRef.current !== null) return;

      const api = getExplicitGrecaptcha();
      if (!api?.render) return;

      widgetIdRef.current = api.render(containerRef.current, {
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
