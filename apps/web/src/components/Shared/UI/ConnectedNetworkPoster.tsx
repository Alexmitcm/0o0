import type React from "react";
import { useEffect, useRef } from "react";

interface ConnectedNetworkPosterProps {
  className?: string;
  showLocalStars?: boolean;
  density?: number;
  intensity?: number;
  isActive?: boolean;
  maxNeighbors?: number;
  targetFps?: number;
  pixelRatio?: number;
  adaptive?: boolean;
  minFps?: number;
  maxFpsCeil?: number;
  adaptEveryMs?: number;
}

const ConnectedNetworkPoster: React.FC<ConnectedNetworkPosterProps> = ({
  className = "",
  showLocalStars = false,
  density = 16,
  intensity = 0.6,
  isActive = true,
  maxNeighbors = 3,
  targetFps = 60,
  pixelRatio = 1,
  adaptive = true,
  minFps = 24,
  maxFpsCeil = 58,
  adaptEveryMs = 1200
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const pointsRef = useRef<Array<any>>([]);
  const targetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animIdRef = useRef<number | null>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const starsRef = useRef<Array<{ x: number; y: number; a: number }>>([]);
  const lastFrameRef = useRef<number>(0);
  const sizeRef = useRef<{ width: number; height: number }>({
    height: 0,
    width: 0
  });
  const lastPointerUpdateRef = useRef<number>(0);

  const GRID_DIV = Math.max(6, Math.min(36, Math.floor(density)));
  const MAX_NEI = Math.max(2, Math.min(5, Math.floor(maxNeighbors)));

  const currentTargetFpsRef = useRef<number>(targetFps);
  const drawStrideRef = useRef<number>(1);
  const framesSinceAdaptRef = useRef<number>(0);
  const lastAdaptRef = useRef<number>(performance.now());

  const distanceSq = (
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  };

  const easeCircInOut = (t: number) => {
    return t < 0.5
      ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2
      : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2;
  };

  const drawStaticBackground = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const { width, height } = sizeRef.current;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // simple gradient backdrop (draw once)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#0a0d14");
    grad.addColorStop(1, "#0b1220");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // stars (static)
    if (starsRef.current.length) {
      ctx.globalCompositeOperation = "lighter";
      for (const s of starsRef.current) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 0.8, 0, Math.PI * 2, false);
        ctx.fillStyle = `rgba(180,220,255,${s.a})`;
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  };

  const init = () => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();

    // scale canvas with a controlled pixel ratio for performance
    const DPR = Math.max(0.75, Math.min(2, pixelRatio));
    canvas.style.width = `${Math.max(1, Math.floor(rect.width))}px`;
    canvas.style.height = `${Math.max(1, Math.floor(rect.height))}px`;
    canvas.width = Math.max(1, Math.floor(rect.width * DPR));
    canvas.height = Math.max(1, Math.floor(rect.height * DPR));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (DPR !== 1) ctx.scale(DPR, DPR);
    ctxRef.current = ctx;

    // CSS pixel size cache
    sizeRef.current = { height: rect.height, width: rect.width };

    // build stars backdrop (static)
    const width = rect.width;
    const height = rect.height;
    const stars: Array<{ x: number; y: number; a: number }> = [];
    const starCount = showLocalStars ? Math.round((width * height) / 32000) : 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        a: 0.1 + Math.random() * 0.18,
        x: Math.random() * width,
        y: Math.random() * height
      });
    }
    starsRef.current = stars;

    // create points (grid with jitter)
    const pts: any[] = [];
    for (let x = 0; x < width; x += width / GRID_DIV) {
      for (let y = 0; y < height; y += height / GRID_DIV) {
        const px = x + Math.random() * (width / GRID_DIV);
        const py = y + Math.random() * (height / GRID_DIV);
        pts.push({
          active: 0,
          circleActive: 0,
          destX: px,
          destY: py,
          dur: 1200 + Math.random() * 1000,
          originX: px,
          originY: py,
          startT: performance.now(),
          startX: px,
          startY: py,
          x: px,
          y: py
        });
      }
    }

    // find closest neighbors (reduced)
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const closest: any[] = [];
      for (let j = 0; j < pts.length; j++) {
        const p2 = pts[j];
        if (p1 === p2) continue;
        if (closest.length < MAX_NEI) {
          closest.push(p2);
          if (closest.length === MAX_NEI) {
            closest.sort((a, b) => distanceSq(p1, a) - distanceSq(p1, b));
          }
        } else {
          const d = distanceSq(p1, p2);
          const dMax = distanceSq(p1, closest[MAX_NEI - 1]);
          if (d < dMax) {
            closest[MAX_NEI - 1] = p2;
            closest.sort((a, b) => distanceSq(p1, a) - distanceSq(p1, b));
          }
        }
      }
      p1.closest = closest;
      p1.radius = 1.4 + Math.random() * 1.2;
    }

    pointsRef.current = pts;
    targetRef.current = { x: width / 2, y: height / 2 };

    drawStaticBackground();
    lastFrameRef.current = 0;
    framesSinceAdaptRef.current = 0;
    lastAdaptRef.current = performance.now();
    currentTargetFpsRef.current = targetFps;
    drawStrideRef.current = 1;
  };

  const scheduleShift = (p: any) => {
    p.startX = p.x;
    p.startY = p.y;
    p.destX = p.originX - 36 + Math.random() * 72;
    p.destY = p.originY - 36 + Math.random() * 72;
    p.startT = performance.now();
    p.dur = 1200 + Math.random() * 1200;
  };

  const step = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const pts = pointsRef.current;
    if (!canvas || !ctx || !pts.length) return;

    // FPS limiter (adaptive)
    const now = performance.now();
    const minDelta = 1000 / Math.max(1, currentTargetFpsRef.current);
    if (now - lastFrameRef.current < minDelta) {
      animIdRef.current = requestAnimationFrame(step);
      return;
    }
    lastFrameRef.current = now;

    const { width, height } = sizeRef.current;

    // clear current frame cheaply (keep static bg out of the loop)
    ctx.clearRect(0, 0, width, height);

    // glow lines + nodes
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // idle orbit for target when no pointer movement
    const baseNow = performance.now();
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.14;
    const idleX = cx + Math.cos(baseNow * 0.003) * r;
    const idleY = cy + Math.sin(baseNow * 0.003) * r;
    const target = targetRef.current;
    const tx = target.x || idleX;
    const ty = target.y || idleY;

    // dynamic thresholds based on canvas size
    const baseR = Math.min(width, height);
    const r1 = (baseR * 0.2) ** 2;
    const r2 = (baseR * 0.34) ** 2;
    const r3 = (baseR * 0.5) ** 2;

    const intensityFactor = Math.max(0, Math.min(1, intensity));

    // update all points, draw subsampled for performance
    const stride = Math.max(1, Math.floor(drawStrideRef.current));
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      // update point tween
      const t = Math.min(1, (now - p.startT) / p.dur);
      const tween = easeCircInOut(t);
      p.x = p.startX + (p.destX - p.startX) * tween;
      p.y = p.startY + (p.destY - p.startY) * tween;
      if (t >= 1) scheduleShift(p);

      if (i % stride !== 0) continue; // skip drawing for subsampled points

      // set activity based on distance to target
      const d = distanceSq({ x: tx, y: ty }, p);
      if (d < r1) {
        p.active = 0.2 * intensityFactor;
        p.circleActive = 0.3 * intensityFactor;
      } else if (d < r2) {
        p.active = 0.09 * intensityFactor;
        p.circleActive = 0.18 * intensityFactor;
      } else if (d < r3) {
        p.active = 0.045 * intensityFactor;
        p.circleActive = 0.1 * intensityFactor;
      } else {
        p.active = 0.012 * intensityFactor;
        p.circleActive = 0.05 * intensityFactor;
      }

      // draw lines to closest
      const alpha = p.active;
      if (alpha > 0) {
        ctx.lineWidth = 0.35 + alpha * 0.9;
        for (const q of p.closest as any[]) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(156,217,249,${alpha})`;
          ctx.stroke();
        }
      }
      // draw node circle
      if (p.circleActive > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = `rgba(156,217,249,${p.circleActive})`;
        ctx.fill();
      }
    }

    ctx.restore();

    // adaptive tuning window
    if (adaptive) {
      framesSinceAdaptRef.current += 1;
      const elapsed = now - lastAdaptRef.current;
      if (elapsed >= adaptEveryMs) {
        const fps = (framesSinceAdaptRef.current * 1000) / Math.max(1, elapsed);
        if (fps < minFps) {
          // degrade gently
          drawStrideRef.current = Math.min(3, drawStrideRef.current + 1);
          currentTargetFpsRef.current = Math.max(
            24,
            currentTargetFpsRef.current - 6
          );
        } else if (fps > maxFpsCeil) {
          // restore quality
          drawStrideRef.current = Math.max(1, drawStrideRef.current - 1);
          currentTargetFpsRef.current = Math.min(
            60,
            currentTargetFpsRef.current + 6
          );
        }
        framesSinceAdaptRef.current = 0;
        lastAdaptRef.current = now;
      }
    }

    if (isActive) {
      animIdRef.current = requestAnimationFrame(step);
    }
  };

  useEffect(() => {
    init();
    drawStaticBackground();
    if (isActive) {
      animIdRef.current = requestAnimationFrame(step);
    }

    const onPointerMove = (e: PointerEvent | MouseEvent | TouchEvent) => {
      const now = performance.now();
      if (now - lastPointerUpdateRef.current < 50) return; // throttle 20Hz
      lastPointerUpdateRef.current = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      let cx2 = 0;
      let cy2 = 0;
      if (e instanceof TouchEvent) {
        const t = e.touches[0];
        if (!t) return;
        cx2 = t.clientX;
        cy2 = t.clientY;
      } else if (
        e instanceof MouseEvent ||
        (e as PointerEvent).clientX !== undefined
      ) {
        const me = e as MouseEvent;
        cx2 = me.clientX;
        cy2 = me.clientY;
      }
      targetRef.current = { x: cx2 - rect.left, y: cy2 - rect.top };
    };

    const onResize = () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      init();
      drawStaticBackground();
      if (isActive) animIdRef.current = requestAnimationFrame(step);
    };

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove as any, {
      passive: true
    });
    window.addEventListener("resize", onResize);

    if (wrapperRef.current) {
      resizeObsRef.current = new ResizeObserver(() => onResize());
      resizeObsRef.current.observe(wrapperRef.current);
    }

    const onVisibility = () => {
      if (document.hidden && animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      } else if (!document.hidden && isActive && !animIdRef.current) {
        animIdRef.current = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove as any);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (resizeObsRef.current && wrapperRef.current) {
        resizeObsRef.current.unobserve(wrapperRef.current);
      }
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isActive && animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    } else if (isActive && !animIdRef.current) {
      animIdRef.current = requestAnimationFrame(step);
    }
  }, [isActive]);

  return (
    <div className={`relative h-full w-full ${className}`} ref={wrapperRef}>
      <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />
    </div>
  );
};

export default ConnectedNetworkPoster;
