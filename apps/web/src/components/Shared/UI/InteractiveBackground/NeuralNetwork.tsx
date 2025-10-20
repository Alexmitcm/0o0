import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface NeuralNetworkProps {
  config: {
    densityFactor: number;
    numFormations: number;
    currentFormation: number;
    paused: boolean;
  };
  responsiveSettings: {
    baseNodeSize: number;
    cameraZ: number;
    density: number;
    lineAlphaScale: number;
    networkScale: number;
    pixelRatioMax: number;
  };
  colorPalettes: THREE.Color[][];
  onNetworkReady?: (network: any) => void;
}

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({
  config,
  responsiveSettings,
  colorPalettes,
  onNetworkReady
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const animationRef = useRef<number | undefined>(undefined);

  // Web geometry generation
  const generateWebGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const nodeSizes: number[] = [];
    const nodeTypes: number[] = [];
    const nodeColors: number[] = [];
    const connectionIndices: number[] = [];
    const distancesFromRoot: number[] = [];
    const buildSeeds: number[] = [];

    const centerRadius = 2;
    const webRadius = 8;
    const numRadialThreads = 8;
    const numSpiralThreads = 12;
    const numDroplets = 25;

    // Generate center hub
    positions.push(0, 0, 0);
    colors.push(1, 1, 1);
    nodeSizes.push(1.5);
    nodeTypes.push(0);
    nodeColors.push(1, 1, 1);
    connectionIndices.push(0, 0, 0);
    distancesFromRoot.push(0);
    buildSeeds.push(Math.random());

    // Generate radial threads (spokes)
    for (let i = 0; i < numRadialThreads; i++) {
      const angle = (i / numRadialThreads) * Math.PI * 2;
      const x = Math.cos(angle) * webRadius;
      const y = Math.sin(angle) * webRadius;
      const z = (Math.random() - 0.5) * 2;

      positions.push(x, y, z);
      colors.push(0.8, 0.9, 1.0);
      nodeSizes.push(1.2);
      nodeTypes.push(0);
      nodeColors.push(0.8, 0.9, 1.0);
      connectionIndices.push(0, i + 1, 0);
      distancesFromRoot.push(webRadius);
      buildSeeds.push(Math.random());

      // Add intermediate nodes along radial threads
      for (let j = 1; j < 3; j++) {
        const t = j / 3;
        const ix = x * t;
        const iy = y * t;
        const iz = z * t;

        positions.push(ix, iy, iz);
        colors.push(0.7, 0.8, 1.0);
        nodeSizes.push(0.8);
        nodeTypes.push(0);
        nodeColors.push(0.7, 0.8, 1.0);
        connectionIndices.push(0, i + 1, 0);
        distancesFromRoot.push(webRadius * t);
        buildSeeds.push(Math.random());
      }
    }

    // Generate spiral threads (rings)
    for (let i = 0; i < numSpiralThreads; i++) {
      const radius =
        centerRadius + (i / numSpiralThreads) * (webRadius - centerRadius);
      const numNodes = Math.floor(radius * 2);

      for (let j = 0; j < numNodes; j++) {
        const angle = (j / numNodes) * Math.PI * 2 + i * 0.3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = (Math.random() - 0.5) * 1;

        positions.push(x, y, z);
        colors.push(0.6, 0.8, 1.0);
        nodeSizes.push(0.6);
        nodeTypes.push(1);
        nodeColors.push(0.6, 0.8, 1.0);
        connectionIndices.push(0, 0, 0);
        distancesFromRoot.push(radius);
        buildSeeds.push(Math.random());
      }
    }

    // Generate sticky droplets
    for (let i = 0; i < numDroplets; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = centerRadius + Math.random() * (webRadius - centerRadius);
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 2;
      const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 2;
      const z = (Math.random() - 0.5) * 3;

      positions.push(x, y, z);
      colors.push(0.8, 0.7, 1.0);
      nodeSizes.push(0.4);
      nodeTypes.push(2);
      nodeColors.push(0.8, 0.7, 1.0);
      connectionIndices.push(0, 0, 0);
      distancesFromRoot.push(Math.sqrt(x * x + y * y + z * z));
      buildSeeds.push(Math.random());
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute(
      "nodeSize",
      new THREE.Float32BufferAttribute(nodeSizes, 1)
    );
    geometry.setAttribute(
      "nodeType",
      new THREE.Float32BufferAttribute(nodeTypes, 1)
    );
    geometry.setAttribute(
      "nodeColor",
      new THREE.Float32BufferAttribute(nodeColors, 3)
    );
    geometry.setAttribute(
      "connectionIndices",
      new THREE.Float32BufferAttribute(connectionIndices, 3)
    );
    geometry.setAttribute(
      "distanceFromRoot",
      new THREE.Float32BufferAttribute(distancesFromRoot, 1)
    );
    geometry.setAttribute(
      "buildSeed",
      new THREE.Float32BufferAttribute(buildSeeds, 1)
    );

    return geometry;
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = responsiveSettings.cameraZ;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, responsiveSettings.pixelRatioMax)
    );
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Network material and mesh
    const networkMaterial = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uPulseColors[3];
        uniform int uActivePalette;
        uniform float uBuildProgress;
        uniform float uBuildFeather;
        uniform vec3 uBuildDirection;
        uniform float uAlphaScale;
        
        varying vec3 vColor;
        varying float vNodeType;
        varying vec3 vPosition;
        varying float vPulseIntensity;
        varying float vDistanceFromRoot;
        varying float vBuildSeed;

        void main() {
          vec2 center = 2.0 * gl_PointCoord - 1.0;
          float dist = length(center);
          
          if (dist > 1.0) discard;

          float glowStrength = 1.0 - smoothstep(0.0, 0.8, dist);
          glowStrength = pow(glowStrength, 1.1);

          vec3 baseColor = vColor * (0.9 + 0.1 * sin(uTime * 0.5 + vDistanceFromRoot * 0.3));
          vec3 finalColor = baseColor;

          if (vPulseIntensity > 0.0) {
            vec3 pulseColor = uPulseColors[0];
            finalColor = mix(baseColor, pulseColor, vPulseIntensity * 0.8);
            finalColor *= (1.0 + vPulseIntensity * 2.0);
            finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), vPulseIntensity * 0.4);
          }

          float alpha = glowStrength * (0.95 - 0.3 * dist);
          
          float camDistance = length(vPosition - cameraPosition);
          float distanceFade = smoothstep(80.0, 10.0, camDistance);

          vec3 dir = normalize(uBuildDirection);
          float dirFactor = dot(dir, normalize(vPosition)) * 0.5 + 0.5;
          float revealVal = clamp(dirFactor + (vBuildSeed - 0.5) * 0.2, 0.0, 1.0);
          float buildFactor = 1.0 - smoothstep(uBuildProgress - uBuildFeather, uBuildProgress + uBuildFeather, revealVal);

          finalColor *= 1.2;
          alpha *= 1.0;

          gl_FragColor = vec4(finalColor * 0.85, alpha * distanceFade * buildFactor * uAlphaScale);
        }
      `,
      transparent: true,
      uniforms: {
        uActivePalette: { value: 0 },
        uAlphaScale: { value: 1.0 },
        uBaseNodeSize: { value: responsiveSettings.baseNodeSize },
        uBuildDirection: { value: new THREE.Vector3(1, 1, 0) },
        uBuildFeather: { value: 0.3 },
        uBuildProgress: { value: 0.0 },
        uPulseColors: { value: colorPalettes[0] },
        uTime: { value: 0.0 }
      },
      vertexShader: `
        attribute float nodeSize;
        attribute float nodeType;
        attribute vec3 nodeColor;
        attribute vec3 connectionIndices;
        attribute float distanceFromRoot;
        attribute float buildSeed;
        
        uniform float uTime;
        uniform vec3 uPulsePositions[3];
        uniform float uPulseTimes[3];
        uniform float uPulseSpeed;
        uniform float uBaseNodeSize;
        
        varying vec3 vColor;
        varying float vNodeType;
        varying vec3 vPosition;
        varying float vPulseIntensity;
        varying float vDistanceFromRoot;
        varying float vBuildSeed;

        void main() {
          vNodeType = nodeType;
          vColor = nodeColor;
          vDistanceFromRoot = distanceFromRoot;
          vBuildSeed = buildSeed;

          vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vPosition = worldPos;

          float totalPulseIntensity = 0.0;
          vPulseIntensity = totalPulseIntensity;

          float timeScale = 0.8 + 0.2 * sin(uTime * 0.8 + distanceFromRoot * 0.2);
          float baseSize = nodeSize * timeScale;
          float pulseSize = baseSize * (1.0 + vPulseIntensity * 2.0);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = pulseSize * uBaseNodeSize * (800.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `
    });

    const networkMesh = new THREE.Points(generateWebGeometry, networkMaterial);
    scene.add(networkMesh);

    // Animation loop
    const animate = () => {
      if (!config.paused) {
        networkMaterial.uniforms.uTime.value += 0.016;
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Notify parent that network is ready
    if (onNetworkReady) {
      onNetworkReady({
        camera,
        networkMaterial,
        networkMesh,
        renderer,
        scene
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      generateWebGeometry.dispose();
      networkMaterial.dispose();
    };
  }, [
    generateWebGeometry,
    responsiveSettings,
    colorPalettes,
    config,
    onNetworkReady
  ]);

  return <div className="absolute inset-0" ref={mountRef} />;
};

export default NeuralNetwork;
