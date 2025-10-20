import { BrowserRouter, Route, Routes as RouterRoutes } from "react-router-dom";
import ViewAccount from "@/components/Account";
import AdminGamesPage from "@/components/Admin/GameHub/pages/AdminGamesPage";
import AdminReportsPage from "@/components/Admin/GameHub/pages/AdminReportsPage";
import EditGamePage from "@/components/Admin/GameHub/pages/EditGamePage";
import NewGamePage from "@/components/Admin/GameHub/pages/NewGamePage";
import Bookmarks from "@/components/Bookmarks";
import Layout from "@/components/Common/Layout";
import Explore from "@/components/Explore";
import GameDetail from "@/components/GameDetail/GameDetail";
import GameHub from "@/components/GameHub";
import CategoryPage from "@/components/GameHub/CategoryPage";
import SimpleEnhancedGameHub from "@/components/GameHub/SimpleEnhancedGameHub";
import TagPage from "@/components/GameHub/TagPage";
import ViewGroup from "@/components/Group";
import GroupSettings from "@/components/Group/Settings";
import { default as GroupMonetizeSettings } from "@/components/Group/Settings/Monetize";
import { default as GroupPersonalizeSettings } from "@/components/Group/Settings/Personalize";
import RulesSettings from "@/components/Group/Settings/Rules";
import Groups from "@/components/Groups";
import Home from "@/components/Home";
import Notification from "@/components/Notification";
import Copyright from "@/components/Pages/Copyright";
import Guidelines from "@/components/Pages/Guidelines";
import Privacy from "@/components/Pages/Privacy";
import Support from "@/components/Pages/Support";
import Terms from "@/components/Pages/Terms";
import ViewPost from "@/components/Post";
import Search from "@/components/Search";
import AccountSettings from "@/components/Settings";
import BlockedSettings from "@/components/Settings/Blocked";
import DeveloperSettings from "@/components/Settings/Developer";
import FundsSettings from "@/components/Settings/Funds";
import ManagerSettings from "@/components/Settings/Manager";
import { default as AccountMonetizeSettings } from "@/components/Settings/Monetize";
import { default as AccountPersonalizeSettings } from "@/components/Settings/Personalize";
import PreferencesSettings from "@/components/Settings/Preferences";
import SessionsSettings from "@/components/Settings/Sessions";
import UsernameSettings from "@/components/Settings/Username";
import Custom404 from "@/components/Shared/404";
import AdminPanel from "./components/Admin";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminRoute from "./components/Admin/AdminRoute";
import AdminCoinManagement from "./components/Admin/CoinManagement/AdminCoinManagement";
import AdminSystem from "./components/Admin/SystemManagement/SystemManagementPanel";
import CoinSystem from "./components/CoinSystem";
import LeaderboardPage from "./components/Leaderboard/LeaderboardPage";
import NotificationSystem from "./components/NotificationSystem";
import PremiumRegistration from "./components/Premium/PremiumRegistration";
import {
  PremiumPage,
  PremiumTestPage,
  ProDashboard
} from "./components/Premium";
import ProductPage from "./components/Products/ProductPage";
import CoinManagement from "./components/Profile/CoinManagement";
import ClaimRewardsPage from "./components/Settings/ClaimRewards";
import ReferralDashboard from "./components/Settings/ReferralDashboard";
import RewardsSettings from "./components/Settings/Rewards";
import Staff from "./components/Staff";
import TournamentDetail from "./components/Tournament/TournamentDetail";
import TournamentList from "./components/Tournament/TournamentList";
import TournamentSystem from "./components/TournamentSystem";
import TransactionSystem from "./components/TransactionSystem";
import UserSystem from "./components/UserSystem";
import LootBoxPage from "./pages/LootBoxPage";

const Routes = () => {
  return (
    <BrowserRouter>
      <RouterRoutes>
        <Route element={<Layout />} path="/">
          <Route element={<Home />} index />
          <Route element={<Explore />} path="explore" />
          <Route element={<Search />} path="search" />
          <Route element={<Groups />} path="groups" />
          <Route path="gaming-dashboard">
            <Route element={<SimpleEnhancedGameHub />} index />
            <Route element={<GameHub />} path="classic" />
            <Route element={<CategoryPage />} path="category/:slug" />
            <Route element={<TagPage />} path="tag/:slug" />
            <Route element={<GameDetail />} path="game/:slug" />
          </Route>
          <Route element={<Bookmarks />} path="bookmarks" />
          <Route element={<Notification />} path="notifications" />
          <Route path="tournaments">
            <Route element={<TournamentList />} index />
            <Route element={<TournamentDetail />} path=":id" />
          </Route>
          <Route element={<LeaderboardPage />} path="leaderboard" />
          <Route element={<LootBoxPage />} path="lootbox" />
          <Route element={<ViewAccount />} path="account/:address" />
          <Route element={<ViewAccount />} path="u/:username" />
          <Route path="coin-system">
            <Route element={<CoinSystem />} path=":walletAddress" />
          </Route>
          <Route path="tournament-system">
            <Route element={<TournamentSystem />} index />
            <Route
              element={
                <TournamentSystem selectedTournamentId="tournament-id" />
              }
              path=":tournamentId"
            />
          </Route>
          <Route path="notification-system">
            <Route element={<NotificationSystem />} path=":walletAddress" />
          </Route>
          <Route path="transaction-system">
            <Route element={<TransactionSystem />} path=":walletAddress" />
          </Route>
          <Route path="user-system">
            <Route
              element={
                <UserSystem
                  isOwnProfile={true}
                  walletAddress="0x1234567890123456789012345678901234567890"
                />
              }
              path="profile/:walletAddress"
            />
            <Route
              element={
                <UserSystem
                  isOwnProfile={false}
                  walletAddress="0x1234567890123456789012345678901234567890"
                />
              }
              path=":walletAddress"
            />
          </Route>
          <Route path="g/:address">
            <Route element={<ViewGroup />} index />
            <Route path="settings">
              <Route element={<GroupSettings />} index />
              <Route
                element={<GroupPersonalizeSettings />}
                path="personalize"
              />
              <Route element={<GroupMonetizeSettings />} path="monetize" />
              <Route element={<RulesSettings />} path="rules" />
            </Route>
          </Route>
          <Route path="posts/:slug">
            <Route element={<ViewPost />} index />
            <Route element={<ViewPost />} path="quotes" />
          </Route>
          <Route path="settings">
            <Route element={<AccountSettings />} index />
            <Route
              element={<AccountPersonalizeSettings />}
              path="personalize"
            />
            <Route element={<AccountMonetizeSettings />} path="monetize" />
            <Route element={<RewardsSettings />} path="rewards" />
            <Route element={<ClaimRewardsPage />} path="claim-rewards" />
            <Route element={<ReferralDashboard />} path="referral-dashboard" />
            <Route element={<CoinManagement />} path="coins" />
            <Route element={<FundsSettings />} path="funds" />
            <Route element={<ManagerSettings />} path="manager" />
            <Route element={<DeveloperSettings />} path="developer" />
            <Route element={<BlockedSettings />} path="blocked" />
            <Route element={<PreferencesSettings />} path="preferences" />
            <Route element={<SessionsSettings />} path="sessions" />
            <Route element={<UsernameSettings />} path="username" />
          </Route>
          <Route path="staff">
            <Route element={<Staff />} index />
          </Route>
          <Route path="admin">
            <Route element={<AdminRoute />} index />
            <Route element={<AdminPanel />} path="panel" />
            <Route element={<AdminDashboard />} path="dashboard" />
            <Route element={<AdminGamesPage />} path="games" />
            <Route element={<NewGamePage />} path="games/new" />
            <Route element={<EditGamePage />} path="games/edit/:id" />
            <Route element={<AdminReportsPage />} path="games/reports" />
            <Route element={<AdminCoinManagement />} path="coins" />
            <Route element={<AdminSystem />} path="system" />
          </Route>
          <Route element={<Support />} path="support" />
          <Route element={<Terms />} path="terms" />
          <Route element={<Privacy />} path="privacy" />
          <Route element={<Guidelines />} path="guidelines" />
          <Route element={<Copyright />} path="copyright" />
          <Route element={<ProductPage />} path="products/:slug" />
          <Route element={<PremiumPage />} path="premium" />
          <Route element={<PremiumRegistration />} path="premium-registration" />
          <Route element={<PremiumTestPage />} path="premium-test" />
          <Route element={<ProDashboard />} path="onchain-dashboard" />
          <Route element={<Custom404 />} path="*" />
        </Route>
      </RouterRoutes>
    </BrowserRouter>
  );
};

export default Routes;
