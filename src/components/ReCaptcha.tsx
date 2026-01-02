import { forwardRef, useImperativeHandle, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export interface ReCaptchaRef {
  getToken: () => string | null;
  reset: () => void;
}

interface ReCaptchaProps {
  onChange?: (token: string | null) => void;
  className?: string;
}

const ReCaptchaComponent = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ onChange, className }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    useImperativeHandle(ref, () => ({
      getToken: () => recaptchaRef.current?.getValue() || null,
      reset: () => recaptchaRef.current?.reset(),
    }));

    if (!RECAPTCHA_SITE_KEY) {
      console.warn('reCAPTCHA site key is not configured');
      return null;
    }

    return (
      <div className={className}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={onChange}
        />
      </div>
    );
  }
);

ReCaptchaComponent.displayName = 'ReCaptcha';

export default ReCaptchaComponent;
