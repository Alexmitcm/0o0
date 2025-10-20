import cn from "@/helpers/cn";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "green" | "purple" | "orange" | "red";
  className?: string;
}

const ProgressRing = ({
  progress,
  size = "md",
  color = "blue",
  className = ""
}: ProgressRingProps) => {
  // Calculate dimensions based on size
  const getDimensions = () => {
    const sizeMap = {
      sm: { size: 32, strokeWidth: 3 },
      md: { size: 40, strokeWidth: 4 },
      lg: { size: 48, strokeWidth: 5 },
      xl: { size: 64, strokeWidth: 6 }
    };
    
    const dimensions = sizeMap[size];
    return {
      size: dimensions.size,
      strokeWidth: dimensions.strokeWidth,
      radius: (dimensions.size - dimensions.strokeWidth) / 2
    };
  };

  const dimensions = getDimensions();
  const circumference = dimensions.radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={cn(
        "progress-ring",
        `progress-ring-${size}`,
        `progress-ring-${color}`,
        className
      )}
    >
      <svg 
        aria-label={`Progress ${Math.round(progress)} percent`}
        className="progress-ring-svg" 
        height={dimensions.size} 
        role="img"
        width={dimensions.size}
      >
        <title>{`${Math.round(progress)}% progress`}</title>
        {/* Background circle */}
        <circle
          cx={dimensions.size / 2}
          cy={dimensions.size / 2}
          r={dimensions.radius}
          className="progress-ring-bg"
          strokeWidth={dimensions.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={dimensions.size / 2}
          cy={dimensions.size / 2}
          r={dimensions.radius}
          className="progress-ring-fill"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeWidth={dimensions.strokeWidth}
        />
      </svg>
      {/* Progress text */}
      <div className="progress-ring-text">
        <span className="progress-ring-percentage">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;
