import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Node {
  position: THREE.Vector3;
  connections: Array<{ node: Node; strength: number }>;
  level: number;
  type: number;
  size: number;
  distanceFromRoot: number;
  clusterRef?: Node;
  dimension?: number;
  spiralIndex?: number;
  spiralPosition?: number;
  addConnection: (node: Node, strength?: number) => void;
  isConnectedTo: (node: Node) => boolean;
}

interface NetworkConfig {
  paused: boolean;
  activePaletteIndex: number;
  currentFormation: number;
  numFormations: number;
  densityFactor: number;
}

interface InteractiveNeuralBackgroundProps {
  className?: string;
  /**
   * When true, renderer sizes to parent container instead of the window.
   */
  fitContainer?: boolean;
  /**
   * When false, disables internal starfield; useful if a separate space layer exists.
   */
  showStarfield?: boolean;
  /**
   * Show fixed center logo overlay. Disable when embedding inside panels.
   */
  showCenterLogo?: boolean;
  /**
   * When 'fit', scales the network to fit the container using reference size.
   */
  scaleMode?: "fit" | "base";
}

export function InteractiveNeuralBackground({
  className = "",
  fitContainer = false,
  showStarfield = true,
  showCenterLogo = true,
  scaleMode = "base"
}: InteractiveNeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const neuralNetworkRef = useRef<{ nodes: Node[]; rootNode: Node } | null>(
    null
  );
  const nodesMeshRef = useRef<THREE.Points | null>(null);
  const connectionsMeshRef = useRef<THREE.LineSegments | null>(null);
  const controlsRef = useRef<any>(null);
  const lastPulseIndexRef = useRef(0);
  const lastPointerPulseTimeRef = useRef(0);
  const pathGroupRef = useRef<THREE.Group | null>(null);
  const activePathAnimationsRef = useRef<
    Array<{
      line: THREE.Line | THREE.LineSegments;
      points?: THREE.Points;
      total: number;
      start: number;
      duration: number;
    }>
  >([]);
  const starGroupRef = useRef<THREE.Group | null>(null);

  const responsiveSettingsRef = useRef({
    baseNodeSize: 1.6,
    cameraZ: 22,
    density: 1.0,
    lineAlphaScale: 0.65,
    networkScale: 0.8,
    pixelRatioMax: 2,
    starCount: 12000,
    starScale: 1
  });

  const computeResponsiveSettings = () => {
    const container = wrapperRef.current;
    const w =
      fitContainer && container ? container.clientWidth : window.innerWidth;
    const h =
      fitContainer && container ? container.clientHeight : window.innerHeight;
    if (w < 480) {
      responsiveSettingsRef.current = {
        baseNodeSize: 1.4,
        cameraZ: 26,
        density: 0.7,
        lineAlphaScale: 0.7,
        networkScale:
          scaleMode === "fit" ? Math.min(w / 420, h / 260) * 0.85 : 0.6,
        pixelRatioMax: 1.5,
        starCount: 4500,
        starScale: 0.8
      };
    } else if (w < 768) {
      responsiveSettingsRef.current = {
        baseNodeSize: 1.5,
        cameraZ: 24,
        density: 0.8,
        lineAlphaScale: 0.7,
        networkScale:
          scaleMode === "fit" ? Math.min(w / 540, h / 320) * 0.9 : 0.7,
        pixelRatioMax: 1.75,
        starCount: 8000,
        starScale: 0.9
      };
    } else if (w < 1024) {
      responsiveSettingsRef.current = {
        baseNodeSize: 1.6,
        cameraZ: 23,
        density: 0.9,
        lineAlphaScale: 0.68,
        networkScale:
          scaleMode === "fit" ? Math.min(w / 760, h / 420) * 0.95 : 0.75,
        pixelRatioMax: 2,
        starCount: 10000,
        starScale: 0.95
      };
    } else {
      responsiveSettingsRef.current = {
        baseNodeSize: 1.8,
        cameraZ: 22,
        density: 1.0,
        lineAlphaScale: 0.65,
        networkScale: scaleMode === "fit" ? Math.min(w / 980, h / 520) : 0.8,
        pixelRatioMax: 2,
        starCount: 12000,
        starScale: 1
      };
    }
  };

  const [config] = useState<NetworkConfig>({
    activePaletteIndex: 0, // Use blue-red gradient palette
    currentFormation: 0,
    densityFactor: 1.0,
    numFormations: 4,
    paused: false
  });

  const colorPalettes = [
    [
      new THREE.Color(0x4f46e5),
      new THREE.Color(0x7c3aed),
      new THREE.Color(0xc026d3),
      new THREE.Color(0xdb2777),
      new THREE.Color(0x8b5cf6)
    ],
    [
      new THREE.Color(0xf59e0b),
      new THREE.Color(0xf97316),
      new THREE.Color(0xdc2626),
      new THREE.Color(0x7f1d1d),
      new THREE.Color(0xfbbf24)
    ],
    [
      new THREE.Color(0xec4899),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x6366f1),
      new THREE.Color(0x3b82f6),
      new THREE.Color(0xa855f7)
    ],
    [
      new THREE.Color(0x10b981),
      new THREE.Color(0xa3e635),
      new THREE.Color(0xfacc15),
      new THREE.Color(0xfb923c),
      new THREE.Color(0x4ade80)
    ]
  ];

  const pulseUniforms = {
    uActivePalette: { value: 0 },
    uBaseNodeSize: { value: 1.8 }, // Much larger size for premium quality
    uPulseColors: {
      value: [
        new THREE.Color(0x2563eb), // Premium blue
        new THREE.Color(0xdc2626), // Premium red
        new THREE.Color(0x7c3aed) // Premium purple
      ]
    },
    uPulsePositions: {
      value: [
        new THREE.Vector3(1e3, 1e3, 1e3),
        new THREE.Vector3(1e3, 1e3, 1e3),
        new THREE.Vector3(1e3, 1e3, 1e3)
      ]
    },
    uPulseSpeed: { value: 4.0 }, // Even slower pulses
    uPulseTimes: { value: [-1e3, -1e3, -1e3] },
    uTime: { value: 0.0 }
  };

  const noiseFunctions = `
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
        const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);
        vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
        vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
        float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
        vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;
        vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
        m*=m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }
    float fbm(vec3 p,float time){
        float value=0.0;float amplitude=0.5;float frequency=1.0;int octaves=3;
        for(int i=0;i<octaves;i++){
            value+=amplitude*snoise(p*frequency+time*0.2*frequency);
            amplitude*=0.5;frequency*=2.0;
        }
        return value;
    }`;

  const nodeShader = {
    fragmentShader: `
      uniform float uTime;uniform vec3 uPulseColors[3];uniform int uActivePalette;uniform float uBuildProgress;uniform float uBuildFeather;uniform vec3 uBuildDirection;uniform float uAlphaScale;
      varying vec3 vColor;varying float vNodeType;varying vec3 vPosition;varying float vPulseIntensity;varying float vDistanceFromRoot;varying float vBuildSeed;

      void main() {
          vec2 center = 2.0 * gl_PointCoord - 1.0;
          float dist = length(center);
          
          // Spider web nodes with different types
          if (dist > 1.0) discard;

          // Different glow for different node types
          float glowStrength;
          if (vNodeType < 0.5) {
              // Radial threads (spokes) - strong, solid glow
              glowStrength = 1.0 - smoothstep(0.0, 0.7, dist);
              glowStrength = pow(glowStrength, 1.3);
          } else if (vNodeType < 1.5) {
              // Spiral threads (rings) - medium glow
              glowStrength = 1.0 - smoothstep(0.0, 0.8, dist);
              glowStrength = pow(glowStrength, 1.1);
          } else {
              // Sticky droplets - soft, small glow
              glowStrength = 1.0 - smoothstep(0.0, 0.9, dist);
              glowStrength = pow(glowStrength, 0.8);
          }

          vec3 baseColor = vColor * (0.9 + 0.1 * sin(uTime * 0.5 + vDistanceFromRoot * 0.3));
          vec3 finalColor = baseColor;

          if (vPulseIntensity > 0.0) {
              // Enhanced pulse effect with bright white glow
              vec3 pulseColor = uPulseColors[0]; // Use the actual pulse color
              finalColor = mix(baseColor, pulseColor, vPulseIntensity * 0.8);
              // Make the glow much brighter when pulsed
              finalColor *= (1.0 + vPulseIntensity * 2.0);
              // Add extra white glow around the node
              finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), vPulseIntensity * 0.4);
          }

          // Different alpha for different node types
          float alpha;
          if (vNodeType < 0.5) {
              // Radial threads - very solid
              alpha = glowStrength * (0.98 - 0.2 * dist);
          } else if (vNodeType < 1.5) {
              // Spiral threads - medium solid
              alpha = glowStrength * (0.95 - 0.3 * dist);
              } else {
              // Sticky droplets - slightly transparent
              alpha = glowStrength * (0.9 - 0.4 * dist);
          }

          float camDistance = length(vPosition - cameraPosition);
          float distanceFade = smoothstep(80.0, 10.0, camDistance);

          // Directional build from a corner of the logo outward with randomness
          vec3 dir = normalize(uBuildDirection);
          float dirFactor = dot(dir, normalize(vPosition)) * 0.5 + 0.5; // 0..1 across direction
          float revealVal = clamp(dirFactor + (vBuildSeed - 0.5) * 0.2, 0.0, 1.0);
          float buildFactor = 1.0 - smoothstep(uBuildProgress - uBuildFeather, uBuildProgress + uBuildFeather, revealVal);

          // Enhance different node types
          if (vNodeType < 0.5) {
              // Radial threads - brightest and most solid
              finalColor *= 1.4;
              alpha *= 1.2;
          } else if (vNodeType < 1.5) {
              // Spiral threads - medium brightness
              finalColor *= 1.2;
              alpha *= 1.0;
          } else {
              // Sticky droplets - subtle glow
              finalColor *= 0.8;
              alpha *= 0.9;
          }

          // lower overall opacity per request
          gl_FragColor = vec4(finalColor * 0.85, alpha * distanceFade * buildFactor * uAlphaScale);
      }`,
    vertexShader: `${noiseFunctions}
      attribute float nodeSize;attribute float nodeType;attribute vec3 nodeColor;attribute vec3 connectionIndices;attribute float distanceFromRoot;attribute float buildSeed;
      uniform float uTime;uniform vec3 uPulsePositions[3];uniform float uPulseTimes[3];uniform float uPulseSpeed;uniform float uBaseNodeSize;
      varying vec3 vColor;varying float vNodeType;varying vec3 vPosition;varying float vPulseIntensity;varying float vDistanceFromRoot;varying float vBuildSeed;

      float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
          if (pulseTime < 0.0) return 0.0;
          float timeSinceClick = uTime - pulseTime;
          if (timeSinceClick < 0.0 || timeSinceClick > 4.0) return 0.0; // Increased duration

          float pulseRadius = timeSinceClick * uPulseSpeed;
          float distToClick = distance(worldPos, pulsePos);
          float pulseThickness = 3.0; // Increased thickness for better visibility
          float waveProximity = abs(distToClick - pulseRadius);

          // Enhanced pulse curve for better visibility
          float timeCurve = smoothstep(4.0, 0.0, timeSinceClick);
          float spaceCurve = smoothstep(pulseThickness, 0.0, waveProximity);
          
          return spaceCurve * timeCurve * 1.5; // Increased intensity
      }

      void main() {
          vNodeType = nodeType;
          vColor = nodeColor;
          vDistanceFromRoot = distanceFromRoot;
          vBuildSeed = buildSeed;

          vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vPosition = worldPos;

          float totalPulseIntensity = 0.0;
          for (int i = 0; i < 3; i++) {
              totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
          }
          vPulseIntensity = min(totalPulseIntensity, 1.0);

          // Different animation for different node types
          float timeScale;
          if (nodeType < 0.5) {
              // Radial threads - slow, steady pulse
              timeScale = 0.7 + 0.3 * sin(uTime * 0.6 + distanceFromRoot * 0.1);
          } else if (nodeType < 1.5) {
              // Spiral threads - medium pulse
              timeScale = 0.8 + 0.2 * sin(uTime * 0.8 + distanceFromRoot * 0.2);
          } else {
              // Sticky droplets - fast, subtle pulse
              timeScale = 0.9 + 0.1 * sin(uTime * 1.2 + distanceFromRoot * 0.3);
          }

          float baseSize = nodeSize * timeScale;
          // Enhanced pulse size effect
          float pulseSize = baseSize * (1.0 + vPulseIntensity * 2.0);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = pulseSize * uBaseNodeSize * (800.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
      }`
  };

  const connectionShader = {
    fragmentShader: `
      uniform float uTime;uniform vec3 uPulseColors[3];uniform float uBuildProgress;uniform float uBuildFeather;uniform vec3 uBuildDirection;uniform float uAlphaScale;
      varying vec3 vColor;varying float vConnectionStrength;varying float vPulseIntensity;varying float vPathPosition;varying float vDistanceFromCenter;

      void main() {
          vec3 baseColor = vColor;

          // Premium flow animation with enhanced frequencies
          float flowPattern1 = sin(vPathPosition * 30.0 - uTime * 1.0) * 0.5 + 0.5;
          float flowPattern2 = sin(vPathPosition * 18.0 - uTime * 0.6) * 0.3 + 0.7;
          float flowPattern3 = sin(vPathPosition * 12.0 - uTime * 0.4) * 0.2 + 0.8;
          float flowPattern = flowPattern1 * flowPattern2 * flowPattern3;
          float flowIntensity = 0.5 * flowPattern * vConnectionStrength;

          vec3 finalColor = baseColor;

          if (vPulseIntensity > 0.0) {
              vec3 pulseColor = uPulseColors[0];
              finalColor = mix(baseColor, pulseColor, vPulseIntensity * 0.6);
              flowIntensity += vPulseIntensity * 2.2;
          }

          // Premium lighting with enhanced depth
          finalColor *= (1.0 + flowIntensity + vConnectionStrength * 0.5);

          float alpha = 0.4 * vConnectionStrength + 0.2 * flowPattern; // overall dimmer lines
          vec3 dir = normalize(uBuildDirection);
          float dirFactor = dot(dir, normalize(vec3(0.0, 0.0, 1.0))) * 0.0 + 0.5; // constant bias fallback
          float revealVal = clamp(dirFactor, 0.0, 1.0);
          float buildFactor = 1.0 - smoothstep(uBuildProgress - uBuildFeather, uBuildProgress + uBuildFeather, revealVal);
          alpha = mix(alpha, min(1.0, alpha * 2.0), vPulseIntensity);

          gl_FragColor = vec4(finalColor * 0.85, alpha * buildFactor * uAlphaScale);
      }`,
    vertexShader: `${noiseFunctions}
      attribute vec3 startPoint;attribute vec3 endPoint;attribute float connectionStrength;attribute float pathIndex;attribute vec3 connectionColor;
      uniform float uTime;uniform vec3 uPulsePositions[3];uniform float uPulseTimes[3];uniform float uPulseSpeed;
      varying vec3 vColor;varying float vConnectionStrength;varying float vPulseIntensity;varying float vPathPosition;varying float vDistanceFromCenter;

      float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
          if (pulseTime < 0.0) return 0.0;
          float timeSinceClick = uTime - pulseTime;
          if (timeSinceClick < 0.0 || timeSinceClick > 3.0) return 0.0;
          float pulseRadius = timeSinceClick * uPulseSpeed;
          float distToClick = distance(worldPos, pulsePos);
          float pulseThickness = 2.0;
          float waveProximity = abs(distToClick - pulseRadius);
          return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(3.0, 0.0, timeSinceClick);
      }

      void main() {
          float t = position.x;
          vPathPosition = t;

          vec3 midPoint = mix(startPoint, endPoint, 0.5);
          float pathOffset = sin(t * 3.14159) * 0.1;
          vec3 perpendicular = normalize(cross(normalize(endPoint - startPoint), vec3(0.0, 1.0, 0.0)));
          if (length(perpendicular) < 0.1) perpendicular = vec3(1.0, 0.0, 0.0);
          midPoint += perpendicular * pathOffset;

          vec3 p0 = mix(startPoint, midPoint, t);
          vec3 p1 = mix(midPoint, endPoint, t);
          vec3 finalPos = mix(p0, p1, t);

          float noiseTime = uTime * 0.2;
          float noise = fbm(vec3(pathIndex * 0.1, t * 0.5, noiseTime), noiseTime);
          finalPos += perpendicular * noise * 0.1;

          vec3 worldPos = (modelMatrix * vec4(finalPos, 1.0)).xyz;
          vDistanceFromCenter = length(finalPos);

          float totalPulseIntensity = 0.0;
          for (int i = 0; i < 3; i++) {
              totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
          }
          vPulseIntensity = min(totalPulseIntensity, 1.0);

          vColor = connectionColor;
          vConnectionStrength = connectionStrength;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
      }`
  };

  class NodeClass implements Node {
    position: THREE.Vector3;
    connections: Array<{ node: Node; strength: number }> = [];
    level: number;
    type: number;
    size: number;
    distanceFromRoot = 0;
    clusterRef?: Node;
    dimension?: number;
    spiralIndex?: number;
    spiralPosition?: number;

    constructor(position: THREE.Vector3, level = 0, type = 0) {
      this.position = position;
      this.level = level;
      this.type = type;
      this.size =
        type === 0
          ? THREE.MathUtils.randFloat(1.2, 2.0) // Much larger nodes
          : THREE.MathUtils.randFloat(0.8, 1.5); // Larger secondary nodes
    }

    addConnection(node: Node, strength = 1.0) {
      if (!this.isConnectedTo(node)) {
        this.connections.push({ node, strength });
        node.connections.push({ node: this, strength });
      }
    }

    isConnectedTo(node: Node): boolean {
      return this.connections.some((conn) => conn.node === node);
    }
  }

  const generateNeuralNetwork = (
    _formationIndex: number,
    densityFactor = 1.0
  ): { nodes: Node[]; rootNode: Node } => {
    let nodes: Node[] = [];
    let rootNode: Node = new NodeClass(new THREE.Vector3(0, 0, 0), 0, 0);

    const generateQuantumCortex = () => {
      rootNode = new NodeClass(new THREE.Vector3(0, 0, 0), 0, 0);
      (rootNode as NodeClass).size = 2.5; // Spider body in center
      nodes.push(rootNode);

      // Create a beautiful spider web structure that faces the user directly
      const numRadialThreads = 12; // Number of radial threads (spokes)
      const numSpiralRings = 6; // Number of spiral rings
      const maxRadius = 25; // Maximum web radius
      const webNodes: NodeClass[] = [];
      const intersectionNodes: NodeClass[] = [];

      // 1. Create radial threads (spokes) from center to edge - facing user with natural variations
      for (let i = 0; i < numRadialThreads; i++) {
        const angle = (i / numRadialThreads) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let prevNode = rootNode;
        for (let ring = 1; ring <= numSpiralRings; ring++) {
          const radius = (ring / numSpiralRings) * maxRadius;
          // Add slight natural variations while keeping front-facing view
          const naturalVariation = THREE.MathUtils.randFloatSpread(1.5);
          const pos = new THREE.Vector3(
            cos * radius + naturalVariation,
            0, // All nodes at same Y level to face user
            sin * radius + naturalVariation
          );

          const newNode = new NodeClass(pos, ring, 0); // Type 0 = radial thread
          newNode.distanceFromRoot = radius;
          newNode.size = 1.0 + (1.0 - ring / numSpiralRings) * 0.6;
          nodes.push(newNode);
          webNodes.push(newNode);

          // Connect to previous node in radial thread
          prevNode.addConnection(newNode, 0.9);
          prevNode = newNode;
        }
      }

      // 2. Create spiral threads (concentric circles) - facing user with natural variations
      for (let ring = 1; ring <= numSpiralRings; ring++) {
        const radius = (ring / numSpiralRings) * maxRadius;
        const nodesInRing = Math.floor(numRadialThreads * 2.0);

        for (let i = 0; i < nodesInRing; i++) {
          const angle = (i / nodesInRing) * Math.PI * 2;
          // Add slight natural variations
          const radiusVariation = THREE.MathUtils.randFloatSpread(1.0);
          const pos = new THREE.Vector3(
            Math.cos(angle) * (radius + radiusVariation),
            0, // All nodes at same Y level
            Math.sin(angle) * (radius + radiusVariation)
          );

          const newNode = new NodeClass(pos, ring, 1); // Type 1 = spiral thread
          newNode.distanceFromRoot = radius;
          newNode.size = 0.7 + Math.random() * 0.3;
          nodes.push(newNode);
          webNodes.push(newNode);
        }
      }

      // 3. Create intersection nodes between web threads with natural positioning
      for (let ring = 1; ring <= numSpiralRings; ring++) {
        const radius = (ring / numSpiralRings) * maxRadius;

        for (let i = 0; i < numRadialThreads; i++) {
          const radialAngle = (i / numRadialThreads) * Math.PI * 2;
          const radialPos = new THREE.Vector3(
            Math.cos(radialAngle) * radius,
            0,
            Math.sin(radialAngle) * radius
          );

          // Find closest spiral node to create intersection
          let closestSpiralNode: NodeClass | null = null;
          let minDist = Number.POSITIVE_INFINITY;

          for (const webNode of webNodes) {
            if (webNode.level === ring && webNode.type === 1) {
              const dist = webNode.position.distanceTo(radialPos);
              if (dist < minDist) {
                minDist = dist;
                closestSpiralNode = webNode;
              }
            }
          }

          if (closestSpiralNode && minDist < 3) {
            // Create intersection node with natural positioning
            const lerpFactor = 0.5 + THREE.MathUtils.randFloatSpread(0.2); // Slight natural variation
            const intersectionPos = radialPos
              .clone()
              .lerp(closestSpiralNode.position, lerpFactor);
            const intersectionNode = new NodeClass(intersectionPos, ring, 2); // Type 2 = intersection
            intersectionNode.distanceFromRoot = radius;
            intersectionNode.size = 0.8 + Math.random() * 0.4;
            nodes.push(intersectionNode);
            intersectionNodes.push(intersectionNode);

            // Connect intersection to both radial and spiral
            const radialNode = webNodes.find(
              (n) =>
                n.level === ring &&
                n.type === 0 &&
                Math.abs(n.position.x - radialPos.x) < 1.5 && // Slightly more tolerance for natural look
                Math.abs(n.position.z - radialPos.z) < 1.5
            );

            if (radialNode) {
              intersectionNode.addConnection(radialNode, 0.8);
            }
            if (closestSpiralNode) {
              intersectionNode.addConnection(closestSpiralNode, 0.8);
            }
          }
        }
      }

      // 4. Connect spiral nodes to create web circles with some natural gaps
      for (let ring = 1; ring <= numSpiralRings; ring++) {
        const ringNodes = webNodes.filter(
          (n) => n.level === ring && n.type === 1
        );
        if (ringNodes.length > 1) {
          for (let i = 0; i < ringNodes.length; i++) {
            const currentNode = ringNodes[i];
            const nextNode = ringNodes[(i + 1) % ringNodes.length];
            // Add some natural gaps (not every node connects)
            if (Math.random() < 0.85) {
              currentNode.addConnection(nextNode, 0.7);
            }
          }
        }
      }

      // 5. Add some web reinforcement strands with natural variations
      const reinforcementStrands = Math.floor(15 * densityFactor);
      for (let i = 0; i < reinforcementStrands; i++) {
        const startNode = webNodes[Math.floor(Math.random() * webNodes.length)];
        if (startNode === rootNode) continue;

        const endNode = webNodes[Math.floor(Math.random() * webNodes.length)];
        if (endNode === rootNode || endNode === startNode) continue;

        const distance = startNode.position.distanceTo(endNode.position);
        if (distance < 20 && distance > 8) {
          if (!startNode.isConnectedTo(endNode)) {
            startNode.addConnection(endNode, 0.6);
          }
        }
      }

      // 6. Add small decorative nodes along web strands with natural positioning
      const decorativeNodes = Math.floor(20 * densityFactor);
      for (let i = 0; i < decorativeNodes; i++) {
        const baseNode = webNodes[Math.floor(Math.random() * webNodes.length)];
        if (baseNode === rootNode) continue;

        const offset = new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(6),
          0, // Keep decorative nodes at same Y level
          THREE.MathUtils.randFloatSpread(6)
        );
        const decorativePos = baseNode.position.clone().add(offset);

        const decorativeNode = new NodeClass(decorativePos, baseNode.level, 3); // Type 3 = decorative
        decorativeNode.distanceFromRoot = baseNode.distanceFromRoot;
        decorativeNode.size = 0.4 + Math.random() * 0.3;
        nodes.push(decorativeNode);

        // Connect to nearby nodes
        baseNode.addConnection(decorativeNode, 0.5);

        // Connect to other nearby nodes with natural variations
        for (const otherNode of nodes) {
          if (otherNode !== decorativeNode && otherNode !== baseNode) {
            const dist = decorativeNode.position.distanceTo(otherNode.position);
            if (dist < 5 && Math.random() < 0.4) {
              decorativeNode.addConnection(otherNode, 0.3);
            }
          }
        }
      }
    };

    // Only use QuantumCortex formation - the best one
    generateQuantumCortex();

    if (densityFactor < 1.0) {
      nodes = nodes.filter((node, index) => {
        if (node === rootNode) return true;
        const hash = (index * 31 + Math.floor(densityFactor * 100)) % 100;
        return hash < densityFactor * 100;
      });

      for (const node of nodes) {
        node.connections = node.connections.filter((conn) =>
          nodes.includes(conn.node)
        );
      }
    }

    return { nodes, rootNode };
  };

  const createNetworkVisualization = (
    formationIndex: number,
    densityFactor = 1.0
  ) => {
    if (!sceneRef.current) return;

    // Remove existing meshes
    if (nodesMeshRef.current) {
      sceneRef.current.remove(nodesMeshRef.current);
      nodesMeshRef.current.geometry.dispose();
      (nodesMeshRef.current.material as THREE.Material).dispose();
      nodesMeshRef.current = null;
    }
    if (connectionsMeshRef.current) {
      sceneRef.current.remove(connectionsMeshRef.current);
      connectionsMeshRef.current.geometry.dispose();
      (connectionsMeshRef.current.material as THREE.Material).dispose();
      connectionsMeshRef.current = null;
    }

    neuralNetworkRef.current = generateNeuralNetwork(
      formationIndex,
      densityFactor
    );
    if (
      !neuralNetworkRef.current ||
      neuralNetworkRef.current.nodes.length === 0
    ) {
      console.error("Network generation failed or resulted in zero nodes.");
      return;
    }

    const nodesGeometry = new THREE.BufferGeometry();
    const nodePositions: number[] = [];
    const nodeTypes: number[] = [];
    const nodeSizes: number[] = [];
    const nodeColors: number[] = [];
    const connectionIndices: number[] = [];
    const distancesFromRoot: number[] = [];
    const buildSeeds: number[] = [];

    for (const node of neuralNetworkRef.current.nodes) {
      nodePositions.push(node.position.x, node.position.y, node.position.z);
      nodeTypes.push(node.type);
      nodeSizes.push(node.size);
      distancesFromRoot.push(node.distanceFromRoot);

      const indices = node.connections
        .slice(0, 3)
        .map(
          (conn) => neuralNetworkRef.current?.nodes.indexOf(conn.node) ?? -1
        );
      while (indices.length < 3) indices.push(-1);
      connectionIndices.push(...indices);

      const palette = colorPalettes[config.activePaletteIndex];
      const colorIndex = Math.min(node.level, palette.length - 1);
      const baseColor = palette[colorIndex % palette.length].clone();
      baseColor.offsetHSL(
        THREE.MathUtils.randFloatSpread(0.05),
        THREE.MathUtils.randFloatSpread(0.1),
        THREE.MathUtils.randFloatSpread(0.1)
      );
      nodeColors.push(baseColor.r, baseColor.g, baseColor.b);
      buildSeeds.push(Math.random());
    }

    nodesGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(nodePositions, 3)
    );
    nodesGeometry.setAttribute(
      "nodeType",
      new THREE.Float32BufferAttribute(nodeTypes, 1)
    );
    nodesGeometry.setAttribute(
      "nodeSize",
      new THREE.Float32BufferAttribute(nodeSizes, 1)
    );
    nodesGeometry.setAttribute(
      "nodeColor",
      new THREE.Float32BufferAttribute(nodeColors, 3)
    );
    nodesGeometry.setAttribute(
      "connectionIndices",
      new THREE.Float32BufferAttribute(connectionIndices, 3)
    );
    nodesGeometry.setAttribute(
      "distanceFromRoot",
      new THREE.Float32BufferAttribute(distancesFromRoot, 1)
    );
    nodesGeometry.setAttribute(
      "buildSeed",
      new THREE.Float32BufferAttribute(buildSeeds, 1)
    );

    const nodesMaterial = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fragmentShader: nodeShader.fragmentShader,
      transparent: true,
      uniforms: THREE.UniformsUtils.clone(pulseUniforms),
      vertexShader: nodeShader.vertexShader
    });
    nodesMaterial.extensions.derivatives = true;
    // Directional build uniforms
    nodesMaterial.uniforms.uBuildProgress = { value: 0.0 }; // 0..1 over 5 minutes
    nodesMaterial.uniforms.uBuildFeather = { value: 0.08 };
    nodesMaterial.uniforms.uBuildDirection = {
      value: new THREE.Vector3(0.7, 0.2, 0.0).normalize()
    };
    nodesMaterial.uniforms.uAlphaScale = { value: 0.45 };

    nodesMeshRef.current = new THREE.Points(nodesGeometry, nodesMaterial);
    sceneRef.current.add(nodesMeshRef.current);

    // Create connections
    const connectionsGeometry = new THREE.BufferGeometry();
    const connectionColors: number[] = [];
    const connectionStrengths: number[] = [];
    const connectionPositions: number[] = [];
    const startPoints: number[] = [];
    const endPoints: number[] = [];
    const pathIndices: number[] = [];
    const processedConnections = new Set<string>();
    let pathIndex = 0;

    for (const [nodeIndex, node] of neuralNetworkRef.current.nodes.entries()) {
      for (const connection of node.connections) {
        const connectedNode = connection.node;
        const connectedIndex =
          neuralNetworkRef.current?.nodes.indexOf(connectedNode) ?? -1;
        if (connectedIndex === -1) return;

        const key = [
          Math.min(nodeIndex, connectedIndex),
          Math.max(nodeIndex, connectedIndex)
        ].join("-");
        if (!processedConnections.has(key)) {
          processedConnections.add(key);

          const startPoint = node.position;
          const endPoint = connectedNode.position;
          const numSegments = 15;

          for (let i = 0; i < numSegments; i++) {
            const t = i / (numSegments - 1);
            connectionPositions.push(t, 0, 0);
            startPoints.push(startPoint.x, startPoint.y, startPoint.z);
            endPoints.push(endPoint.x, endPoint.y, endPoint.z);
            pathIndices.push(pathIndex);
            connectionStrengths.push(connection.strength);

            const palette = colorPalettes[config.activePaletteIndex];
            const avgLevel = Math.min(
              Math.floor((node.level + connectedNode.level) / 2),
              palette.length - 1
            );
            const baseColor = palette[avgLevel % palette.length].clone();
            baseColor.offsetHSL(
              THREE.MathUtils.randFloatSpread(0.05),
              THREE.MathUtils.randFloatSpread(0.1),
              THREE.MathUtils.randFloatSpread(0.1)
            );
            connectionColors.push(baseColor.r, baseColor.g, baseColor.b);
          }
          pathIndex++;
        }
      }
    }

    connectionsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(connectionPositions, 3)
    );
    connectionsGeometry.setAttribute(
      "startPoint",
      new THREE.Float32BufferAttribute(startPoints, 3)
    );
    connectionsGeometry.setAttribute(
      "endPoint",
      new THREE.Float32BufferAttribute(endPoints, 3)
    );
    connectionsGeometry.setAttribute(
      "connectionStrength",
      new THREE.Float32BufferAttribute(connectionStrengths, 1)
    );
    connectionsGeometry.setAttribute(
      "connectionColor",
      new THREE.Float32BufferAttribute(connectionColors, 3)
    );
    connectionsGeometry.setAttribute(
      "pathIndex",
      new THREE.Float32BufferAttribute(pathIndices, 1)
    );

    const connectionsMaterial = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fragmentShader: connectionShader.fragmentShader,
      transparent: true,
      uniforms: THREE.UniformsUtils.clone(pulseUniforms),
      vertexShader: connectionShader.vertexShader
    });
    connectionsMaterial.extensions.derivatives = true;
    connectionsMaterial.uniforms.uBuildProgress = { value: 0.0 };
    connectionsMaterial.uniforms.uBuildFeather = { value: 0.08 };
    connectionsMaterial.uniforms.uBuildDirection = {
      value: new THREE.Vector3(0.7, 0.2, 0.0).normalize()
    };
    // make threads more visible
    connectionsMaterial.uniforms.uAlphaScale = { value: 0.65 };

    connectionsMeshRef.current = new THREE.LineSegments(
      connectionsGeometry,
      connectionsMaterial
    );

    sceneRef.current.add(connectionsMeshRef.current);

    // Update pulse colors
    const palette = colorPalettes[config.activePaletteIndex];
    connectionsMaterial.uniforms.uPulseColors.value[0].copy(palette[0]);
    connectionsMaterial.uniforms.uPulseColors.value[1].copy(palette[1]);
    connectionsMaterial.uniforms.uPulseColors.value[2].copy(palette[2]);
    nodesMaterial.uniforms.uPulseColors.value[0].copy(palette[0]);
    nodesMaterial.uniforms.uPulseColors.value[1].copy(palette[1]);
    nodesMaterial.uniforms.uPulseColors.value[2].copy(palette[2]);
    nodesMaterial.uniforms.uActivePalette.value = config.activePaletteIndex;

    // Final scaling/centering to fit container when requested
    const fitNetworkToView = () => {
      if (
        !cameraRef.current ||
        !nodesMeshRef.current ||
        !connectionsMeshRef.current
      )
        return;
      const camera = cameraRef.current;
      // compute raw radius from node positions
      const pos = nodesGeometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      let rawRadius = 0;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const d = Math.sqrt(x * x + y * y + z * z);
        if (d > rawRadius) rawRadius = d;
      }
      // visible size at current camera distance
      const vFov = (camera.fov * Math.PI) / 180;
      const z = Math.abs(camera.position.z);
      const visibleHeight = 2 * z * Math.tan(vFov / 2);
      const visibleWidth = visibleHeight * camera.aspect;
      const targetDiameter = Math.min(visibleWidth, visibleHeight) * 0.9; // occupy 90%
      const targetRadius = targetDiameter / 2;
      const scale = targetRadius / rawRadius;
      nodesMeshRef.current.scale.setScalar(scale);
      connectionsMeshRef.current.scale.setScalar(scale);
      if (pathGroupRef.current) {
        pathGroupRef.current.scale.setScalar(scale);
      }
    };

    if (scaleMode === "fit") {
      fitNetworkToView();
    } else {
      const s = responsiveSettingsRef.current.networkScale;
      nodesMeshRef.current.scale.setScalar(s);
      connectionsMeshRef.current.scale.setScalar(s);
      if (pathGroupRef.current) pathGroupRef.current.scale.setScalar(s);
    }
  };

  const triggerPulse = (clientX: number, clientY: number) => {
    if (!cameraRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, cameraRef.current);

    // Intersect a plane that faces the camera and passes through world origin (network center)
    const interactionPlane = new THREE.Plane();
    const planeNormal = new THREE.Vector3();
    cameraRef.current.getWorldDirection(planeNormal).normalize();
    interactionPlane.set(planeNormal, 0); // plane equation: n·p + 0 = 0 (through origin)
    const interactionPoint = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(interactionPlane, interactionPoint)) {
      const time = clockRef.current?.getElapsedTime() || 0;

      if (nodesMeshRef.current && connectionsMeshRef.current) {
        lastPulseIndexRef.current = (lastPulseIndexRef.current + 1) % 3;

        const nodesMaterial = nodesMeshRef.current
          .material as THREE.ShaderMaterial;
        const connectionsMaterial = connectionsMeshRef.current
          .material as THREE.ShaderMaterial;

        // Set pulse position and time
        nodesMaterial.uniforms.uPulsePositions.value[
          lastPulseIndexRef.current
        ].copy(interactionPoint);
        nodesMaterial.uniforms.uPulseTimes.value[lastPulseIndexRef.current] =
          time;
        connectionsMaterial.uniforms.uPulsePositions.value[
          lastPulseIndexRef.current
        ].copy(interactionPoint);
        connectionsMaterial.uniforms.uPulseTimes.value[
          lastPulseIndexRef.current
        ] = time;

        // Use palette[0] pulse color to ensure visible but themed highlight
        const themedPulse = new THREE.Color(0x8b5cf6);
        nodesMaterial.uniforms.uPulseColors.value[
          lastPulseIndexRef.current
        ].copy(themedPulse);
        connectionsMaterial.uniforms.uPulseColors.value[
          lastPulseIndexRef.current
        ].copy(themedPulse);
      }
    }
  };

  // Find nearest node in world space
  const findNearestNode = (point: THREE.Vector3) => {
    const network = neuralNetworkRef.current;
    if (!network) return null;
    let nearest: Node | null = null;
    let minD = Number.POSITIVE_INFINITY;
    const scale = nodesMeshRef.current?.scale.x ?? 1;
    for (const n of network.nodes) {
      // compare in world space (apply current scale)
      tempVec.copy(n.position).multiplyScalar(scale);
      const d = point.distanceTo(tempVec);
      if (d < minD) {
        minD = d;
        nearest = n;
      }
    }
    return nearest;
  };

  // Build path from root node to target using BFS
  const buildPathFromRoot = (target: Node) => {
    const network = neuralNetworkRef.current;
    if (!network) return [] as Node[];
    const root = network.rootNode;
    const queue: Node[] = [root];
    const visited = new Set<Node>([root]);
    const parent = new Map<Node, Node | null>();
    parent.set(root, null);
    while (queue.length) {
      const current = queue.shift()!;
      if (current === target) break;
      for (const c of current.connections) {
        const next = c.node as Node;
        if (!visited.has(next)) {
          visited.add(next);
          parent.set(next, current);
          queue.push(next);
        }
      }
    }
    const path: Node[] = [];
    let cur: Node | undefined | null = target;
    let safety = 0;
    while (cur && safety++ < 512) {
      path.push(cur);
      cur = parent.get(cur) ?? null;
    }
    return path.reverse();
  };

  const tempVec = new THREE.Vector3();

  const spawnWebThreadTo = (clientX: number, clientY: number) => {
    if (!cameraRef.current || !canvasRef.current || !sceneRef.current) return;

    // Convert screen to world point on plane
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, cameraRef.current);
    const planeNormal = new THREE.Vector3();
    cameraRef.current.getWorldDirection(planeNormal).normalize();
    const plane = new THREE.Plane(planeNormal, 0);
    const worldPoint = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(plane, worldPoint)) return;

    // account for scene scale when matching to nodes
    const invScale = 1 / (nodesMeshRef.current?.scale.x ?? 1);
    const localPoint = worldPoint.clone().multiplyScalar(invScale);
    const nearest = findNearestNode(localPoint);
    const pathNodes = nearest ? buildPathFromRoot(nearest) : [];

    // Fallback: straight line from root to touch point if graph path not found
    const positions: number[] = [];
    const scale = nodesMeshRef.current?.scale.x ?? 1;
    if (pathNodes.length >= 2 && neuralNetworkRef.current) {
      for (let i = 0; i < pathNodes.length; i++) {
        const p = pathNodes[i].position;
        positions.push(p.x * scale, p.y * scale, p.z * scale);
      }
    } else if (neuralNetworkRef.current) {
      const root = neuralNetworkRef.current.rootNode.position
        .clone()
        .multiplyScalar(scale);
      const dst = worldPoint.clone();
      // build a multi-segment polyline (20 segments)
      const segments = 20;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const qx = root.x + (dst.x - root.x) * t;
        const qy = root.y + (dst.y - root.y) * t;
        const qz = root.z + (dst.z - root.z) * t;
        positions.push(qx, qy, qz);
      }
    } else {
      return;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setDrawRange(0, 2);

    const material = new THREE.LineBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: 0x8b5cf6,
      depthTest: false,
      depthWrite: false,
      opacity: 1,
      transparent: true
    });
    const line = new THREE.Line(geometry, material);
    if (!pathGroupRef.current) {
      pathGroupRef.current = new THREE.Group();
      const s = responsiveSettingsRef.current.networkScale;
      pathGroupRef.current.scale.set(s, s, s);
      sceneRef.current.add(pathGroupRef.current);
    }
    pathGroupRef.current.add(line);
    activePathAnimationsRef.current.push({
      duration: 700,
      line,
      start: performance.now(),
      total: positions.length / 3
    });
  };

  // Fit the network to fill the current camera view (90% of smaller dimension)
  const fitNetworkToContainer = () => {
    const camera = cameraRef.current;
    const nodes = nodesMeshRef.current;
    const connections = connectionsMeshRef.current;
    if (!camera || !nodes || !connections) return;

    // read positions from nodes geometry
    const positions =
      (nodes.geometry.getAttribute("position") as THREE.BufferAttribute) ??
      null;
    if (!positions) return;
    let radius = 0;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const d = Math.sqrt(x * x + y * y + z * z);
      if (d > radius) radius = d;
    }
    if (radius <= 0) return;

    const vFov = (camera.fov * Math.PI) / 180;
    const z = Math.abs(camera.position.z);
    const visibleHeight = 2 * z * Math.tan(vFov / 2);
    const visibleWidth = visibleHeight * camera.aspect;
    const targetDiameter = Math.min(visibleWidth, visibleHeight) * 0.9;
    const targetRadius = targetDiameter / 2;
    const scale = targetRadius / radius;
    nodes.scale.setScalar(scale);
    connections.scale.setScalar(scale);
    if (pathGroupRef.current) pathGroupRef.current.scale.setScalar(scale);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!config.paused) {
      triggerPulse(e.clientX, e.clientY);
      // small delay to ensure uniforms update before line creation
      setTimeout(() => spawnWebThreadTo(e.clientX, e.clientY), 0);
      // Only trigger pulse effect, don't change formation
    }
  };

  const handleCanvasTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0 && !config.paused) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      triggerPulse(x, y);
      setTimeout(() => spawnWebThreadTo(x, y), 0);
      // Only trigger pulse effect, don't change formation
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const now = performance.now();
    // throttle so we don't spam shader updates
    if (now - lastPointerPulseTimeRef.current > 80) {
      lastPointerPulseTimeRef.current = now;
      triggerPulse(e.clientX, e.clientY);
    }
  };

  const handlePointerDown = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  };

  const handlePointerUp = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = true;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Auto pulses to keep background lively without interaction
    const autoPulse = setInterval(() => {
      const rect = canvas.getBoundingClientRect();
      const x = rect.left + Math.random() * rect.width;
      const y = rect.top + Math.random() * rect.height;
      triggerPulse(x, y);
    }, 2500);

    return () => clearInterval(autoPulse);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = wrapperRef.current;
    if (!canvas) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0015);
    sceneRef.current = scene;

    computeResponsiveSettings();

    const camera = new THREE.PerspectiveCamera(
      60,
      (fitContainer && container ? container.clientWidth : window.innerWidth) /
        (fitContainer && container
          ? container.clientHeight
          : window.innerHeight),
      0.1,
      1200
    );
    camera.position.set(0, 5, responsiveSettingsRef.current.cameraZ);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance"
    });
    const width =
      fitContainer && container ? container.clientWidth : window.innerWidth;
    const height =
      fitContainer && container ? container.clientHeight : window.innerHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        responsiveSettingsRef.current.pixelRatioMax
      )
    );
    // Transparent background so the space layer is visible behind
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Create starfield with twinkling animation
    const createStarfield = () => {
      const count = responsiveSettingsRef.current.starCount;
      const pos: number[] = [];
      const twinkleSpeeds: number[] = [];
      const twinklePhases: number[] = [];

      for (let i = 0; i < count; i++) {
        const r = THREE.MathUtils.randFloat(40, 120);
        const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        pos.push(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );

        // Extra-smooth twinkling (slower range)
        twinkleSpeeds.push(THREE.MathUtils.randFloat(0.1, 0.6));
        twinklePhases.push(THREE.MathUtils.randFloat(0, Math.PI * 2));
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute(
        "twinkleSpeed",
        new THREE.Float32BufferAttribute(twinkleSpeeds, 1)
      );
      geo.setAttribute(
        "twinklePhase",
        new THREE.Float32BufferAttribute(twinklePhases, 1)
      );

      const starVertexShader = `
        attribute float twinkleSpeed;
        attribute float twinklePhase;
        uniform float uTime;
        varying float vTwinkle;
        
        void main() {
          // Smooth twinkling
          vTwinkle = sin(uTime * twinkleSpeed + twinklePhase) * 0.5 + 0.5;
          vTwinkle = smoothstep(0.0, 1.0, vTwinkle);
          vTwinkle = pow(vTwinkle, 1.2);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Clamp star size to prevent giant screen-filling discs when close to camera
          float minZ = 50.0; // enforce minimum view-space distance for size calc
          float z = max(minZ, -mvPosition.z);
          float size = 0.05 * (1.0 + vTwinkle * 0.8) * (800.0 / z);
          gl_PointSize = min(size, 2.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `;

      const starFragmentShader = `
        varying float vTwinkle;
        
        void main() {
          vec2 center = 2.0 * gl_PointCoord - 1.0;
          float dist = length(center);
          if (dist > 1.0) discard;
          
          // Ultra-premium star rendering with ultra-soft edges
          float brightness = 1.0 - smoothstep(0.0, 0.85, dist);
          brightness = pow(brightness, 1.1); // Enhanced smooth falloff
          
          // Ultra-premium twinkling with enhanced color variation
          float twinkleEffect = vTwinkle * 0.8 + 0.2;
          brightness *= twinkleEffect;
          
          // Ultra-premium color with enhanced blue tint and depth
          vec3 starColor = mix(vec3(1.0, 1.0, 1.0), vec3(0.7, 0.85, 1.0), vTwinkle * 0.4);
          starColor = mix(starColor, vec3(0.9, 0.95, 1.0), 0.3); // Additional depth
          
          gl_FragColor = vec4(starColor, brightness * 0.8);
        }
      `;

      const mat = new THREE.ShaderMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fragmentShader: starFragmentShader,
        transparent: true,
        uniforms: {
          uTime: { value: 0.0 }
        },
        vertexShader: starVertexShader
      });

      return { material: mat, points: new THREE.Points(geo, mat) };
    };

    let starField: {
      material: THREE.ShaderMaterial;
      points: THREE.Points;
    } | null = null;
    const starGroup = new THREE.Group();
    starGroup.position.set(0, 0, -120); // keep stars safely behind the scene
    starGroup.scale.setScalar(responsiveSettingsRef.current.starScale);
    if (showStarfield) {
      starField = createStarfield();
      starGroup.add(starField.points);
    }
    scene.add(starGroup);
    starGroupRef.current = starGroup;

    // Remove center logo here so the stamped logo on the sphere (space layer) is visible

    // Initialize controls
    let controls: any = null;
    try {
      import("three/examples/jsm/controls/OrbitControls").then(
        ({ OrbitControls }) => {
          controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.rotateSpeed = 0.5;
          controls.minDistance = 5;
          controls.maxDistance = 100;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.15;
          controls.enablePan = false;
          controlsRef.current = controls;
        }
      );
    } catch {
      console.warn("OrbitControls not available");
    }

    const clock = new THREE.Clock();
    clockRef.current = clock;

    // Window-level pointer move for reliable pulses
    let onWindowPointerMove: ((ev: PointerEvent) => void) | null = null;
    if (!fitContainer) {
      onWindowPointerMove = (ev: PointerEvent) => {
        if (document.visibilityState !== "visible") return;
        triggerPulse(ev.clientX, ev.clientY);
      };
      window.addEventListener("pointermove", onWindowPointerMove);
    }

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const t = clock.getElapsedTime();

      if (!config.paused) {
        // 5-minute build: 300s full progress from 0..1, then loop
        const total = 300.0; // seconds
        const progress = (t % total) / total; // 0..1
        const eased =
          1.0 - (1.0 - progress) * (1.0 - progress) * (1.0 - progress); // easeOutCubic
        if (nodesMeshRef.current) {
          const material = nodesMeshRef.current
            .material as THREE.ShaderMaterial;
          material.uniforms.uTime.value = t;
          material.uniforms.uBuildProgress.value = eased;
          // Ultra-smooth, premium rotation
          nodesMeshRef.current.rotation.y = Math.sin(t * 0.025) * 0.04;
          nodesMeshRef.current.rotation.x = Math.sin(t * 0.015) * 0.025;
          nodesMeshRef.current.rotation.z = Math.sin(t * 0.01) * 0.015; // Premium 3D rotation
        }
        if (connectionsMeshRef.current) {
          const material = connectionsMeshRef.current
            .material as THREE.ShaderMaterial;
          material.uniforms.uTime.value = t;
          material.uniforms.uBuildProgress.value = eased;
          // Ultra-smooth synchronized rotation with nodes
          connectionsMeshRef.current.rotation.y = Math.sin(t * 0.025) * 0.04;
          connectionsMeshRef.current.rotation.x = Math.sin(t * 0.015) * 0.025;
          connectionsMeshRef.current.rotation.z = Math.sin(t * 0.01) * 0.015; // Premium 3D rotation
        }
      }

      // Animate active path draws (logo -> touch)
      if (activePathAnimationsRef.current.length) {
        const now = performance.now();
        for (let i = activePathAnimationsRef.current.length - 1; i >= 0; i--) {
          const a = activePathAnimationsRef.current[i];
          const k = Math.min(1, (now - a.start) / a.duration);
          const drawSegments = Math.max(2, Math.floor(a.total * k));
          a.line.geometry.setDrawRange(0, drawSegments);
          (
            a.line.geometry as THREE.BufferGeometry
          ).attributes.position.needsUpdate = true;
          if (k >= 1) {
            // fade out slowly then remove
            const mat = a.line.material as THREE.LineBasicMaterial;
            mat.opacity *= 0.96;
            if (mat.opacity < 0.05) {
              (a.line.parent as THREE.Group)?.remove(a.line);
              a.line.geometry.dispose();
              mat.dispose();
              activePathAnimationsRef.current.splice(i, 1);
            }
          }
        }
        // keep path group aligned with rotating network
        if (pathGroupRef.current && nodesMeshRef.current) {
          pathGroupRef.current.rotation.copy(nodesMeshRef.current.rotation);
        }
      }

      // Very slow starfield rotation
      if (starGroupRef.current) {
        starGroupRef.current.rotation.y += 0.00002;
      }
      if (starField) {
        starField.material.uniforms.uTime.value = t;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    // Handle resize
    const handleResize = () => {
      computeResponsiveSettings();
      const w =
        fitContainer && container ? container.clientWidth : window.innerWidth;
      const h =
        fitContainer && container ? container.clientHeight : window.innerHeight;
      camera.aspect = Math.max(1, w) / Math.max(1, h);
      camera.position.z = responsiveSettingsRef.current.cameraZ;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio,
          responsiveSettingsRef.current.pixelRatioMax
        )
      );
      renderer.setSize(Math.max(1, w), Math.max(1, h));
      if (scaleMode === "fit") {
        fitNetworkToContainer();
      } else {
        if (nodesMeshRef.current) {
          nodesMeshRef.current.scale.setScalar(
            responsiveSettingsRef.current.networkScale
          );
        }
        if (connectionsMeshRef.current) {
          connectionsMeshRef.current.scale.setScalar(
            responsiveSettingsRef.current.networkScale
          );
        }
      }
      if (starGroupRef.current) {
        starGroupRef.current.scale.setScalar(
          responsiveSettingsRef.current.starScale
        );
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (fitContainer && container) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", handleResize);
    }

    // Initialize visualization
    createNetworkVisualization(config.currentFormation, config.densityFactor);
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (resizeObserver && container) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", handleResize);
      }
      if (onWindowPointerMove) {
        window.removeEventListener("pointermove", onWindowPointerMove as any);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      renderer.dispose();
    };
  }, []);

  // Update visualization when config changes
  useEffect(() => {
    createNetworkVisualization(config.currentFormation, config.densityFactor);
  }, [
    config.currentFormation,
    config.densityFactor,
    config.activePaletteIndex
  ]);

  // Update pause state
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !config.paused;
    }
  }, [config.paused]);

  return (
    <div className={`relative h-full w-full ${className}`} ref={wrapperRef}>
      {/* Fixed logo layer at the exact screen center (does not rotate with sphere) */}
      {showCenterLogo && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <img
            alt="logo"
            className="h-32 w-32 select-none opacity-95"
            src="/logo.png"
          />
        </div>
      )}
      <canvas
        className="absolute inset-0 h-full w-full cursor-pointer"
        onClick={handleCanvasClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleCanvasTouch}
        ref={canvasRef}
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
