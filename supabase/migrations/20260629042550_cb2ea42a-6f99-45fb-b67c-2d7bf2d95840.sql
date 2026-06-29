-- Store the Facebook cron secret in the vault so pg_cron can send it
DO $$
DECLARE
  v_secret text := '12c8e02f8daa4113d0c2c0fe3842814ad53c971f22fbb39f';
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'facebook_cron_secret') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'facebook_cron_secret'),
      v_secret
    );
  ELSE
    PERFORM vault.create_secret(v_secret, 'facebook_cron_secret', 'Auth bearer for facebook-sync-cron endpoint');
  END IF;
END $$;

-- Update the Facebook sync cron job to authenticate with the cron secret
SELECT cron.alter_job(
  job_id := 3,
  command := $job$
  select net.http_post(
    url := 'https://alsaada.lovable.app/api/public/facebook-sync-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'facebook_cron_secret'
      )
    ),
    body := '{}'::jsonb
  ) as request_id;
  $job$
);