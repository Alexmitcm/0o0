import type { ReferralNode, ReferralStats, TreeNode } from "../types";

// CSV Export functionality
export const exportToCSV = (
  data: Array<{
    address: string;
    balance: string;
    depth: number;
    status: string;
    parent: string;
    leftChild: string;
    rightChild: string;
    startTime: number;
  }>,
  filename = "referral-data.csv"
): void => {
  // Define CSV headers
  const headers = [
    "Address",
    "Balance (USDT)",
    "Depth",
    "Status",
    "Parent Address",
    "Left Child",
    "Right Child",
    "Start Time",
    "Formatted Start Time"
  ];

  // Convert data to CSV format
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      [
        row.address,
        row.balance,
        row.depth,
        row.status,
        row.parent,
        row.leftChild,
        row.rightChild,
        row.startTime,
        new Date(row.startTime * 1000).toISOString()
      ].join(",")
    )
  ].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// PDF Export functionality (using jsPDF)
export const exportToPDF = async (
  referralData: {
    currentNode: ReferralNode;
    parentNode: ReferralNode | null;
    childNodes: Map<string, ReferralNode>;
    stats: ReferralStats;
    treeData: TreeNode | null;
  },
  filename = "referral-report.pdf"
): Promise<void> => {
  try {
    // Dynamic import to avoid bundling jsPDF in the main bundle
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text("Referral Dashboard Report", 20, 20);

    // Add current date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    // Add summary statistics
    doc.setFontSize(16);
    doc.text("Summary Statistics", 20, 50);

    doc.setFontSize(12);
    doc.text(`Total Balance: ${referralData.stats.totalBalance} USDT`, 20, 60);
    doc.text(`Network Depth: ${referralData.stats.networkDepth}`, 20, 70);
    doc.text(`Total Referrals: ${referralData.stats.totalReferrals}`, 20, 80);
    doc.text(
      `Status: ${referralData.stats.isUnbalanced ? "Unbalanced" : "Balanced"}`,
      20,
      90
    );

    // Add current node details
    doc.setFontSize(16);
    doc.text("Current Node Details", 20, 110);

    doc.setFontSize(10);
    const currentNode = referralData.currentNode;
    doc.text(`Address: ${currentNode.player}`, 20, 120);
    doc.text(`Balance: ${currentNode.balance} USDT`, 20, 130);
    doc.text(`Depth: ${currentNode.depth}`, 20, 140);
    doc.text(
      `Start Time: ${new Date(currentNode.startTime * 1000).toLocaleString()}`,
      20,
      150
    );

    // Add parent node details if exists
    if (referralData.parentNode) {
      doc.setFontSize(16);
      doc.text("Parent Node Details", 20, 170);

      doc.setFontSize(10);
      const parentNode = referralData.parentNode;
      doc.text(`Address: ${parentNode.player}`, 20, 180);
      doc.text(`Balance: ${parentNode.balance} USDT`, 20, 190);
      doc.text(`Depth: ${parentNode.depth}`, 20, 200);
    }

    // Add child nodes table
    if (referralData.childNodes.size > 0) {
      doc.setFontSize(16);
      doc.text("Child Nodes", 20, 220);

      let yPosition = 230;
      let _pageNumber = 1;

      referralData.childNodes.forEach((childNode, address) => {
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          _pageNumber++;
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.text(`Address: ${address}`, 20, yPosition);
        doc.text(`Balance: ${childNode.balance} USDT`, 20, yPosition + 5);
        doc.text(`Depth: ${childNode.depth}`, 20, yPosition + 10);
        doc.text(
          `Status: ${childNode.unbalancedAllowance ? "Unbalanced" : "Balanced"}`,
          20,
          yPosition + 15
        );

        yPosition += 25;
      });
    }

    // Save the PDF
    doc.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF report");
  }
};

// Tree data export utility
export const prepareTreeDataForExport = (
  treeData: TreeNode | null,
  childNodes: Map<string, ReferralNode>
): Array<{
  address: string;
  balance: string;
  depth: number;
  status: string;
  parent: string;
  leftChild: string;
  rightChild: string;
  startTime: number;
}> => {
  if (!treeData) return [];

  const exportData: Array<{
    address: string;
    balance: string;
    depth: number;
    status: string;
    parent: string;
    leftChild: string;
    rightChild: string;
    startTime: number;
  }> = [];

  const processNode = (node: TreeNode, parentAddress = "") => {
    // Get full node data from childNodes map or use tree data
    const fullNodeData = childNodes.get(node.address);

    exportData.push({
      address: node.address,
      balance: node.balance,
      depth: node.depth,
      leftChild:
        fullNodeData?.leftChild || "0x0000000000000000000000000000000000000000",
      parent: parentAddress,
      rightChild:
        fullNodeData?.rightChild ||
        "0x0000000000000000000000000000000000000000",
      startTime: fullNodeData?.startTime || 0,
      status: node.isUnbalanced ? "Unbalanced" : "Balanced"
    });

    // Process children
    if (node.leftChild) {
      processNode(node.leftChild, node.address);
    }
    if (node.rightChild) {
      processNode(node.rightChild, node.address);
    }
    if (node.children) {
      node.children.forEach((child) => processNode(child, node.address));
    }
  };

  processNode(treeData);
  return exportData;
};

// Comprehensive export function
export const exportReferralData = async (
  referralData: {
    currentNode: ReferralNode;
    parentNode: ReferralNode | null;
    childNodes: Map<string, ReferralNode>;
    stats: ReferralStats;
    treeData: TreeNode | null;
  },
  format: "csv" | "pdf" = "csv"
): Promise<void> => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

  if (format === "csv") {
    const exportData = prepareTreeDataForExport(
      referralData.treeData,
      referralData.childNodes
    );
    exportToCSV(exportData, `referral-data-${timestamp}.csv`);
  } else if (format === "pdf") {
    await exportToPDF(referralData, `referral-report-${timestamp}.pdf`);
  }
};

// JSON export for data backup
export const exportToJSON = (
  data: any,
  filename = "referral-data.json"
): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
