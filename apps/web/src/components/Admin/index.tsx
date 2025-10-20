import { useEffect, useState } from "react";
import AdminDashboard from "./Dashboard/AdminDashboard";
import AdminWeb3Provider from "./AdminWeb3Provider";
import CoinManagementPanel from "./CoinManagement/CoinManagementPanel";
import FeatureManagement from "./FeatureManagement";
import GameHubManagementPanel from "./GameHubManagement/GameHubManagementPanel";
import GameHubManager from "./GameHubManager";
import JobQueueDashboard from "./JobQueueDashboard";
import LogoManagement from "./LogoManagement";
import SmartContractControlPanel from "./SmartContractControlPanel";
import SmartContractManagementPanel from "./SmartContractManagement/SmartContractManagementPanel";
import SystemManagementPanel from "./SystemManagement/SystemManagementPanel";
import TournamentManagementPanel from "./TournamentManagement/TournamentManagementPanel";
import TournamentDetail from "./Tournaments/TournamentDetail";
import TournamentForm from "./Tournaments/TournamentForm";
// import TournamentList from "./Tournaments/TournamentList";
import UserManagementPanel from "./UserManagement/UserManagementPanel";
import DatabaseExport from "./DatabaseExport";
import AdminEndpoints from "./AdminEndpoints";

type AdminSection =
  | "dashboard"
  | "users"
  | "coins"
  | "tournaments"
  | "system"
  | "features"
  | "games"
  | "gamehub"
  | "contracts"
  | "smartcontracts"
  | "jobs"
  | "logos"
  | "export"
  | "endpoints"
  | "newTournament"
  | "viewTournament";

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(null);

  const syncFromHash = () => {
    const hash =
      typeof window !== "undefined"
        ? window.location.hash.replace(/^#/, "")
        : "";
    // Supported routes:
    // /admin/tournaments
    // /admin/tournaments/new
    // /admin/tournaments/:id
    if (hash.startsWith("/admin/tournaments")) {
      const parts = hash.split("/").filter(Boolean); // ["admin","tournaments", ...]
      if (parts.length === 2) {
        setActiveSection("tournaments");
        setSelectedTournamentId(null);
        return;
      }
      if (parts[2] === "new") {
        setActiveSection("newTournament");
        setSelectedTournamentId(null);
        return;
      }
      if (parts[2]) {
        setActiveSection("viewTournament");
        setSelectedTournamentId(parts[2]);
        return;
      }
    }
  };

  // Initialize and listen to hash changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    syncFromHash();
    const onHash = () => syncFromHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <UserManagementPanel />;
      case "coins":
        return <CoinManagementPanel />;
      case "tournaments":
        return <TournamentManagementPanel />;
      case "system":
        return <SystemManagementPanel />;
      case "features":
        return <FeatureManagement />;
      case "games":
        return <GameHubManager />;
      case "gamehub":
        return <GameHubManagementPanel />;
      case "contracts":
        return <SmartContractControlPanel />;
      case "smartcontracts":
        return <SmartContractManagementPanel />;
      case "jobs":
        return <JobQueueDashboard />;
      case "logos":
        return <LogoManagement />;
      case "export":
        return <DatabaseExport />;
      case "endpoints":
        return <AdminEndpoints />;
      case "newTournament":
        return (
          <TournamentForm onSaved={() => setActiveSection("tournaments")} />
        );
      case "viewTournament":
        return <TournamentDetail id={selectedTournamentId ?? ""} />;
      default:
        return <AdminDashboard />;
    }
  };

  const getNavLinkClass = (section: AdminSection) => {
    return `rounded border px-3 py-1 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 whitespace-nowrap ${
      activeSection === section
        ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300"
        : "text-gray-700 dark:text-gray-300"
    }`;
  };

  return (
    <AdminWeb3Provider>
      <div className="space-y-8">
        {/* Navigation */}
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="mb-2 text-gray-500 text-xs dark:text-gray-400">
            Admin Panel - Scroll horizontally to see all sections
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-2 text-sm">
            <button
              className={getNavLinkClass("dashboard")}
              onClick={() => setActiveSection("dashboard")}
              type="button"
            >
              Dashboard
            </button>
            <button
              className={getNavLinkClass("users")}
              onClick={() => setActiveSection("users")}
              type="button"
            >
              User Management
            </button>
            <button
              className={getNavLinkClass("coins")}
              onClick={() => setActiveSection("coins")}
              type="button"
            >
              Coin Management
            </button>
            <button
              className={getNavLinkClass("tournaments")}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.hash = "/admin/tournaments";
                }
                setActiveSection("tournaments");
                setSelectedTournamentId(null);
              }}
              type="button"
            >
              Tournaments
            </button>
            <button
              className={getNavLinkClass("system")}
              onClick={() => setActiveSection("system")}
              type="button"
            >
              System Management
            </button>
            <button
              className={getNavLinkClass("features")}
              onClick={() => setActiveSection("features")}
              type="button"
            >
              Feature Management
            </button>
            <button
              className={getNavLinkClass("games")}
              onClick={() => setActiveSection("games")}
              type="button"
            >
              Games (Legacy)
            </button>
            <button
              className={getNavLinkClass("gamehub")}
              onClick={() => setActiveSection("gamehub")}
              type="button"
            >
              Game Hub Management
            </button>
            <button
              className={getNavLinkClass("contracts")}
              onClick={() => setActiveSection("contracts")}
              type="button"
            >
              Smart Contracts (Legacy)
            </button>
            <button
              className={getNavLinkClass("smartcontracts")}
              onClick={() => setActiveSection("smartcontracts")}
              type="button"
            >
              Smart Contract Management
            </button>
            <button
              className={getNavLinkClass("jobs")}
              onClick={() => setActiveSection("jobs")}
              type="button"
            >
              Job Queue
            </button>
            <button
              className={getNavLinkClass("logos")}
              onClick={() => setActiveSection("logos")}
              type="button"
            >
              Logo Management
            </button>
            <button
              className={getNavLinkClass("export")}
              onClick={() => setActiveSection("export")}
              type="button"
            >
              Database Export
            </button>
            <button
              className={getNavLinkClass("endpoints")}
              onClick={() => setActiveSection("endpoints")}
              type="button"
            >
              Admin Endpoints
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="min-h-screen">{renderSection()}</div>
      </div>
    </AdminWeb3Provider>
  );
};

export default AdminPanel;
