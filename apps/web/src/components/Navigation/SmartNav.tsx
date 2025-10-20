import { useUserStatus } from "@/hooks/useUserStatus";

interface NavItem {
  name: string;
  path: string;
  access: "all" | "premium";
  icon?: React.ReactNode;
}

const SmartNav = () => {
  const { isPremium, isLoading } = useUserStatus();

  const navItems: NavItem[] = [
    { access: "all", name: "Home", path: "/" },
    { access: "all", name: "Explore", path: "/explore" },
    { access: "all", name: "Game Hub", path: "/gaming-dashboard" },
    { access: "premium", name: "Referral Dashboard", path: "/referral" },
    { access: "premium", name: "Claim Rewards", path: "/rewards" }
  ];

  if (isLoading) {
    return (
      <nav className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            className="h-8 w-full animate-pulse rounded bg-gray-200"
            key={i}
          />
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-2">
      {navItems
        .filter(
          (item) =>
            item.access === "all" || (item.access === "premium" && isPremium)
        )
        .map((item) => (
          <NavItem key={item.name} {...item} />
        ))}
    </nav>
  );
};

const NavItem = ({ name, path, icon }: NavItem) => {
  return (
    <a
      className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-100"
      href={path}
    >
      {icon}
      <span>{name}</span>
    </a>
  );
};

export default SmartNav;
