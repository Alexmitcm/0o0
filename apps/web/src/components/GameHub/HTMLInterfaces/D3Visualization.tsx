import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Shared/UI/Button";
import Card from "@/components/Shared/UI/Card";

interface D3VisualizationProps {
  className?: string;
}

const D3Visualization = ({ className = "" }: D3VisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockData = {
    links: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "2", target: "4" },
      { source: "2", target: "5" },
      { source: "3", target: "6" }
    ],
    nodes: [
      { coins: 1000, id: "1", level: 0, name: "Root User" },
      { coins: 500, id: "2", level: 1, name: "User A", parent: "1" },
      { coins: 300, id: "3", level: 1, name: "User B", parent: "1" },
      { coins: 200, id: "4", level: 2, name: "User C", parent: "2" },
      { coins: 150, id: "5", level: 2, name: "User D", parent: "2" },
      { coins: 100, id: "6", level: 2, name: "User E", parent: "3" }
    ]
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would call the D3 API
      // const response = await gameHubApi.getReferralTreeData(user?.walletAddress || '');
      // setData(response.data);

      // For now, use mock data
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const renderD3Graph = () => {
    if (!data || !svgRef.current) return;

    const svg = svgRef.current;
    const width = 800;
    const height = 600;

    // Clear previous content safely
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Set SVG dimensions
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());

    // Create nodes
    for (const [index, node] of data.nodes.entries()) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      const x = 100 + (index % 3) * 200;
      const y = 100 + Math.floor(index / 3) * 150;

      circle.setAttribute("cx", x.toString());
      circle.setAttribute("cy", y.toString());
      circle.setAttribute("r", "20");
      circle.setAttribute("fill", node.level === 0 ? "#3B82F6" : "#10B981");
      circle.setAttribute("stroke", "#374151");
      circle.setAttribute("stroke-width", "2");

      // Add tooltip
      circle.setAttribute("title", `${node.name}\nCoins: ${node.coins}`);

      svg.appendChild(circle);

      // Add text labels
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x.toString());
      text.setAttribute("y", (y + 35).toString());
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "12");
      text.setAttribute("fill", "#374151");
      text.textContent = node.name;

      svg.appendChild(text);
    }

    // Create links
    for (const link of data.links) {
      const sourceNode = data.nodes.find((n: { id: string }) => n.id === link.source);
      const targetNode = data.nodes.find((n: { id: string }) => n.id === link.target);

      if (sourceNode && targetNode) {
        const sourceIndex = data.nodes.indexOf(sourceNode);
        const targetIndex = data.nodes.indexOf(targetNode);

        const sourceX = 100 + (sourceIndex % 3) * 200;
        const sourceY = 100 + Math.floor(sourceIndex / 3) * 150;
        const targetX = 100 + (targetIndex % 3) * 200;
        const targetY = 100 + Math.floor(targetIndex / 3) * 150;

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", sourceX.toString());
        line.setAttribute("y1", sourceY.toString());
        line.setAttribute("x2", targetX.toString());
        line.setAttribute("y2", targetY.toString());
        line.setAttribute("stroke", "#6B7280");
        line.setAttribute("stroke-width", "2");

        svg.appendChild(line);
      }
    }
  };

  useEffect(() => {
    if (data) {
      renderD3Graph();
    }
  }, [data]);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-2xl">
            D3.js Referral Tree Visualization
          </h2>
          <Button disabled={loading} onClick={loadData}>
            {loading ? "Loading..." : "Refresh Data"}
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-500" />
              <span className="text-sm">Root User</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-500" />
              <span className="text-sm">Referral</span>
            </div>
          </div>

          <div className="flex justify-center">
            <svg
              className="border border-gray-300 bg-white d3-visualization-svg"
              ref={svgRef}
            />
          </div>
        </div>

        {data && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-gray-700">Statistics</h3>
              <ul className="mt-2 space-y-1 text-gray-600 text-sm">
                <li>Total Users: {data.nodes.length}</li>
                <li>Total Connections: {data.links.length}</li>
                <li>
                  Max Level: {Math.max(...data.nodes.map((n: { level: number }) => n.level))}
                </li>
                <li>
                  Total Coins:{" "}
                  {data.nodes.reduce((sum: number, n: { coins: number }) => sum + n.coins, 0)}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Legend</h3>
              <ul className="mt-2 space-y-1 text-gray-600 text-sm">
                <li>• Blue circles: Root users</li>
                <li>• Green circles: Referral users</li>
                <li>• Lines: Referral relationships</li>
                <li>• Hover for user details</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default D3Visualization;
