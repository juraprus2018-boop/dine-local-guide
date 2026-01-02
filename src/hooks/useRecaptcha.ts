import { supabase } from '@/integrations/supabase/client';

export async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
      body: { token },
    });

    if (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }

    return data?.success === true;
  } catch (error) {
    console.error('Failed to verify reCAPTCHA:', error);
    return false;
  }
}
