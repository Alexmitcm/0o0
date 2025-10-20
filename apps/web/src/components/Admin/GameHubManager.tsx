import { Tab } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryManagementTab from "./GameHub/CategoryManagementTab";

import FetchGamesTab from "./GameHub/FetchGamesTab";
import GameList from "./GameHub/GameList";
import GameManagementTab from "./GameHub/GameManagementTab";
import JsonImporterTab from "./GameHub/JsonImporterTab";
import AdminReportsPage from "./GameHub/pages/AdminReportsPage";
import RemoteAddTab from "./GameHub/RemoteAddTab";
import UploadGameTab from "./GameHub/UploadGameTab";

const GameHubManager = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [params] = useSearchParams();

  const tabs = [
    { component: GameList, name: "Games" },

    { component: AdminReportsPage, name: "Reports" },
    { component: CategoryManagementTab, name: "Category Management" },
    { component: UploadGameTab, name: "Upload Game" },
    { component: GameManagementTab, name: "Game Management (Legacy)" },
    { component: FetchGamesTab, name: "Fetch Games" },
    { component: RemoteAddTab, name: "Remote Add" },
    { component: JsonImporterTab, name: "JSON Importer" }
  ];

  useEffect(() => {
    const q = params.get("ghTab");
    if (!q) return;
    const idx = tabs.findIndex((t) =>
      t.name.toLowerCase().includes(q.toLowerCase())
    );
    if (idx >= 0) setSelectedTab(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="border-gray-200 border-b dark:border-gray-700">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
          Game Hub Management
        </h2>
        <p className="mt-2 text-gray-600 text-sm dark:text-gray-400">
          Upload and manage HTML5 games for the Game Hub
        </p>
      </div>

      <Tab.Group onChange={setSelectedTab} selectedIndex={selectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {tabs.map((tab, _index) => (
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 font-medium text-sm leading-5 transition-colors ${
                  selected
                    ? "bg-white text-blue-700 shadow dark:bg-gray-700 dark:text-blue-300"
                    : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                }`
              }
              key={tab.name}
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          {tabs.map((tab, index) => (
            <Tab.Panel key={index}>
              <tab.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default GameHubManager;
