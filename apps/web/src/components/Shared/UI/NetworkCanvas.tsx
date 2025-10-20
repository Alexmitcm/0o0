import { useEffect, useRef } from "react";

export function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const nodesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }>
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Reinitialize nodes when canvas is resized
      nodesRef.current = Array.from({ length: 20 }, () => ({
        radius: Math.random() * 1 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        x: Math.random() * width,
        y: Math.random() * height
      }));
    };

    const drawNetwork = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      for (const [index, node] of nodesRef.current.entries()) {
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(138, 43, 226, 0.6)";
        ctx.fill();

        // Draw connections
        for (const [targetIndex, target] of nodesRef.current.entries()) {
          if (index !== targetIndex) {
            const distance = Math.hypot(node.x - target.x, node.y - target.y);
            if (distance < 50) {
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(target.x, target.y);
              ctx.strokeStyle = `rgba(24, 224, 208, ${0.2 - (distance / 50) * 0.2})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Keep within bounds
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
      }

      animationFrameRef.current = requestAnimationFrame(drawNetwork);
    };

    // Initial setup
    resizeCanvas();

    // Handle resize
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas.parentElement as Element);

    // Start animation
    drawNetwork();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas className="absolute inset-0" ref={canvasRef} />;
}
