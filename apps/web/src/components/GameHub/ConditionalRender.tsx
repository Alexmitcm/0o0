import type { ReactNode } from "react";
import { useAccessControl } from "@/hooks/useAccessControl";
import type { UserAccessLevel } from "@/types/access";

interface ConditionalRenderProps {
  accessLevel: UserAccessLevel | UserAccessLevel[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL specified levels
}

const ConditionalRender = ({
  accessLevel,
  children,
  fallback = null,
  requireAll = false
}: ConditionalRenderProps) => {
  const { accessLevel: userLevel } = useAccessControl();

  const hasAccess = () => {
    if (Array.isArray(accessLevel)) {
      if (requireAll) {
        return accessLevel.every((level) => userLevel === level);
      }
      return accessLevel.includes(userLevel);
    }

    return userLevel === accessLevel;
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default ConditionalRender;
