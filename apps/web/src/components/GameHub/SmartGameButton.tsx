import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shared/UI/Button";
import type { Game } from "@/helpers/gameHub";
import { useAccessControl } from "@/hooks/useAccessControl";

// import { useAuthModalStore } from "@/store/persisted/useAuthModalStore";

interface SmartGameButtonProps {
  game: Game;
  variant?: "default" | "compact" | "featured";
  size?: "sm" | "md" | "lg";
  className?: string;
  onPlay?: (game: Game) => void;
}

const SmartGameButton = ({
  game,
  variant: _variant = "default",
  size = "md",
  className = "",
  onPlay
}: SmartGameButtonProps) => {
  const navigate = useNavigate();
  // const { setShowAuthModal } = useAuthModalStore();
  const setShowAuthModal = (show: boolean) => {
    console.log("Auth modal:", show);
  };
  const { accessLevel } = useAccessControl();

  const handleClick = () => {
    if (onPlay) {
      onPlay(game);
      return;
    }

    // Default behavior based on access level
    if (accessLevel === "guest") {
      if (game.gameType === "PlayToEarn") {
        setShowAuthModal(true);
        return;
      }
      // Allow free games for guests
      navigate(`/gaming-dashboard/game/${game.slug}`);
      return;
    }

    if (accessLevel === "standard") {
      if (game.gameType === "PlayToEarn") {
        // Show upgrade modal for premium games
        navigate("/premium");
        return;
      }
      // Allow free games for standard users
      navigate(`/gaming-dashboard/game/${game.slug}`);
      return;
    }

    // Premium and admin users can play all games
    navigate(`/gaming-dashboard/game/${game.slug}`);
  };

  const getButtonConfig = () => {
    // Guest users
    if (accessLevel === "guest") {
      if (game.gameType === "PlayToEarn") {
        return {
          icon: "🔒",
          onClick: () => setShowAuthModal(true),
          text: "Login to Play",
          variant: "ghost" as const
        };
      }
      return {
        icon: "🎮",
        onClick: handleClick,
        text: "Play Free",
        variant: "primary" as const
      };
    }

    // Standard users
    if (accessLevel === "standard") {
      if (game.gameType === "PlayToEarn") {
        return {
          icon: "⭐",
          onClick: () => navigate("/premium"),
          text: "Upgrade to Play",
          variant: "secondary" as const
        };
      }
      return {
        icon: "🎮",
        onClick: handleClick,
        text: "Play",
        variant: "primary" as const
      };
    }

    // Premium and admin users
    return {
      icon: "🎮",
      onClick: handleClick,
      text: "Play",
      variant: "primary" as const
    };
  };

  const config = getButtonConfig();
  const isDisabled = false; // keep button clickable for upgrade/login flows

  return (
    <Button
      aria-label={`${config.text}: ${game.title}`}
      className={className}
      disabled={isDisabled}
      onClick={config.onClick}
      size={size}
      variant={config.variant}
    >
      <span className="flex items-center gap-2">
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    </Button>
  );
};

export default SmartGameButton;
