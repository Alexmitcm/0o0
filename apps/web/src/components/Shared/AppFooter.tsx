import type React from "react";

interface AppFooterProps {
  className?: string;
  compact?: boolean;
  minimal?: boolean;
}

const AppFooter: React.FC<AppFooterProps> = ({
  className = "",
  compact = false,
  minimal = false
}) => {
  const currentYear = new Date().getFullYear();
  const isCompact = compact;

  const sectionTitleTokens = [
    isCompact ? "text-sm" : "text-base",
    "font-bold",
    "tracking-wide",
    "text-white",
    "hero-glow-text"
  ].join(" ");
  const linkTokens = [
    isCompact ? "text-sm" : "text-base",
    "font-medium",
    "text-white/85",
    "transition-all",
    "duration-200",
    "hover:text-white",
    "hover:hero-glow-text",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-purple-400/50",
    "rounded-lg",
    "px-2",
    "py-1"
  ].join(" ");
  const pillTokens = [
    "rounded-xl",
    "border",
    "border-purple-500/30",
    "bg-gradient-to-r",
    "from-purple-600/10",
    "to-cyan-600/10",
    isCompact ? "px-3" : "px-4",
    isCompact ? "py-1" : "py-2",
    isCompact ? "text-xs" : "text-sm",
    "font-medium",
    "text-white/85",
    "transition-all",
    "duration-200",
    "hover:border-purple-400/50",
    "hover:from-purple-600/20",
    "hover:to-cyan-600/20",
    "hover:text-white",
    "hover:shadow-lg",
    "hover:shadow-purple-500/25",
    "hero-glow-text",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-purple-400/50"
  ].join(" ");

  // Dynamic class tokens (kept as arrays to avoid class sorting lints for readability)
  const brandDescriptionTokens = [
    isCompact ? "mt-2" : "mt-3",
    "max-w-md",
    isCompact ? "text-sm" : "text-base",
    "font-medium",
    "text-white/80",
    "leading-relaxed",
    "hero-glow-text"
  ].join(" ");
  const brandNameTokens = [
    "font-bold",
    isCompact ? "text-lg" : "text-xl",
    "text-white",
    "tracking-wide",
    "hero-glow-text"
  ].join(" ");
  const navGridTokens = [
    "grid",
    "grid-cols-2",
    isCompact ? "gap-4" : "gap-6",
    "md:col-span-7",
    "md:grid-cols-4",
    "sm:grid-cols-3"
  ].join(" ");
  const subscribeButtonTokens = [
    "bg-gradient-to-r",
    "from-fuchsia-500",
    "to-cyan-400",
    "text-sm",
    "text-black",
    "px-4",
    "py-2",
    "rounded-lg",
    "font-medium",
    "shadow-[0_8px_24px_rgba(168,85,247,0.3)]",
    "hover:shadow-[0_10px_26px_rgba(168,85,247,0.45)]",
    "transition",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-white/30"
  ].join(" ");
  const copyrightTokens = [
    "truncate",
    "text-left",
    "text-sm",
    "font-medium",
    "text-white/80"
  ].join(" ");
  const dividerTokens = [
    "relative",
    "z-10",
    isCompact ? "mt-3" : "mt-6",
    "border-t",
    "border-white/10"
  ].join(" ");
  const bottomBarTokens = [
    "relative",
    "z-10",
    isCompact ? "mt-3" : "mt-4",
    "flex",
    "flex-wrap",
    "items-center",
    "justify-between",
    isCompact ? "gap-2" : "gap-3"
  ].join(" ");
  const backToTopButtonTokens = [
    "rounded-full",
    "border",
    "border-white/10",
    "bg-white/5",
    "px-3",
    "py-1",
    "text-xs",
    "text-white/80",
    "transition",
    "hover:bg-white/10",
    "hover:text-white",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-fuchsia-400/50"
  ].join(" ");

  const handleScrollTop = () => {
    window.scrollTo({ behavior: "smooth", top: 0 });
  };

  const SocialLink = ({
    href,
    label,
    children
  }: {
    href: string;
    label: string;
    children: React.ReactNode;
  }) => (
    <a
      aria-label={label}
      className={`inline-flex ${isCompact ? "h-10 w-10" : "h-11 w-11"} items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/50`}
      href={href}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          (e.currentTarget as HTMLAnchorElement).click();
        }
      }}
      rel="noreferrer noopener"
      tabIndex={0}
      target={href.startsWith("http") ? "_blank" : undefined}
    >
      {children}
    </a>
  );

  const FooterLink = ({ href, label }: { href: string; label: string }) => (
    <a
      aria-label={label}
      className={linkTokens}
      href={href}
      rel="noreferrer noopener"
      target={href.startsWith("http") ? "_blank" : undefined}
    >
      {label}
    </a>
  );

  // dynamic paddings
  const containerPaddingY = minimal
    ? "py-3"
    : isCompact
      ? "py-4 md:py-5"
      : "py-8 md:py-10";

  // Minimal bar-like footer (single compact row)
  if (minimal) {
    return (
      <footer
        className={[
          "w-full",
          "bg-black",
          "border-t",
          "border-white/10",
          "shadow-none",
          "antialiased",
          className
        ].join(" ")}
      >
        <div
          className={[
            "relative",
            "mx-auto",
            "w-full",
            "max-w-7xl",
            "px-3",
            containerPaddingY,
            "md:px-4"
          ].join(" ")}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-fuchsia-500/80 via-violet-400/80 to-cyan-400/80 p-px">
                <div className="h-full w-full rounded-[10px] bg-black" />
              </div>
              <span className="font-semibold text-white">0X Arena</span>
            </div>
            <div className="flex items-center gap-2">
              <SocialLink
                href="https://twitter.com/intent/follow?screen_name=heyxyz"
                label="Follow on X"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2h3.356l-7.33 8.382L23 22h-6.68l-4.53-6.07L5.57 22H2.214l7.73-8.85L1 2h6.86l4.118 5.59L18.244 2Zm-1.17 18h1.86L7.01 4h-1.9l11.964 16Z" />
                </svg>
              </SocialLink>
              <SocialLink
                href="https://discord.com/invite/heyxyz"
                label="Join our Discord"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.369A19.791 19.791 0 0 0 16.557 3c-.2.35-.43.822-.589 1.19a18.55 18.55 0 0 0-7.936 0C7.873 3.82 7.64 3.35 7.44 3a19.792 19.792 0 0 0-3.76 1.369C.43 9.203-.258 13.94.082 18.622A19.974 19.974 0 0 0 6.29 21c.492-.676 1.01-1.476 1.377-2.216-.758.285-1.542.49-2.356.606.2-.144.395-.296.58-.456 4.52 2.11 9.418 2.11 13.93 0 .186.16.38.312.58.455-.814-.115-1.6-.32-2.357-.605.367.74.885 1.54 1.377 2.216a19.974 19.974 0 0 0 6.208-2.378c.34-4.681-.348-9.419-3.322-14.253ZM8.393 15.75c-1.087 0-1.975-.996-1.975-2.223 0-1.227.878-2.223 1.975-2.223 1.106 0 1.984.996 1.975 2.223 0 1.227-.869 2.223-1.975 2.223Zm7.214 0c-1.087 0-1.975-.996-1.975-2.223 0-1.227.878-2.223 1.975-2.223 1.106 0 1.984.996 1.975 2.223 0 1.227-.869 2.223-1.975 2.223Z" />
                </svg>
              </SocialLink>
              <SocialLink
                href="https://github.com/heyverse/hey"
                label="View on GitHub"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.589 2 12.253c0 4.546 2.865 8.396 6.839 9.756.5.096.682-.223.682-.498 0-.246-.01-1.065-.015-1.932-2.782.615-3.37-1.2-3.37-1.2-.454-1.175-1.11-1.49-1.11-1.49-.907-.635.07-.623.07-.623 1.004.072 1.532 1.055 1.532 1.055.892 1.562 2.341 1.111 2.91.85.092-.662.35-1.11.636-1.366-2.221-.258-4.555-1.138-4.555-5.064 0-1.118.39-2.033 1.03-2.75-.104-.258-.447-1.296.098-2.701 0 0 .84-.273 2.75 1.051A9.25 9.25 0 0 1 12 7.49c.85.004 1.707.116 2.506.34 1.91-1.324 2.748-1.051 2.748-1.051.547 1.405.204 2.443.1 2.7.64.718 1.028 1.633 1.028 2.751 0 3.935-2.338 4.803-4.566 5.056.36.322.68.957.68 1.93 0 1.393-.012 2.514-.012 2.856 0 .277.18.598.688.496A10.01 10.01 0 0 0 22 12.254C22 6.589 17.523 2 12 2Z"
                    fillRule="evenodd"
                  />
                </svg>
              </SocialLink>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={[
        "w-full",
        "bg-transparent",
        "border-t",
        "border-white/10",
        "shadow-none",
        "antialiased",
        className
      ].join(" ")}
    >
      <div
        className={[
          "relative",
          "mx-auto",
          "w-full",
          "max-w-7xl",
          "px-3",
          containerPaddingY,
          "md:px-4"
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
        {!isCompact && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_200px_at_20%_0%,rgba(168,85,247,0.05),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
          </>
        )}

        <div
          className={[
            "relative",
            "z-10",
            "grid",
            "grid-cols-1",
            isCompact ? "gap-6" : "gap-8",
            "md:grid-cols-12"
          ].join(" ")}
        >
          {/* Brand & social */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-fuchsia-500/80 via-violet-400/80 to-cyan-400/80 p-px">
                <div className="h-full w-full rounded-[10px] bg-black" />
              </div>
              <span className={brandNameTokens}>0X Arena</span>
            </div>
            <p className={brandDescriptionTokens}>
              Redefining competitive gaming with a decentralized ecosystem for
              tournaments, creators, and communities.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <SocialLink
                href="https://twitter.com/intent/follow?screen_name=heyxyz"
                label="Follow on X"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2h3.356l-7.33 8.382L23 22h-6.68l-4.53-6.07L5.57 22H2.214l7.73-8.85L1 2h6.86l4.118 5.59L18.244 2Zm-1.17 18h1.86L7.01 4h-1.9l11.964 16Z" />
                </svg>
              </SocialLink>
              <SocialLink
                href="https://discord.com/invite/heyxyz"
                label="Join our Discord"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.369A19.791 19.791 0 0 0 16.557 3c-.2.35-.43.822-.589 1.19a18.55 18.55 0 0 0-7.936 0C7.873 3.82 7.64 3.35 7.44 3a19.792 19.792 0 0 0-3.76 1.369C.43 9.203-.258 13.94.082 18.622A19.974 19.974 0 0 0 6.29 21c.492-.676 1.01-1.476 1.377-2.216-.758.285-1.542.49-2.356.606.2-.144.395-.296.58-.456 4.52 2.11 9.418 2.11 13.93 0 .186.16.38.312.58.455-.814-.115-1.6-.32-2.357-.605.367.74.885 1.54 1.377 2.216a19.974 19.974 0 0 0 6.208-2.378c.34-4.681-.348-9.419-3.322-14.253ZM8.393 15.75c-1.087 0-1.975-.996-1.975-2.223 0-1.227.878-2.223 1.975-2.223 1.106 0 1.984.996 1.975 2.223 0 1.227-.869 2.223-1.975 2.223Zm7.214 0c-1.087 0-1.975-.996-1.975-2.223 0-1.227.878-2.223 1.975-2.223 1.106 0 1.984.996 1.975 2.223 0 1.227-.869 2.223-1.975 2.223Z" />
                </svg>
              </SocialLink>
              <SocialLink
                href="https://github.com/heyverse/hey"
                label="View on GitHub"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.589 2 12.253c0 4.546 2.865 8.396 6.839 9.756.5.096.682-.223.682-.498 0-.246-.01-1.065-.015-1.932-2.782.615-3.37-1.2-3.37-1.2-.454-1.175-1.11-1.49-1.11-1.49-.907-.635.07-.623.07-.623 1.004.072 1.532 1.055 1.532 1.055.892 1.562 2.341 1.111 2.91.85.092-.662.35-1.11.636-1.366-2.221-.258-4.555-1.138-4.555-5.064 0-1.118.39-2.033 1.03-2.75-.104-.258-.447-1.296.098-2.701 0 0 .84-.273 2.75 1.051A9.25 9.25 0 0 1 12 7.49c.85.004 1.707.116 2.506.34 1.91-1.324 2.748-1.051 2.748-1.051.547 1.405.204 2.443.1 2.7.64.718 1.028 1.633 1.028 2.751 0 3.935-2.338 4.803-4.566 5.056.36.322.68.957.68 1.93 0 1.393-.012 2.514-.012 2.856 0 .277.18.598.688.496A10.01 10.01 0 0 0 22 12.254C22 6.589 17.523 2 12 2Z"
                    fillRule="evenodd"
                  />
                </svg>
              </SocialLink>
            </div>
          </div>

          {/* Navigation */}
          <div className={navGridTokens}>
            <div>
              <h4 className={sectionTitleTokens}>Product</h4>
              <div className="mt-3 flex flex-col gap-2">
                <FooterLink href="/explore" label="Explore" />
                <FooterLink href="/tournaments" label="Tournaments" />
                <FooterLink href="/docs" label="Documentation" />
                <FooterLink href="/pricing" label="Pricing" />
              </div>
            </div>
            <div>
              <h4 className={sectionTitleTokens}>Resources</h4>
              <div className="mt-3 flex flex-col gap-2">
                <FooterLink href="/blog" label="Blog" />
                <FooterLink href="/guides" label="Guides" />
                <FooterLink href="/status" label="Status" />
                <FooterLink href="/api" label="API" />
              </div>
            </div>
            <div>
              <h4 className={sectionTitleTokens}>Community</h4>
              <div className="mt-3 flex flex-col gap-2">
                <FooterLink
                  href="https://discord.com/invite/heyxyz"
                  label="Discord"
                />
                <FooterLink
                  href="https://twitter.com/heyxyz"
                  label="X / Twitter"
                />
                <FooterLink href="/u/hey" label="Hey Profile" />
                <FooterLink
                  href="https://github.com/heyverse/hey"
                  label="GitHub"
                />
              </div>
            </div>
            <div>
              <h4 className={sectionTitleTokens}>Legal</h4>
              <div className="mt-3 flex flex-col gap-2">
                <FooterLink href="/privacy" label="Privacy Policy" />
                <FooterLink href="/cookies" label="Cookie Policy" />
                <FooterLink href="/terms" label="Terms & Conditions" />
                <FooterLink href="/guidelines" label="Community Guidelines" />
              </div>
            </div>
          </div>

          {/* Newsletter (hidden in compact or minimal) */}
          {!isCompact && (
            <div className="md:col-span-12 lg:col-span-12">
              <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h5 className="font-medium text-sm text-white">
                      Stay in the loop
                    </h5>
                    <p className="mt-1 text-white/70 text-xs">
                      Get updates on tournaments, features, and exclusive drops.
                    </p>
                  </div>
                  <form
                    aria-label="Newsletter subscription form"
                    className="flex w-full max-w-md items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <label className="sr-only" htmlFor="newsletter-email">
                      Email address
                    </label>
                    <input
                      aria-describedby="newsletter-desc"
                      aria-label="Email address"
                      className="flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-400/30"
                      id="newsletter-email"
                      name="email"
                      placeholder="you@example.com"
                      required
                      type="email"
                    />
                    <button
                      aria-label="Subscribe"
                      className={subscribeButtonTokens}
                      type="submit"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={dividerTokens} />

        {/* Bottom bar */}
        <div className={bottomBarTokens}>
          <div className="flex items-center gap-3">
            <img
              alt="0X Arena"
              className="h-6 w-6"
              src="/logo.png"
              style={{
                filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))"
              }}
            />
            <p className={copyrightTokens}>
              © {currentYear} 0X Arena. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a className={pillTokens} href="/tournaments">
              Tournaments
            </a>
            <a className={pillTokens} href="/docs">
              Documentation
            </a>
            <a className={pillTokens} href="/support">
              Support
            </a>
            <button
              aria-label="Back to top"
              className={backToTopButtonTokens}
              onClick={handleScrollTop}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleScrollTop();
              }}
              tabIndex={0}
              type="button"
            >
              ↑ Back to top
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <style>{`
          @keyframes footerGlow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          @media (prefers-reduced-motion: reduce) { [data-anim="footer"]{animation: none !important;} }
        `}</style>
      </div>
    </footer>
  );
};

export default AppFooter;
