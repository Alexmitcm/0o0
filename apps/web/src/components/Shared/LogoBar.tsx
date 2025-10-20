import { useLogoContext } from "@/contexts/LogoContext";

interface LogoBarProps {
  className?: string;
}

const LogoBar = ({ className = "" }: LogoBarProps) => {
  const { logos } = useLogoContext();

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos];

  return (
    <div
      className={`relative overflow-hidden border-white/10 border-t bg-black/20 backdrop-blur-sm ${className}`}
    >
      <div className="py-3">
        <div className="flex animate-scroll-left">
          {duplicatedLogos.map((logo, index) => (
            <div
              className="mx-3 flex flex-shrink-0 items-center justify-center sm:mx-4"
              key={`${logo.id}-${index}`}
            >
              <a
                className="group flex items-center space-x-2 transition-all duration-300 hover:scale-105"
                href={logo.websiteUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="relative h-8 w-8 sm:h-10 sm:w-10">
                  <img
                    alt={`${logo.name} logo`}
                    className="h-full w-full object-contain opacity-60 brightness-0 invert filter transition-opacity duration-300 group-hover:opacity-80"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const div = document.createElement('div');
                        div.className = 'flex h-full w-full items-center justify-center rounded bg-gray-200 text-xs font-bold text-gray-600';
                        div.textContent = logo.name.charAt(0);
                        parent.appendChild(div);
                      }
                    }}
                    src={logo.logoUrl}
                  />
                </div>
                <span className="hidden font-medium text-white/50 text-xs transition-colors duration-300 group-hover:text-white/70 sm:block">
                  {logo.name}
                </span>
              </a>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left 25s linear infinite;
        }
        
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-left {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default LogoBar;
