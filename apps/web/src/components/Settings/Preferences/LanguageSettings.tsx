import { GlobeAltIcon } from "@heroicons/react/24/outline";
import type React from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/Common/LanguageSwitcher";
import { Card } from "@/components/Shared/UI";

const LanguageSettings: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <Card>
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center space-x-3">
          <GlobeAltIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Language
            </h3>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              Choose your preferred language
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <LanguageSwitcher
            showFlags={true}
            showNativeNames={true}
            size="sm"
            variant="dropdown"
          />
        </div>
      </div>
    </Card>
  );
};

export default LanguageSettings;
