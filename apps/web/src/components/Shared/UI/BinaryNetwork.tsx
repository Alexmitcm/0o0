import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  saturation: number;
  lightness: number;
  baseX: number;
  baseY: number;
}

interface NetworkProps {
  className?: string;
}

export function BinaryNetwork({ className = "" }: NetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const nodesRef = useRef<Node[]>([]);
  const mirroredNodesRef = useRef<Node[]>([]);
  const animationFrameRef = useRef<number>(0);
  const gridRef = useRef<Map<string, Node[]>>(new Map());
  const lastTimeRef = useRef<number>(0);

  // Spatial partitioning helper functions
  const getGridCell = (x: number, y: number) => {
    const cellSize = 150;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);
    return `${gridX},${gridY}`;
  };

  const updateGrid = (nodes: Node[]) => {
    const grid = new Map<string, Node[]>();
    for (const node of nodes) {
      const cell = getGridCell(node.x, node.y);
      if (!grid.has(cell)) {
        grid.set(cell, []);
      }
      grid.get(cell)?.push(node);
    }
    return grid;
  };

  const getNearbyNodes = (x: number, y: number, grid: Map<string, Node[]>) => {
    const centerCell = getGridCell(x, y);
    const [centerX, centerY] = centerCell.split(",").map(Number);
    const nearby: Node[] = [];

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const cell = `${centerX + dx},${centerY + dy}`;
        const nodesInCell = grid.get(cell);
        if (nodesInCell) {
          nearby.push(...nodesInCell);
        }
      }
    }

    return nearby;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleResize = () => {
      const { width, height } =
        canvas.parentElement?.getBoundingClientRect() || {
          height: 0,
          width: 0
        };
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      const nodeCount = 300; // Increased node count for denser network
      const colorRanges = [
        { hue: 280, spread: 40 }, // Purple range
        { hue: 180, spread: 40 }, // Cyan range
        { hue: 330, spread: 40 }, // Pink range
        { hue: 140, spread: 40 }, // Green range
        { hue: 60, spread: 30 }, // Yellow range
        { hue: 0, spread: 30 } // Red range
      ];

      nodesRef.current = Array.from({ length: nodeCount }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const colorRange =
          colorRanges[Math.floor(Math.random() * colorRanges.length)];
        const hue =
          colorRange.hue + (Math.random() * 2 - 1) * colorRange.spread;

        return {
          baseX: x,
          baseY: y,
          hue,
          lightness: 60 + Math.random() * 15,
          saturation: 85 + Math.random() * 15,
          size: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          x,
          y
        };
      });

      mirroredNodesRef.current = nodesRef.current.map((node) => ({
        ...node,
        baseX: width - node.baseX,
        x: width - node.x
      }));
    };

    const drawNode = (node: Node, ctx: CanvasRenderingContext2D) => {
      const mouseDistance = Math.hypot(
        mouseRef.current.x - node.x,
        mouseRef.current.y - node.y
      );
      const mouseInfluence = Math.max(0, 1 - mouseDistance / 400); // Increased influence radius

      const adjustedSaturation =
        mouseInfluence > 0.5
          ? node.saturation * (1 - mouseInfluence) // Fade to white near mouse
          : node.saturation + mouseInfluence * 15;
      const adjustedLightness = node.lightness + mouseInfluence * 40; // Much brighter near mouse

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size * (1 + mouseInfluence), 0, Math.PI * 2);

      if (mouseInfluence > 0) {
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.size * (1 + mouseInfluence * 4)
        );
        gradient.addColorStop(
          0,
          `hsla(${node.hue}, ${adjustedSaturation}%, ${adjustedLightness}%, 1)`
        );
        gradient.addColorStop(
          1,
          `hsla(${node.hue}, ${adjustedSaturation}%, ${adjustedLightness}%, 0)`
        );
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = `hsl(${node.hue}, ${node.saturation}%, ${node.lightness}%)`;
      }

      ctx.fill();
    };

    const drawConnection = (
      node1: Node,
      node2: Node,
      ctx: CanvasRenderingContext2D,
      mouseDistance: number
    ) => {
      const dx = node2.x - node1.x;
      const dy = node2.y - node1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 180) {
        // Increased connection distance
        const mouseInfluence = Math.max(0, 1 - mouseDistance / 400); // Increased influence radius

        // Transition to pure white near mouse
        const whiteTransition = Math.min(1, mouseInfluence * 2);
        const adjustedSaturation =
          mouseInfluence > 0.3
            ? Math.max(0, (1 - whiteTransition) * 100) // Fade to white
            : 100; // Full saturation otherwise

        const adjustedLightness = 50 + mouseInfluence * 50; // Much brighter near mouse

        // Thicker connections
        const baseThickness = 1.5 + (1 - distance / 180) * 3;
        const maxThickness = 20; // Increased maximum thickness
        const thickness = Math.min(
          baseThickness + mouseInfluence * (maxThickness - baseThickness),
          maxThickness
        );

        const gradient = ctx.createLinearGradient(
          node1.x,
          node1.y,
          node2.x,
          node2.y
        );
        const alpha = (1 - distance / 180) * (0.6 + mouseInfluence * 0.4);

        if (mouseInfluence > 0.3) {
          // Transition to white gradient
          gradient.addColorStop(
            0,
            `rgba(255, 255, 255, ${alpha * whiteTransition})`
          );
          gradient.addColorStop(
            0.5,
            `rgba(255, 255, 255, ${alpha * whiteTransition * 1.2})`
          );
          gradient.addColorStop(
            1,
            `rgba(255, 255, 255, ${alpha * whiteTransition})`
          );
        } else {
          // Colored gradient
          gradient.addColorStop(
            0,
            `hsla(${node1.hue}, ${adjustedSaturation}%, ${adjustedLightness}%, ${alpha})`
          );
          gradient.addColorStop(
            0.5,
            `hsla(${(node1.hue + node2.hue) / 2}, ${adjustedSaturation}%, ${adjustedLightness + 10}%, ${alpha})`
          );
          gradient.addColorStop(
            1,
            `hsla(${node2.hue}, ${adjustedSaturation}%, ${adjustedLightness}%, ${alpha})`
          );
        }

        ctx.beginPath();
        ctx.moveTo(node1.x, node1.y);
        ctx.lineTo(node2.x, node2.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = thickness;

        // Enhanced glow effect
        if (mouseInfluence > 0.2) {
          ctx.shadowColor =
            whiteTransition > 0.5
              ? `rgba(255, 255, 255, ${mouseInfluence})`
              : `hsla(${(node1.hue + node2.hue) / 2}, 90%, 75%, ${mouseInfluence})`;
          ctx.shadowBlur = 25 * mouseInfluence;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
    };

    const updateNodePosition = (
      node: Node,
      width: number,
      height: number,
      deltaTime: number
    ) => {
      node.x += node.vx * deltaTime;
      node.y += node.vy * deltaTime;

      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      node.x = Math.max(0, Math.min(width, node.x));
      node.y = Math.max(0, Math.min(height, node.y));

      const dx = mouseRef.current.x - node.x;
      const dy = mouseRef.current.y - node.y;
      const mouseDistance = Math.sqrt(dx * dx + dy * dy);

      if (mouseDistance < 400) {
        // Increased attraction radius
        const force = (400 - mouseDistance) / 400;
        const angle = Math.atan2(dy, dx);
        node.x += Math.cos(angle) * force * 5; // Stronger attraction
        node.y += Math.sin(angle) * force * 5;
      }

      const easingFactor = 0.05;
      node.x += (node.baseX - node.x) * easingFactor;
      node.y += (node.baseY - node.y) * easingFactor;
    };

    const animate = (timestamp: number) => {
      const deltaTime = (timestamp - lastTimeRef.current) / 16;
      lastTimeRef.current = timestamp;

      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Update positions
      for (const node of nodesRef.current) {
        updateNodePosition(node, width, height, deltaTime);
      }
      for (const node of mirroredNodesRef.current) {
        updateNodePosition(node, width, height, deltaTime);
      }

      // Update grid
      gridRef.current = updateGrid([
        ...nodesRef.current,
        ...mirroredNodesRef.current
      ]);

      // Draw connections with enhanced blending
      ctx.globalCompositeOperation = "screen";
      for (const node of [...nodesRef.current, ...mirroredNodesRef.current]) {
        const nearbyNodes = getNearbyNodes(node.x, node.y, gridRef.current!);
        for (const otherNode of nearbyNodes) {
          if (node !== otherNode) {
            const mouseDistance = Math.hypot(
              mouseRef.current.x - (node.x + otherNode.x) / 2,
              mouseRef.current.y - (node.y + otherNode.y) / 2
            );
            drawConnection(node, otherNode, ctx, mouseDistance);
          }
        }
      }

      // Draw nodes
      ctx.globalCompositeOperation = "source-over";
      for (const node of [...nodesRef.current, ...mirroredNodesRef.current]) {
        drawNode(node, ctx);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Setup
    canvas.addEventListener("mousemove", handleMouseMove);
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas.parentElement as Element);
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      className={`h-full w-full ${className}`}
      ref={canvasRef}
      style={{ touchAction: "none" }}
    />
  );
}
