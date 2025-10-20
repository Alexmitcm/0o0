import HybridNeuralBackground from "./HybridNeuralBackground";

interface FullPageNeuralBackgroundProps {
  className?: string;
}

const FullPageNeuralBackground = ({
  className = ""
}: FullPageNeuralBackgroundProps) => {
  return <HybridNeuralBackground className={className} />;
};

export default FullPageNeuralBackground;
