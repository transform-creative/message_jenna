-- Create a function that queries stripe for recent checkout sessions
------------------------------------------------------------------------
-- Generate the type
CREATE TYPE stripe_checkout_session_min AS (
  id text,
  created integer,
  currency text,
  customer_details jsonb,
  metadata jsonb,
  status text,
  MODE text,
  amount_total bigint,
  subscription jsonb,
  line_items jsonb,
  product_order jsonb
);

-- Generate the function
CREATE
OR REPLACE FUNCTION public.get_stripe_checkout_sessions () 
RETURNS setof stripe_checkout_session_min 
language plpgsql 
SECURITY DEFINER
SET search_path = stripe stable AS $ $ BEGIN
  
  IF NOT public.is_admin() 
  THEN raise exception 'forbidden' 
  USING errcode = '42501';

END IF;

RETURN query
SELECT
  cs.id,
  cs.created,
  cs.currency,
  cs.customer_details,
  cs.metadata,
  cs.status,
  cs.mode,
  cs.amount_total,
  (
    SELECT
      (
        jsonb_build_object(
          'id',
          s.id,
          'interval',
          (s.plan :: jsonb) ->> 'interval'
        )
      )
    FROM
      stripe.subscriptions s
    WHERE
      s.id = cs.subscription
  ) AS subscriptions,
  (
    SELECT
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id',
            li.id,
            'name',
            li.description,
            'quantity',
            li.quantity,
            'cost',
            li.amount_total
          )
          ORDER BY
            li.id
        ),
        '[]' :: jsonb
      )
    FROM
      stripe.checkout_session_line_items li
    WHERE
      li.checkout_session = cs.id
  ) AS line_items,
  (
    SELECT
      jsonb_build_object()
  ) AS product_order
FROM
  stripe.checkout_sessions AS cs
WHERE
  STATUS != 'expired'
  AND STATUS != 'open'
  AND NOW() <= to_timestamp(cs.created) :: timestamptz + INTERVAL '1 year'
ORDER BY
  cs.created DESC
LIMIT
  500;

END;

$ $;

-- Test the function (should fail if no impersonating an admin user)
SELECT
  *
FROM
  public.get_stripe_checkout_sessions () -- drop function public.get_stripe_checkout_sessions;
  -- drop type stripe_checkout_session_min;