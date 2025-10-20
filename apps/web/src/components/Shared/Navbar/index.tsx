import {
  BellIcon as BellOutline,
  BookmarkIcon as BookmarkOutline,
  GlobeAltIcon as GlobeOutline,
  HomeIcon as HomeOutline,
  PlayIcon as PlayOutline,
  TrophyIcon as TrophyOutline,
  UserCircleIcon,
  UserGroupIcon as UserGroupOutline
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellSolid,
  BookmarkIcon as BookmarkSolid,
  GlobeAltIcon as GlobeSolid,
  HomeIcon as HomeSolid,
  PlayIcon as PlaySolid,
  TrophyIcon as TrophySolid,
  UserGroupIcon as UserGroupSolid
} from "@heroicons/react/24/solid";
import { type MouseEvent, memo, type ReactNode, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import OnChainDashboard from "@/components/Shared/Navbar/NavItems/OnChainDashboard";
import Pro from "@/components/Shared/Navbar/NavItems/Pro";
import { Image, Tooltip } from "@/components/Shared/UI";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import SignedAccount from "./SignedAccount";

const navigationItems = {
  "/": {
    outline: <HomeOutline className="size-5 sm:size-6" />,
    solid: <HomeSolid className="size-5 sm:size-6" />,
    title: "Home"
  },
  "/bookmarks": {
    outline: <BookmarkOutline className="size-5 sm:size-6" />,
    solid: <BookmarkSolid className="size-5 sm:size-6" />,
    title: "Bookmarks"
  },
  "/explore": {
    outline: <GlobeOutline className="size-5 sm:size-6" />,
    solid: <GlobeSolid className="size-5 sm:size-6" />,
    title: "Explore"
  },
  "/gaming-dashboard": {
    outline: <PlayOutline className="size-5 sm:size-6" />,
    solid: <PlaySolid className="size-5 sm:size-6" />,
    title: "Game Hub"
  },
  "/groups": {
    outline: <UserGroupOutline className="size-5 sm:size-6" />,
    solid: <UserGroupSolid className="size-5 sm:size-6" />,
    title: "Groups"
  },
  "/notifications": {
    outline: <BellOutline className="size-5 sm:size-6" />,
    solid: <BellSolid className="size-5 sm:size-6" />,
    title: "Notifications"
  },
  "/tournaments": {
    outline: <TrophyOutline className="size-5 sm:size-6" />,
    solid: <TrophySolid className="size-5 sm:size-6" />,
    title: "Tournaments"
  }
};

const NavItem = memo(({ url, icon }: { url: string; icon: ReactNode }) => (
  <Tooltip content={navigationItems[url as keyof typeof navigationItems].title}>
    <Link to={url}>{icon}</Link>
  </Tooltip>
));

const NavItems = memo(({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { pathname } = useLocation();
  const routes = [
    "/",
    "/explore",
    "/gaming-dashboard",
    ...(isLoggedIn ? ["/notifications", "/groups", "/bookmarks"] : [])
  ];

  return (
    <>
      {routes.map((route) => (
        <NavItem
          icon={
            pathname === route
              ? navigationItems[route as keyof typeof navigationItems].solid
              : navigationItems[route as keyof typeof navigationItems].outline
          }
          key={route}
          url={route}
        />
      ))}
    </>
  );
});

const Navbar = () => {
  const { pathname } = useLocation();
  const { currentAccount } = useAccountStore();
  const { setShowAuthModal } = useAuthModalStore();

  const handleLogoClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo(0, 0);
      }
    },
    [pathname]
  );

  const handleAuthClick = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  return (
    <aside className="sticky top-2 mt-2 hidden w-16 shrink-0 flex-col items-center gap-y-4 sm:top-4 sm:mt-4 sm:w-18 sm:gap-y-5 md:top-5 md:mt-5 md:flex md:w-20 md:gap-y-6">
      <Link
        className="flex w-full justify-center"
        onClick={handleLogoClick}
        to="/"
      >
        <Image
          alt="Logo"
          className="size-12 sm:size-14 md:size-16"
          height={64}
          src="/logo.png"
          width={64}
        />
      </Link>
      <NavItems isLoggedIn={!!currentAccount} />

      {currentAccount ? (
        <>
          <Pro />
          <OnChainDashboard />
          <SignedAccount />
        </>
      ) : (
        <button
          aria-label="Login"
          onClick={handleAuthClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleAuthClick();
            }
          }}
          title="Login"
          type="button"
        >
          <Tooltip content="Login">
            <UserCircleIcon className="size-5 sm:size-6" />
          </Tooltip>
        </button>
      )}
    </aside>
  );
};

const EnhancedNavbar = memo(Navbar);

export default Navbar;
export { EnhancedNavbar };
