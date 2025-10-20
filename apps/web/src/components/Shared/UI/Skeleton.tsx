import { memo } from "react";
import cn from "@/helpers/cn";

interface SkeletonProps {
  className?: string;
  [key: string]: any;
}

const Skeleton = ({ className = "", ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
};

export default memo(Skeleton);
export { Skeleton };
