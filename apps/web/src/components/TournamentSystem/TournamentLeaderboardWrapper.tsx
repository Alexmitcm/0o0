import { useParams } from "react-router-dom";
import TournamentSystemLeaderboard from "./TournamentLeaderboard";

const TournamentLeaderboardWrapper = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  
  if (!tournamentId) {
    return <div>Tournament ID not found</div>;
  }
  
  return <TournamentSystemLeaderboard tournamentId={tournamentId} />;
};

export default TournamentLeaderboardWrapper;
