import { useState } from "react";
import { Button } from "@/components/Shared/UI/Button";
import Card from "@/components/Shared/UI/Card";
import { Input } from "@/components/Shared/UI/Input";

interface APITesterProps {
  className?: string;
}

const APITester = ({ className = "" }: APITesterProps) => {
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState(
    '{"Content-Type": "application/json"}'
  );
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async () => {
    if (!endpoint) {
      setError("Please enter an endpoint");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const url = endpoint.startsWith("http")
        ? endpoint
        : `http://localhost:8080${endpoint}`;
      const requestHeaders = headers ? JSON.parse(headers) : {};

      const requestOptions: RequestInit = {
        headers: requestHeaders,
        method
      };

      if (method !== "GET" && body) {
        requestOptions.body = body;
      }

      const res = await fetch(url, requestOptions);
      const data = await res.json();

      setResponse({
        data,
        headers: Object.fromEntries(res.headers.entries()),
        status: res.status,
        statusText: res.statusText
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const testCommonEndpoints = async (endpointUrl: string) => {
    setEndpoint(endpointUrl);
    await testEndpoint();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <h2 className="mb-4 font-bold text-2xl">API Tester</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="endpoint-input"
              >
                Endpoint
              </label>
              <Input
                className="w-full"
                id="endpoint-input"
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/user-management/get-user-data"
                value={endpoint}
              />
            </div>
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="method-select"
              >
                Method
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                id="method-select"
                onChange={(e) => setMethod(e.target.value)}
                value={method}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="headers-textarea"
            >
              Headers (JSON)
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
              id="headers-textarea"
              onChange={(e) => setHeaders(e.target.value)}
              placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
              rows={3}
              value={headers}
            />
          </div>

          {method !== "GET" && (
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="body-textarea"
              >
                Request Body (JSON)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                id="body-textarea"
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"walletAddress": "0x..."}'
                rows={4}
                value={body}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button disabled={loading} onClick={testEndpoint}>
              {loading ? "Testing..." : "Test Endpoint"}
            </Button>
            <Button
              onClick={() => {
                setEndpoint("");
                setHeaders('{"Content-Type": "application/json"}');
                setBody("");
                setResponse(null);
                setError(null);
              }}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Test Buttons */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">Quick Tests</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Button
            onClick={() => testCommonEndpoints("/ping")}
            size="sm"
            variant="outline"
          >
            Ping
          </Button>
          <Button
            onClick={() =>
              testCommonEndpoints("/user-management/get-user-data")
            }
            size="sm"
            variant="outline"
          >
            Get User
          </Button>
          <Button
            onClick={() =>
              testCommonEndpoints(
                "/tournament-system-enhanced/get-all-tournaments"
              )
            }
            size="sm"
            variant="outline"
          >
            Get Tournaments
          </Button>
          <Button
            onClick={() =>
              testCommonEndpoints("/analytics-reporting/dashboard-stats")
            }
            size="sm"
            variant="outline"
          >
            Dashboard Stats
          </Button>
        </div>
      </Card>

      {/* Response Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-6">
          <h3 className="mb-2 font-semibold text-lg text-red-800">Error</h3>
          <pre className="text-red-700 text-sm">{error}</pre>
        </Card>
      )}

      {response && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-lg">Response</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Status</h4>
              <p className="text-sm">
                {response.status} {response.statusText}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700">Headers</h4>
              <pre className="mt-1 rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700">Body</h4>
              <pre className="mt-1 max-h-96 overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default APITester;
