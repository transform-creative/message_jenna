-- Used to set specific users as an admin
UPDATE
  auth.users AS u
SET
  raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
WHERE
  u.email IN ('isaacthelad2@gmail.com');

-- Testing
--select id, email, raw_user_meta_data from auth.users as u;