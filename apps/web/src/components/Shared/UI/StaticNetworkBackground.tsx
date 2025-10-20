interface StaticNetworkBackgroundProps {
  className?: string;
}

const StaticNetworkBackground = ({
  className = ""
}: StaticNetworkBackgroundProps) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 1px, transparent 1px),
          radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.12) 1px, transparent 1px),
          radial-gradient(circle at 60% 70%, rgba(168, 85, 247, 0.1) 1px, transparent 1px),
          radial-gradient(circle at 30% 80%, rgba(139, 92, 246, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 90% 60%, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
          radial-gradient(circle at 10% 50%, rgba(168, 85, 247, 0.12) 1px, transparent 1px),
          linear-gradient(135deg, transparent 48%, rgba(139, 92, 246, 0.03) 49%, rgba(139, 92, 246, 0.03) 51%, transparent 52%),
          linear-gradient(45deg, transparent 48%, rgba(6, 182, 212, 0.02) 49%, rgba(6, 182, 212, 0.02) 51%, transparent 52%)
        `,
        backgroundPosition:
          "0% 0%, 100% 0%, 50% 100%, 0% 100%, 100% 50%, 0% 50%, 25% 25%, 75% 75%",
        backgroundSize:
          "200px 200px, 300px 300px, 250px 250px, 180px 180px, 320px 320px, 220px 220px, 100px 100px, 150px 150px"
      }}
    />
  );
};

export default StaticNetworkBackground;
