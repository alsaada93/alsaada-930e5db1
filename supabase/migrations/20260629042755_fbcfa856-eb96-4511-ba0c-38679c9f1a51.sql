SELECT cron.alter_job(
  job_id := 3,
  command := $job$
  select net.http_post(
    url := 'https://www.alsaada.sale/api/public/facebook-sync-cron',
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