function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Apply the saved theme before first paint to prevent a design flicker */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />

        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8756700125021106"
          crossOrigin="anonymous"
        />

        <HeadContent />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
