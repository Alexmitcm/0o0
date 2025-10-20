import { useEffect, useRef } from "react";
import StaticNetworkBackground from "./StaticNetworkBackground";

interface NetworkBackgroundProps {
  className?: string;
  nodeCount?: number;
  connectionDistance?: number;
  animationSpeed?: number;
  enabled?: boolean;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const NetworkBackground = ({
  className = "",
  nodeCount = 25, // Reduced from 50
  connectionDistance = 100, // Reduced from 120
  animationSpeed = 0.2, // Reduced from 0.5
  enabled = true
}: NetworkBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const lastFrameTime = useRef<number>(0);
  const targetFPS = 30; // Limit FPS to 30
  const frameInterval = 1000 / targetFPS;

  // Check conditions that would prevent animation
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isLowEndDevice =
    typeof navigator !== "undefined" &&
    (navigator.hardwareConcurrency <= 2 ||
      (navigator as any).deviceMemory <= 2 ||
      (navigator as any).connection?.effectiveType === "slow-2g" ||
      (navigator as any).connection?.effectiveType === "2g");

  const shouldUseStatic = !enabled || prefersReducedMotion || isLowEndDevice;

  useEffect(() => {
    if (shouldUseStatic) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const initNodes = () => {
      nodesRef.current = Array.from({ length: nodeCount }, () => ({
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * animationSpeed,
        vy: (Math.random() - 0.5) * animationSpeed,
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight
      }));
    };

    const drawNode = (node: Node) => {
      // Create sophisticated glow effect
      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        node.radius * 4
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(0.3, "rgba(6, 182, 212, 0.5)");
      gradient.addColorStop(0.7, "rgba(139, 92, 246, 0.3)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw bright core
      ctx.fillStyle = "rgba(255, 255, 255, 1)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Add subtle outer ring
      ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawConnection = (node1: Node, node2: Node, distance: number) => {
      const opacity = Math.max(
        0,
        (connectionDistance - distance) / connectionDistance
      );

      // Create flowing energy line effect
      const gradient = ctx.createLinearGradient(
        node1.x,
        node1.y,
        node2.x,
        node2.y
      );
      gradient.addColorStop(0, `rgba(6, 182, 212, ${opacity * 0.4})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.6})`);
      gradient.addColorStop(1, `rgba(139, 92, 246, ${opacity * 0.4})`);

      // Draw main line
      ctx.strokeStyle = gradient;
      ctx.lineWidth = opacity * 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(node1.x, node1.y);
      ctx.lineTo(node2.x, node2.y);
      ctx.stroke();

      // Add subtle glow effect
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
      ctx.lineWidth = opacity * 4;
      ctx.beginPath();
      ctx.moveTo(node1.x, node1.y);
      ctx.lineTo(node2.x, node2.y);
      ctx.stroke();
    };

    const updateNodes = () => {
      nodesRef.current.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x <= 0 || node.x >= canvas.offsetWidth) {
          node.vx *= -1;
          node.x = Math.max(0, Math.min(canvas.offsetWidth, node.x));
        }
        if (node.y <= 0 || node.y >= canvas.offsetHeight) {
          node.vy *= -1;
          node.y = Math.max(0, Math.min(canvas.offsetHeight, node.y));
        }
      });
    };

    const animate = (currentTime: number) => {
      // FPS limiting
      if (currentTime - lastFrameTime.current < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime.current = currentTime;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      updateNodes();

      // Simplified connection drawing - only draw every other connection for performance
      for (let i = 0; i < nodesRef.current.length; i += 2) {
        for (let j = i + 2; j < nodesRef.current.length; j += 2) {
          const node1 = nodesRef.current[i];
          const node2 = nodesRef.current[j];
          const distance = Math.sqrt(
            (node1.x - node2.x) ** 2 + (node1.y - node2.y) ** 2
          );

          if (distance < connectionDistance) {
            drawConnection(node1, node2, distance);
          }
        }
      }

      // Draw nodes
      nodesRef.current.forEach(drawNode);

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      resizeCanvas();
      initNodes();
    };

    // Initialize
    resizeCanvas();
    initNodes();
    animationRef.current = requestAnimationFrame(animate);

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [nodeCount, connectionDistance, animationSpeed, shouldUseStatic]);

  // Use static background for low-end devices or when animations are disabled
  if (shouldUseStatic) {
    return <StaticNetworkBackground className={className} />;
  }

  return (
    <canvas
      className={`absolute inset-0 ${className}`}
      ref={canvasRef}
      style={{
        background: "transparent",
        pointerEvents: "none"
      }}
    />
  );
};

export default NetworkBackground;
