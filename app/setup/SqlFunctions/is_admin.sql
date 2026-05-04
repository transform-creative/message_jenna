-- Function to decide if user is admin based on user_id
CREATE
OR REPLACE FUNCTION is_admin() RETURNS boolean language plpgsql SECURITY DEFINER AS $ $ declare user_role text;

BEGIN
SET
  search_path = '';

SELECT
  CAST(u.raw_user_meta_data ->> 'role' AS text)
FROM
  auth.users AS u INTO user_role
WHERE
  u.id = auth.uid()
LIMIT
  1;

IF user_role = 'admin' THEN RETURN TRUE;

END IF;

RETURN false;

END;

$ $;

--TESTING
--select * from is_admin()