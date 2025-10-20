import { STATIC_IMAGES_URL } from "@hey/data/constants";
import type { MouseEvent } from "react";
import { useCallback } from "react";
import { useSignupStore } from "@/components/Shared/Auth/Signup";
import { Button } from "@/components/Shared/UI";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";

interface AuthButtonsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "minimal";
  showIcons?: boolean;
}

const AuthButtons = ({
  className = "",
  size = "md",
  variant = "default",
  showIcons = true
}: AuthButtonsProps) => {
  const { setShowAuthModal } = useAuthModalStore();
  const { setScreen } = useSignupStore();

  const handleLoginClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setShowAuthModal(true, "login");
    },
    [setShowAuthModal]
  );

  const handleSignupClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setScreen("choose");
      setShowAuthModal(true, "signup");
    },
    [setShowAuthModal, setScreen]
  );

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          aria-label="Login"
          className="rounded-lg bg-white/10 px-3 py-2 font-medium text-white/90 text-xs transition-all duration-200 hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
          onClick={handleLoginClick}
          type="button"
        >
          Login
        </button>
        <button
          aria-label="Sign up"
          className="rounded-lg bg-gradient-to-r from-purple-600/80 to-cyan-600/80 px-3 py-2 font-medium text-white text-xs transition-all duration-200 hover:from-purple-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
          onClick={handleSignupClick}
          type="button"
        >
          Sign up
        </button>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          aria-label="Sign in"
          className="text-sm text-white/70 underline hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
          onClick={handleLoginClick}
          type="button"
        >
          Sign in
        </button>
        <button
          aria-label="Get started"
          className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 font-medium text-sm text-white transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
          onClick={handleSignupClick}
          type="button"
        >
          Get started
        </button>
      </div>
    );
  }

  // Default variant - full buttons
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        icon={
          showIcons ? (
            <img
              alt="Lens Logo"
              className="mr-0.5 h-3"
              height={12}
              src={`${STATIC_IMAGES_URL}/brands/lens.svg`}
              width={19}
            />
          ) : undefined
        }
        onClick={handleLoginClick}
        size={size}
      >
        Login
      </Button>
      <Button onClick={handleSignupClick} outline size={size}>
        Signup
      </Button>
    </div>
  );
};

export default AuthButtons;
