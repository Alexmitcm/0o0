import type { Context } from "hono";
import { getAuthContext } from "../../context/authContext";
import prisma from "../../prisma/client";

export const getGame = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    console.log(`[DEBUG] Looking for game with slug: ${slug}`);

    // Get user address from authentication context
    const { walletAddress } = getAuthContext(c);
    const userAddress = walletAddress || null; // Use null if not authenticated

    let game = null;
    try {
      game = await prisma.game.findUnique({
        include: {
          categories: true,
          GameScreenshot: true,
          GameTag: true
        },
        where: { slug }
      });
    } catch (dbError) {
      console.log("[DEBUG] Database query failed, using fallback:", dbError);
      // Database connection failed, we'll use fallback
    }

    console.log("[DEBUG] Game found:", game ? `Yes (${game.title})` : "No");

    if (!game) {
      // Fallback: return a placeholder game for sample/fallback slugs or games from games-main directory
      if (
        slug.startsWith("sample-game-") ||
        slug.startsWith("fallback-") ||
        [
          "air-command",
          "backgammon",
          "chess",
          "downhills",
          "goldminer",
          "gold-miner",
          "golkeeper",
          "gunfight",
          "liquidsort",
          "liquid-sort-puzzle",
          "stackbuilder",
          "sudoku",
          "tennis",
          "top-jump",
          "treasurehunt"
        ].includes(slug)
      ) {
        const now = new Date();
        // Enhanced fallback data based on slug
        const gameData = {
          categories:
            slug === "liquid-sort-puzzle"
              ? [
                  {
                    description: "",
                    icon: "🧩",
                    id: "puzzle",
                    name: "Puzzle",
                    slug: "puzzle"
                  }
                ]
              : slug === "gold-miner" || slug === "goldminer"
                ? [
                    {
                      description: "Action-packed mining adventures",
                      icon: "⛏️",
                      id: "action",
                      name: "Action",
                      slug: "action"
                    }
                  ]
                : [],
          createdAt: now.toISOString(),
          description:
            slug === "liquid-sort-puzzle"
              ? "A challenging puzzle game where you sort colored liquids into matching containers. Use strategy and logic to solve increasingly difficult levels!"
              : slug === "gold-miner" || slug === "goldminer"
                ? "Mine for gold and precious gems in this exciting action game! Use your mining skills to collect treasures and avoid obstacles."
                : "Sample game placeholder",
          gameFileUrl:
            slug === "air-command"
              ? "/games-main/AirCommand/index.html"
              : slug === "liquid-sort-puzzle"
                ? "/games-main/liquidSort/index.html"
                : slug === "gold-miner" || slug === "goldminer"
                  ? "/games-main/GoldMiner/index.html"
                  : "",
          height: 720,
          id: slug.startsWith("fallback-") ? slug : `fallback-${slug}`,
          instructions:
            slug === "liquid-sort-puzzle"
              ? "Click and drag to pour liquids between containers. Sort all liquids by color to complete each level!"
              : slug === "gold-miner" || slug === "goldminer"
                ? "Use mouse to aim and click to shoot your hook. Collect gold and gems while avoiding rocks!"
                : "Use arrow keys to move",
          isFeatured: slug === "liquid-sort-puzzle" || slug === "gold-miner" || slug === "goldminer",
          likeCount: slug === "liquid-sort-puzzle" ? 42 : slug === "gold-miner" || slug === "goldminer" ? 38 : 0,
          playCount: slug === "liquid-sort-puzzle" ? 156 : slug === "gold-miner" || slug === "goldminer" ? 89 : 0,
          rating: slug === "liquid-sort-puzzle" ? 4.2 : slug === "gold-miner" || slug === "goldminer" ? 4.0 : 0,
          ratingCount: slug === "liquid-sort-puzzle" ? 23 : slug === "gold-miner" || slug === "goldminer" ? 18 : 0,
          slug,
          source: "Self",
          status: "Published",
          tags:
            slug === "liquid-sort-puzzle"
              ? ["puzzle", "strategy", "logic", "colorful"]
              : slug === "gold-miner" || slug === "goldminer"
                ? ["action", "mining", "adventure", "arcade"]
                : [],
          thumb1Url:
            slug === "liquid-sort-puzzle"
              ? "/uploads/games/liquidSort/thumbnail.jpg"
              : slug === "gold-miner" || slug === "goldminer"
                ? "/uploads/games/GoldMiner/thumbnail.jpg"
                : "https://picsum.photos/512/384?random=10",
          thumb2Url:
            slug === "liquid-sort-puzzle"
              ? "/uploads/games/liquidSort/icon.png"
              : slug === "gold-miner" || slug === "goldminer"
                ? "/uploads/games/GoldMiner/icon.png"
                : "https://picsum.photos/512/512?random=10",
          title:
            slug === "liquid-sort-puzzle"
              ? "Liquid Sort Puzzle"
              : slug === "gold-miner" || slug === "goldminer"
                ? "Gold Miner"
                : slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
          updatedAt: now.toISOString(),
          user: {
            avatarUrl: "https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=G",
            displayName: "Game Developer",
            username: "dev",
            walletAddress: "0x000..."
          },
          userLike: false,
          userRating: null,
          width: 1280
        };

        return c.json({ game: gameData });
      }

      return c.json({ error: "Game not found" }, 404);
    }

    if (game.status !== "Published") {
      return c.json({ error: "Game is not available" }, 404);
    }

    // Get user's like, dislike, and rating status (only if user is authenticated)
    let userLike = null;
    let userDislike = null;
    let userRating = null;

    if (userAddress) {
      try {
        [userLike, userDislike, userRating] = await Promise.all([
          prisma.gameLike.findUnique({
            where: {
              gameId_userAddress: {
                gameId: game.id,
                userAddress
              }
            }
          }),
          prisma.gameDislike.findUnique({
            where: {
              gameId_userAddress: {
                gameId: game.id,
                userAddress
              }
            }
          }),
          prisma.gameRating.findUnique({
            where: {
              gameId_userAddress: {
                gameId: game.id,
                userAddress
              }
            }
          })
        ]);
      } catch (dbError) {
        console.log("[DEBUG] User interaction query failed:", dbError);
        // Continue without user interaction data
      }
    }

    // Transform game to match expected frontend format
    const transformedGame = {
      categories: Array.isArray(game.categories)
        ? game.categories.map((cat: any) => ({
            description: "",
            icon: "🎮",
            id: cat.id,
            name: cat.name,
            slug: cat.name.toLowerCase().replace(/\s+/g, "-")
          }))
        : [],
      createdAt: game.createdAt.toISOString(),
      description: game.description,
      dislikeCount: (game as any).dislikeCount || 0,
      entryFilePath: (game as any).entryFilePath ?? "index.html",
      gameFileUrl: game.packageUrl,
      height: game.height,
      id: game.id,
      instructions: game.instructions,
      isFeatured: false,
      likeCount: (game as any).likeCount || 0,
      playCount: (game as any).playCount || 0,
      rating: (game as any).rating || 0,
      ratingCount: (game as any).ratingCount || 0,
      slug: game.slug,
      source: "Self",
      status: game.status,
      tags: Array.isArray(game.GameTag)
        ? game.GameTag.map((tag: any) => tag.name)
        : [],
      thumb1Url: game.coverImageUrl,
      thumb2Url: game.iconUrl,
      title: game.title,
      updatedAt: game.updatedAt.toISOString(),
      user: {
        avatarUrl: "https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=G",
        displayName: "Unknown Developer",
        username: "Unknown",
        walletAddress: "0x000..."
      },
      userDislike: !!userDislike,
      userLike: !!userLike,
      userRating: userRating?.rating || null,
      width: game.width
    };

    return c.json({ game: transformedGame });
  } catch (error) {
    console.error("Get game error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
