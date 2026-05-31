<header className="sticky top-0 z-50 border-b border-border bg-navy text-navy-foreground">
  <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-5">
    <Link to="/" className="flex shrink-0 items-center gap-4">
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
        <BrandLogo size={70} />
      </span>

      <span className="flex flex-col leading-tight">
        <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          السعادة ماركت
          <span className="hidden text-white/80 sm:inline"> | Al Saada Market</span>
        </span>

        <span className="hidden text-sm text-white/70 sm:block">
          شراء وبيع معدات المطاعم والأثاث والإلكترونيات في البحرين
        </span>
      </span>
    </Link>

    <div className="hidden flex-1 md:block">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: q.trim() || undefined } });
        }}
        className="relative"
      >
        <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("header.searchPlaceholder")}
          className="h-12 w-full rounded-xl border-0 bg-white/95 pe-10 ps-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>
    </div>

    <nav className="flex items-center gap-2">
      <button
        onClick={toggle}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold hover:bg-white/10"
      >
        <Globe className="h-4 w-4" />
        <span>{lang === "ar" ? "EN" : "ع"}</span>
      </button>

      <button className="hidden rounded-lg p-2 hover:bg-white/10 sm:block">
        <Heart className="h-5 w-5" />
      </button>

      <button className="hidden rounded-lg p-2 hover:bg-white/10 sm:block">
        <Bell className="h-5 w-5" />
      </button>

      <Link to="/login" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{t("header.login")}</span>
      </Link>

      <Link
        to="/add-listing"
        className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t("header.addListing")}</span>
      </Link>

      <button className="rounded-lg p-2 hover:bg-white/10 md:hidden">
        <Menu className="h-5 w-5" />
      </button>
    </nav>
  </div>
</header>;
