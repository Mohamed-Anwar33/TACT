-- Create function to lookup email by phone number
CREATE OR REPLACE FUNCTION public.get_auth_email_by_phone(phone_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_email text;
  normalized_phone text;
BEGIN
  -- Normalize Egypt phone number: remove non-digits, leading zeros, +20, etc.
  -- 1. Remove all non-digit characters
  normalized_phone := regexp_replace(phone_input, '\D', '', 'g');
  -- 2. Strip leading country code if present
  IF normalized_phone LIKE '0020%' THEN
    normalized_phone := substring(normalized_phone from 5);
  ELSIF normalized_phone LIKE '20%' THEN
    normalized_phone := substring(normalized_phone from 3);
  END IF;
  -- 3. Strip leading zero if present
  IF normalized_phone LIKE '0%' THEN
    normalized_phone := substring(normalized_phone from 2);
  END IF;

  -- Search in public.profiles table by matching normalized variations
  SELECT email INTO found_email
  FROM public.profiles
  WHERE 
    regexp_replace(phone, '\D', '', 'g') = '20' || normalized_phone
    OR regexp_replace(phone, '\D', '', 'g') = normalized_phone
  LIMIT 1;

  -- Return the found email, or NULL if not found
  RETURN found_email;
END;
$$;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_email_by_phone(text) TO anon, authenticated;
