import { shareToSocialMedia } from "@/helpers/gameHub";

interface SocialShareButtonsProps {
  gameTitle: string;
  gameUrl: string;
}

const SocialShareButtons = ({
  gameTitle,
  gameUrl
}: SocialShareButtonsProps) => {
  const socialPlatforms = [
    { icon: "📘", name: "Facebook", platform: "facebook" },
    { icon: "🐦", name: "Twitter", platform: "twitter" },
    { icon: "💼", name: "LinkedIn", platform: "linkedin" },
    { icon: "🤖", name: "Reddit", platform: "reddit" },
    { icon: "💬", name: "WhatsApp", platform: "whatsapp" }
  ];

  const handleShare = (platform: string) => {
    shareToSocialMedia(platform, gameTitle, gameUrl);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 text-sm">Share:</span>
      {socialPlatforms.map(({ name, icon, platform }) => (
        <button
          aria-label={`Share on ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          key={platform}
          onClick={() => handleShare(platform)}
          title={`Share on ${name}`}
        >
          <span className="text-sm">{icon}</span>
        </button>
      ))}
    </div>
  );
};

export default SocialShareButtons;
