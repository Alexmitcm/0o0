import type React from "react";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/Shared/UI/Tabs";
import TournamentLeaderboard from "./TournamentLeaderboard";
import TournamentList from "./TournamentList";

interface TournamentSystemProps {
  selectedTournamentId?: string;
}

const TournamentSystem: React.FC<TournamentSystemProps> = ({
  selectedTournamentId
}) => {
  const [activeTab, setActiveTab] = useState(
    selectedTournamentId ? "leaderboard" : "list"
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="flex items-center justify-center gap-2 font-bold text-3xl text-gray-900">
          🏆 Tournament System
        </h1>
        <p className="text-gray-600">
          Join tournaments, compete and win prizes
        </p>
      </div>

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Tournament List</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="list">
          <TournamentList />
        </TabsContent>

        <TabsContent className="mt-6" value="leaderboard">
          {selectedTournamentId ? (
            <TournamentLeaderboard tournamentId={selectedTournamentId} />
          ) : (
            <div className="py-12 text-center text-gray-500">
              <p>Please select a tournament to view its leaderboard</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentSystem;
