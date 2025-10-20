import type { ReactNode } from "react";
import cn from "@/helpers/cn";
import Card from "./Card";

interface FormCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  variant?: "default" | "elevated" | "modern" | "premium";
}

const FormCard = ({
  children,
  className = "",
  title,
  description,
  variant = "modern"
}: FormCardProps) => {
  return (
    <Card
      className={cn("space-y-6 p-6", className)}
      forceRounded
      variant={variant}
    >
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h3 className="font-semibold text-gray-100 text-lg">{title}</h3>
          )}
          {description && (
            <p className="text-gray-300 text-sm">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </Card>
  );
};

export default FormCard;
