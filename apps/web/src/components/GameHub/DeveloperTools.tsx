import {
  ChartBarIcon,
  CodeBracketIcon,
  CogIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Card from "@/components/Shared/UI/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/Shared/UI/Tabs";
import APITester from "./HTMLInterfaces/APITester";
import D3Visualization from "./HTMLInterfaces/D3Visualization";

interface DeveloperToolsProps {
  className?: string;
}

const DeveloperTools = ({ className = "" }: DeveloperToolsProps) => {
  const [activeTab, setActiveTab] = useState("api-tester");

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="font-bold text-3xl text-gray-900">Developer Tools</h1>
          <p className="mt-2 text-gray-600">
            Advanced tools for testing, debugging, and visualizing Game Hub data
          </p>
        </div>

        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger className="flex items-center gap-2" value="api-tester">
              <CodeBracketIcon className="h-4 w-4" />
              API Tester
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="d3-viz">
              <ChartBarIcon className="h-4 w-4" />
              D3 Visualization
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="docs">
              <DocumentTextIcon className="h-4 w-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="settings">
              <CogIcon className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6" value="api-tester">
            <APITester />
          </TabsContent>

          <TabsContent className="mt-6" value="d3-viz">
            <D3Visualization />
          </TabsContent>

          <TabsContent className="mt-6" value="docs">
            <Card className="p-6">
              <h2 className="mb-4 font-bold text-2xl">API Documentation</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold text-lg">Base URL</h3>
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                    http://localhost:8080
                  </code>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-lg">Authentication</h3>
                  <p className="text-gray-600 text-sm">
                    Most endpoints require wallet-based authentication. Include
                    your wallet address in request body.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-lg">
                    Common Endpoints
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-4">
                      <code className="rounded bg-blue-100 px-2 py-1">GET</code>
                      <code>/ping</code>
                      <span className="text-gray-600">Health check</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="rounded bg-green-100 px-2 py-1">
                        POST
                      </code>
                      <code>/user-management/get-user-data</code>
                      <span className="text-gray-600">
                        Get user information
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <code className="rounded bg-green-100 px-2 py-1">
                        POST
                      </code>
                      <code>/coin-system-enhanced/get-coin-balance</code>
                      <span className="text-gray-600">Get coin balance</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="rounded bg-blue-100 px-2 py-1">GET</code>
                      <code>
                        /tournament-system-enhanced/get-all-tournaments
                      </code>
                      <span className="text-gray-600">List tournaments</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-lg">
                    Response Format
                  </h3>
                  <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-xs">
                    {`{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}`}
                  </pre>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent className="mt-6" value="settings">
            <Card className="p-6">
              <h2 className="mb-4 font-bold text-2xl">Developer Settings</h2>
              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm"
                    htmlFor="api-base-url"
                  >
                    API Base URL
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    defaultValue="http://localhost:8080"
                    id="api-base-url"
                    type="text"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm"
                    htmlFor="default-headers"
                  >
                    Default Headers
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                    defaultValue='{"Content-Type": "application/json"}'
                    id="default-headers"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className="rounded"
                    id="auto-refresh"
                    type="checkbox"
                  />
                  <label
                    className="text-gray-700 text-sm"
                    htmlFor="auto-refresh"
                  >
                    Auto-refresh data every 30 seconds
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input className="rounded" id="debug-mode" type="checkbox" />
                  <label className="text-gray-700 text-sm" htmlFor="debug-mode">
                    Enable debug mode (verbose logging)
                  </label>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default DeveloperTools;
