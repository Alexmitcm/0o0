import { InteractiveNeuralBackground } from "./InteractiveNeuralBackground";
import NeuralBackground from "./NeuralBackground";

interface HybridNeuralBackgroundProps {
  className?: string;
  /**
   * When true, renders into its parent container instead of full screen.
   */
  contained?: boolean;
  /**
   * Toggle neural (galaxy) layer behind.
   */
  showNeural?: boolean;
  /**
   * Toggle interactive network layer on top.
   */
  showInteractive?: boolean;
  /**
   * Control whether the interactive layer draws its own starfield.
   * Useful to avoid double stars when a global space layer exists.
   */
  interactiveShowStarfield?: boolean;
  /**
   * Control the interactive layer center logo visibility when embedded.
   */
  interactiveShowCenterLogo?: boolean;
  /**
   * Control the interactive layer scale behavior.
   */
  interactiveScaleMode?: "fit" | "base";
  /** When true, NeuralBackground renders only nucleus (for tight panels). */
  neuralMinimal?: boolean;
  /** Performance: cap FPS for Three layer */
  neuralMaxFps?: number;
  /** Performance: cap device pixel ratio for renderer */
  neuralPixelRatio?: number;
  /** Performance: geometry/detail preset */
  neuralDetail?: "low" | "medium" | "high";
}

const HybridNeuralBackground = ({
  className = "",
  contained = false,
  showNeural = true,
  showInteractive = true,
  interactiveShowStarfield = true,
  interactiveShowCenterLogo = true,
  interactiveScaleMode = "base",
  neuralMinimal = false,
  neuralMaxFps = 60,
  neuralPixelRatio = Math.min(window.devicePixelRatio || 1, 1.25),
  neuralDetail = "high"
}: HybridNeuralBackgroundProps) => {
  return (
    <div
      aria-hidden="true"
      className={`${contained ? "absolute inset-0" : "-z-10 fixed inset-0"} ${className}`}
      role="presentation"
    >
      {/* Space effect behind, no pointer events so network remains interactive */}
      {showNeural && (
        <div className="pointer-events-none absolute inset-0">
          <NeuralBackground
            className="absolute inset-0"
            contained={contained}
            detail={neuralDetail}
            maxFps={neuralMaxFps}
            minimal={neuralMinimal}
            pixelRatio={neuralPixelRatio}
          />
        </div>
      )}
      {/* Interactive network on top */}
      {showInteractive && (
        <div className="absolute inset-0">
          <InteractiveNeuralBackground
            className="h-full w-full"
            fitContainer={contained}
            scaleMode={interactiveScaleMode}
            showCenterLogo={interactiveShowCenterLogo}
            showStarfield={interactiveShowStarfield}
          />
        </div>
      )}
    </div>
  );
};

export default HybridNeuralBackground;
