import { Link } from "react-router-dom";
import GameList from "../GameList";

const AdminGamesPage = () => {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-gray-900 text-xl dark:text-white">
          Game Management
        </h1>
        <Link
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700"
          to="/admin/games/new"
        >
          Add Game
        </Link>
      </div>

      <GameList />
    </div>
  );
};

export default AdminGamesPage;
