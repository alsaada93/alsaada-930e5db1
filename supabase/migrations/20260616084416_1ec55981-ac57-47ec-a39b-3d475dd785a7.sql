select cron.unschedule(2);

select cron.schedule(
  'facebook-sync-cron',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://alsaada.lovable.app/api/public/facebook-sync-cron',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybmtybXFqaGpoZ3JueWxpaHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTM0NjAsImV4cCI6MjA5NTc4OTQ2MH0.WiKev-XUhuQd1yuELVkMuFCRLwHYuGK4qmsDgKpfM0w"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
