import { useReferralTree } from "../../hooks/useReferralTree";

export default function ReferralTreeDebug() {
  const { data, isLoading, error } = useReferralTree(
    "0x960fceed1a0ac2cc22e6e7bd6876ca527d31d268",
    3
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="font-bold text-xl">Referral Tree Debug</h2>

      <div className="rounded bg-gray-100 p-4">
        <h3 className="mb-2 font-semibold">Meta Data:</h3>
        <pre className="text-sm">{JSON.stringify(data?.meta, null, 2)}</pre>
      </div>

      <div className="rounded bg-gray-100 p-4">
        <h3 className="mb-2 font-semibold">
          Raw Nodes ({data?.data.length} nodes):
        </h3>
        <pre className="max-h-96 overflow-auto text-sm">
          {JSON.stringify(data?.data, null, 2)}
        </pre>
      </div>

      <div className="rounded bg-gray-100 p-4">
        <h3 className="mb-2 font-semibold">Tree Structure Analysis:</h3>
        <div className="space-y-1 text-sm">
          {data?.data.map((node, index) => (
            <div className="border-b pb-1" key={index}>
              <div>
                Node {index + 1}: {node.address}
              </div>
              <div>Depth: {node.depth}</div>
              <div>Parent: {node.parent || "None"}</div>
              <div>Left Child: {node.leftChild || "None"}</div>
              <div>Right Child: {node.rightChild || "None"}</div>
              <div>Balance: {node.balance}</div>
              <div>Points: {node.point}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
