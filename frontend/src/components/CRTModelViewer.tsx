import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds, useBounds } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { Maximize, Minimize, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ScreenShare, ScreenShareOff } from "lucide-react";
import { getSupabase, initializeSupabase } from "@/supabaseClient";

// Video source type
const VideoSourceType = {
  LocalVideo: "local",
  ScreenCapture: "capture",
  YouTubeEmbed: "youtube"
} as const;

type VideoSourceTypeValue = typeof VideoSourceType[keyof typeof VideoSourceType];

// YouTube URL parsing utilities
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

function getYouTubeEmbedUrl(videoId: string, autoplay: boolean = true, mute: boolean = true): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: mute ? "1" : "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * CSS3D YouTube Component - renders YouTube iframe ON the TV screen mesh in 3D space
 * 
 * Uses CSS3DRenderer to place a DOM iframe in 3D space, synced with the WebGL camera.
 * The iframe is positioned and scaled to match the TV screen mesh exactly.
 * 
 * CRT EFFECTS:
 * - Applies CSS-based CRT overlay effects (scanlines, vignette, phosphor pattern, flicker)
 * - Overlay is semi-transparent and positioned on top of the YouTube iframe
 * - Pointer events pass through overlay to allow iframe interaction
 */
interface CSS3DYouTubeProps {
  screenMesh: THREE.Mesh | null;
  youtubeVideoId: string | null;
  isMuted: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function CSS3DYouTube({ screenMesh, youtubeVideoId, isMuted, containerRef }: CSS3DYouTubeProps) {
  const { camera, gl, size } = useThree();
  const cssRendererRef = useRef<CSS3DRenderer | null>(null);
  const cssSceneRef = useRef<THREE.Scene | null>(null);
  const cssObjectRef = useRef<CSS3DObject | null>(null);
  const screenScaleXRef = useRef<number>(0.05);
  const screenScaleYRef = useRef<number>(0.05);
  const initializedRef = useRef(false);
  const flickerStyleRef = useRef<HTMLStyleElement | null>(null);

  // Initialize CSS3D renderer (only once)
  useEffect(() => {
    if (!youtubeVideoId || !containerRef.current) return;
    if (initializedRef.current) return; // Prevent multiple initializations
    
    initializedRef.current = true;
    console.log("Creating CSS3D renderer for YouTube with CRT overlay");

    // Create CSS3D renderer
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(size.width, size.height);
    cssRenderer.domElement.style.position = "absolute";
    cssRenderer.domElement.style.top = "0";
    cssRenderer.domElement.style.left = "0";
    cssRenderer.domElement.style.pointerEvents = "none";
    cssRenderer.domElement.style.zIndex = "1";

    // Create scene
    const cssScene = new THREE.Scene();

    // Create wrapper div that contains both iframe and CRT overlay
    const wrapper = document.createElement("div");
    wrapper.style.width = "640px";
    wrapper.style.height = "540px";
    wrapper.style.position = "relative";
    wrapper.style.overflow = "hidden";
    wrapper.style.borderRadius = "8px"; // CRT screens have rounded corners
    wrapper.style.background = "#000";

    // Create iframe container with slight barrel distortion simulation
    const iframeContainer = document.createElement("div");
    iframeContainer.style.width = "100%";
    iframeContainer.style.height = "100%";
    iframeContainer.style.position = "relative";
    iframeContainer.style.overflow = "hidden";
    // Subtle warm color tint typical of CRT phosphors
    iframeContainer.style.filter = "saturate(1.1) contrast(1.02) brightness(1.05)";

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = getYouTubeEmbedUrl(youtubeVideoId, true, isMuted);
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.pointerEvents = "auto";
    iframe.style.backgroundColor = "#000";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    // Add comprehensive CRT animation styles
    const flickerStyle = document.createElement("style");
    flickerStyle.textContent = `
      /* Subtle brightness flicker - simulates CRT refresh rate variations */
      @keyframes crtFlicker {
        0% { opacity: 1; }
        5% { opacity: 0.98; }
        10% { opacity: 1; }
        15% { opacity: 0.99; }
        20% { opacity: 1; }
        50% { opacity: 0.985; }
        80% { opacity: 1; }
        85% { opacity: 0.97; }
        90% { opacity: 1; }
        100% { opacity: 0.99; }
      }
      
      /* Rolling horizontal interference bar - classic CRT artifact */
      @keyframes crtRollingBar {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(540px); }
      }
      
      /* Subtle horizontal jitter - simulates sync issues */
      @keyframes crtJitter {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(0.3px); }
        50% { transform: translateX(-0.2px); }
        75% { transform: translateX(0.1px); }
      }
      
      /* Animated noise grain */
      @keyframes crtNoise {
        0%, 100% { background-position: 0 0; }
        10% { background-position: -5% -10%; }
        20% { background-position: -15% 5%; }
        30% { background-position: 7% -25%; }
        40% { background-position: -5% 25%; }
        50% { background-position: -15% 10%; }
        60% { background-position: 15% 0%; }
        70% { background-position: 0% 15%; }
        80% { background-position: 3% 35%; }
        90% { background-position: -10% 10%; }
      }
      
      /* Interlace shimmer effect */
      @keyframes crtInterlace {
        0% { opacity: 0.03; }
        50% { opacity: 0.05; }
        100% { opacity: 0.03; }
      }
      
      /* Screen glow pulse */
      @keyframes crtGlow {
        0%, 100% { box-shadow: inset 0 0 80px rgba(100, 200, 255, 0.03); }
        50% { box-shadow: inset 0 0 100px rgba(100, 200, 255, 0.05); }
      }
    `;
    document.head.appendChild(flickerStyle);
    flickerStyleRef.current = flickerStyle;

    // === Layer 1: Main scanlines (horizontal lines characteristic of CRT) ===
    const scanlines = document.createElement("div");
    scanlines.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
      background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 1px,
        rgba(0, 0, 0, 0.12) 1px,
        rgba(0, 0, 0, 0.12) 2px
      );
      animation: crtFlicker 0.1s infinite;
    `;

    // === Layer 2: RGB Aperture Grille / Shadow Mask (vertical phosphor stripes) ===
    const phosphorMask = document.createElement("div");
    phosphorMask.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 11;
      opacity: 0.08;
      background: repeating-linear-gradient(
        90deg,
        rgba(255, 0, 0, 0.5) 0px,
        rgba(255, 0, 0, 0.5) 1px,
        rgba(0, 255, 0, 0.5) 1px,
        rgba(0, 255, 0, 0.5) 2px,
        rgba(0, 0, 255, 0.5) 2px,
        rgba(0, 0, 255, 0.5) 3px
      );
    `;

    // === Layer 3: Fine horizontal phosphor rows (interlaced look) ===
    const interlacePattern = document.createElement("div");
    interlacePattern.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 12;
      background: repeating-linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.02) 0px,
        transparent 1px,
        transparent 2px
      );
      animation: crtInterlace 0.033s infinite;
    `;

    // === Layer 4: Vignette (darker edges - natural CRT characteristic) ===
    const vignette = document.createElement("div");
    vignette.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 13;
      background: radial-gradient(
        ellipse 85% 75% at 50% 50%,
        transparent 0%,
        transparent 60%,
        rgba(0, 0, 0, 0.08) 75%,
        rgba(0, 0, 0, 0.2) 90%,
        rgba(0, 0, 0, 0.4) 100%
      );
    `;

    // === Layer 5: Corner darkening (CRT screens are darker at corners) ===
    const cornerDarkening = document.createElement("div");
    cornerDarkening.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 14;
      box-shadow: 
        inset 40px 40px 60px rgba(0, 0, 0, 0.15),
        inset -40px -40px 60px rgba(0, 0, 0, 0.15),
        inset 40px -40px 60px rgba(0, 0, 0, 0.15),
        inset -40px 40px 60px rgba(0, 0, 0, 0.15);
    `;

    // === Layer 6: Screen glow (phosphor bloom effect) ===
    const screenGlow = document.createElement("div");
    screenGlow.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 15;
      animation: crtGlow 2s ease-in-out infinite;
    `;

    // === Layer 7: Rolling interference bar (classic CRT artifact) ===
    const rollingBar = document.createElement("div");
    rollingBar.style.cssText = `
      position: absolute;
      top: -20px;
      left: 0;
      width: 100%;
      height: 20px;
      pointer-events: none;
      z-index: 16;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(255, 255, 255, 0.03) 30%,
        rgba(255, 255, 255, 0.05) 50%,
        rgba(255, 255, 255, 0.03) 70%,
        transparent 100%
      );
      animation: crtRollingBar 12s linear infinite;
      opacity: 0.6;
    `;

    // === Layer 8: Static noise grain ===
    const noiseOverlay = document.createElement("div");
    noiseOverlay.style.cssText = `
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      pointer-events: none;
      z-index: 17;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      animation: crtNoise 0.5s steps(10) infinite;
    `;

    // === Layer 9: Chromatic aberration at edges (color fringing) ===
    const chromaticLeft = document.createElement("div");
    chromaticLeft.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 30px;
      height: 100%;
      pointer-events: none;
      z-index: 18;
      background: linear-gradient(
        to right,
        rgba(255, 0, 0, 0.03) 0%,
        transparent 100%
      );
    `;

    const chromaticRight = document.createElement("div");
    chromaticRight.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 30px;
      height: 100%;
      pointer-events: none;
      z-index: 18;
      background: linear-gradient(
        to left,
        rgba(0, 100, 255, 0.03) 0%,
        transparent 100%
      );
    `;

    // === Layer 10: Glass reflection highlight ===
    const glassReflection = document.createElement("div");
    glassReflection.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 19;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.08) 0%,
        rgba(255, 255, 255, 0.03) 10%,
        transparent 30%,
        transparent 70%,
        rgba(255, 255, 255, 0.01) 100%
      );
      border-radius: 8px;
    `;

    // === Layer 11: Screen bezel shadow (inner edge) ===
    const bezelShadow = document.createElement("div");
    bezelShadow.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 20;
      box-shadow: 
        inset 0 0 6px 1px rgba(0, 0, 0, 0.25),
        inset 0 0 2px 1px rgba(0, 0, 0, 0.4);
      border-radius: 8px;
    `;

    // === Layer 12: Subtle color tint (warm phosphor glow) ===
    const colorTint = document.createElement("div");
    colorTint.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 21;
      background: radial-gradient(
        ellipse at center,
        rgba(255, 248, 230, 0.02) 0%,
        transparent 70%
      );
    `;

    // === Layer 13: Horizontal jitter container (simulates sync wobble) ===
    const jitterContainer = document.createElement("div");
    jitterContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9;
      animation: crtJitter 0.05s infinite;
    `;

    // Assemble the iframe container
    iframeContainer.appendChild(iframe);

    // Assemble the wrapper with all CRT effect layers
    wrapper.appendChild(iframeContainer);
    wrapper.appendChild(jitterContainer);
    wrapper.appendChild(scanlines);
    wrapper.appendChild(phosphorMask);
    wrapper.appendChild(interlacePattern);
    wrapper.appendChild(vignette);
    wrapper.appendChild(cornerDarkening);
    wrapper.appendChild(screenGlow);
    wrapper.appendChild(rollingBar);
    wrapper.appendChild(noiseOverlay);
    wrapper.appendChild(chromaticLeft);
    wrapper.appendChild(chromaticRight);
    wrapper.appendChild(glassReflection);
    wrapper.appendChild(bezelShadow);
    wrapper.appendChild(colorTint);

    // Wrap in CSS3DObject
    const cssObject = new CSS3DObject(wrapper);
    
    // Default scale based on typical screen size (~37 world units after Bounds)
    // Scale = worldUnits / pixels = 37 * 0.85 / 640 ≈ 0.05
    cssObject.scale.set(0.05, 0.05, 0.05);
    cssObject.position.set(0, 0, 0);

    cssScene.add(cssObject);
    containerRef.current.appendChild(cssRenderer.domElement);

    cssRendererRef.current = cssRenderer;
    cssSceneRef.current = cssScene;
    cssObjectRef.current = cssObject;

    // Handle resize
    const handleResize = () => {
      if (cssRendererRef.current) {
        cssRendererRef.current.setSize(gl.domElement.clientWidth, gl.domElement.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (flickerStyleRef.current && document.head.contains(flickerStyleRef.current)) {
        document.head.removeChild(flickerStyleRef.current);
      }
      initializedRef.current = false;
      if (cssSceneRef.current && cssObjectRef.current) {
        cssSceneRef.current.remove(cssObjectRef.current);
      }
      if (cssRendererRef.current && containerRef.current) {
        try {
          containerRef.current.removeChild(cssRendererRef.current.domElement);
        } catch (e) { /* ignore */ }
      }
      cssRendererRef.current = null;
      cssSceneRef.current = null;
      cssObjectRef.current = null;
      flickerStyleRef.current = null;
    };
  }, [youtubeVideoId, containerRef, gl, isMuted, size.width, size.height]);

  // Update position and scale every frame
  useFrame(() => {
    if (!cssRendererRef.current || !cssSceneRef.current || !cssObjectRef.current) return;

    if (screenMesh) {
      screenMesh.updateMatrixWorld(true);
      
      // Get screen position and orientation
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      screenMesh.getWorldPosition(worldPos);
      screenMesh.getWorldQuaternion(worldQuat);

      // Calculate screen size from bounding box
      const box = new THREE.Box3().setFromObject(screenMesh);
      const screenWidth = box.max.x - box.min.x;
      const screenHeight = box.max.y - box.min.y;
      
      // Calculate separate X/Y scales to fill screen exactly
      // iframe is 640x540 pixels
      if (screenWidth > 1 && screenHeight > 1) {
        screenScaleXRef.current = (screenWidth * 0.97) / 640;
        screenScaleYRef.current = (screenHeight * 0.96) / 540;
      }

      // Apply position, rotation, and scale
      cssObjectRef.current.position.copy(worldPos);
      cssObjectRef.current.position.z += 0.5; // Offset in front of screen
      cssObjectRef.current.position.y += 0.1; // Offset up
      cssObjectRef.current.quaternion.copy(worldQuat);
      cssObjectRef.current.scale.set(screenScaleXRef.current, screenScaleYRef.current, 1);
    }

    // Render CSS3D scene with WebGL camera
    cssRendererRef.current.render(cssSceneRef.current, camera);
  });

  return null;
}

// CRT Shader for authentic retro screen effects
const CRTShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.VideoTexture | null },
    time: { value: 0 },
    // Texture transform: repeat and offset for cropping 16:9 to 4:3
    texRepeat: { value: new THREE.Vector2(-0.75, 1.0) }, // Negative X = flip across Y axis
    texOffset: { value: new THREE.Vector2(0.875, 0.067) }, // Offset to center
    // CRT effect parameters
    scanlineIntensity: { value: 0.12 },
    scanlineCount: { value: 300.0 },
    rgbOffset: { value: 0.0025 },
    vignetteIntensity: { value: 0.4 },
    brightness: { value: 1.15 },
    curvature: { value: 0.04 },
    flickerIntensity: { value: 0.03 },
    noiseIntensity: { value: 0.05 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform vec2 texRepeat;
    uniform vec2 texOffset;
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float rgbOffset;
    uniform float vignetteIntensity;
    uniform float brightness;
    uniform float curvature;
    uniform float flickerIntensity;
    uniform float noiseIntensity;
    varying vec2 vUv;

    // Pseudo-random noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // Barrel distortion for CRT curvature
    vec2 curveUV(vec2 uv) {
      uv = uv * 2.0 - 1.0;
      vec2 offset = abs(uv.yx) / vec2(curvature > 0.0 ? 5.0 / curvature : 9999.0);
      uv = uv + uv * offset * offset;
      uv = uv * 0.5 + 0.5;
      return uv;
    }

    // Apply texture repeat and offset (handles flip via negative repeat)
    vec2 transformUV(vec2 uv) {
      return uv * texRepeat + texOffset;
    }

    void main() {
      vec2 uv = curveUV(vUv);

      // Out of bounds - show black for curved edges
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // Apply texture transformation (repeat/offset/flip)
      vec2 texUV = transformUV(uv);

      // Chromatic aberration (RGB split) - apply to transformed UVs
      float aberration = rgbOffset * (1.0 + 0.5 * length(uv - 0.5));
      float r = texture2D(tDiffuse, vec2(texUV.x + aberration, texUV.y)).r;
      float g = texture2D(tDiffuse, texUV).g;
      float b = texture2D(tDiffuse, vec2(texUV.x - aberration, texUV.y)).b;
      vec3 color = vec3(r, g, b);

      // Scanlines with slight movement
      float scanlineOffset = time * 0.5;
      float scanline = sin((uv.y + scanlineOffset * 0.01) * scanlineCount * 3.14159265) * 0.5 + 0.5;
      scanline = pow(scanline, 1.5);
      color = mix(color, color * (1.0 - scanlineIntensity), scanline);

      // Horizontal scanline bands (phosphor rows)
      float phosphor = sin(uv.y * scanlineCount * 2.0 * 3.14159265) * 0.5 + 0.5;
      color *= 0.95 + 0.05 * phosphor;

      // RGB phosphor pattern (subtle vertical stripes)
      float phosphorPattern = mod(gl_FragCoord.x, 3.0);
      if (phosphorPattern < 1.0) {
        color.r *= 1.1;
        color.gb *= 0.95;
      } else if (phosphorPattern < 2.0) {
        color.g *= 1.1;
        color.rb *= 0.95;
      } else {
        color.b *= 1.1;
        color.rg *= 0.95;
      }

      // Vignette (darker edges)
      float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
      vignette = clamp(pow(16.0 * vignette, vignetteIntensity), 0.0, 1.0);
      color *= vignette;

      // Static noise
      float noise = random(uv + fract(time)) * noiseIntensity;
      color += noise - noiseIntensity * 0.8;

      // Flicker effect
      float flicker = 1.0 - flickerIntensity + flickerIntensity * sin(time * 12.0) * sin(time * 7.3);
      color *= flicker;

      // Brightness adjustment
      color *= brightness;

      // Slight green/blue tint for that CRT phosphor look
      color.g *= 1.02;
      color.b *= 0.98;

      // Clamp final color
      color = clamp(color, 0.0, 1.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

interface ModelProps {
  url: string;
  videoTexture: THREE.VideoTexture | null;
  onScreenMeshFound?: (mesh: THREE.Mesh | null) => void;
}

function Model({ url, videoTexture, onScreenMeshFound }: ModelProps) {
  const { scene: originalScene } = useGLTF(url);
  const bounds = useBounds();
  const crtMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(videoTexture);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    videoTextureRef.current = videoTexture;
  }, [videoTexture]);

  const scene = useMemo(() => originalScene.clone(true), [originalScene]);

  useEffect(() => {
    bounds.refresh().fit();
  }, [bounds, scene]);

  // Find screen mesh regardless of videoTexture state (needed for YouTube CSS3D mode)
  // When no videoTexture (YouTube mode), apply white material to screen for better visibility
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materialName = ((child.material as THREE.Material)?.name || "").toLowerCase();
        if (materialName === "screen") {
          console.log("Screen mesh found:", child.name);
          screenMeshRef.current = child;
          
          // If no video texture (YouTube mode), make screen white
          if (!videoTexture) {
            const whiteMaterial = new THREE.MeshBasicMaterial({ 
              color: 0x000000,
              side: THREE.DoubleSide 
            });
            child.material = whiteMaterial;
          }
          
          if (onScreenMeshFound) {
            onScreenMeshFound(child);
          }
        }
      }
    });
  }, [scene, onScreenMeshFound, videoTexture]);

  useEffect(() => {
    if (!videoTexture) return;

    console.log("=== Applying CRT shader to model ===");

    const allMeshes: string[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.Material;
        allMeshes.push(`"${child.name}" (mat: "${mat?.name || 'unnamed'}")`);
      }
    });
    console.log("All meshes:", allMeshes.join(", "));

    // Create CRT shader material with texture transform uniforms
    // texRepeat: -0.75 x (horizontal flip + crop), 1.0 y (no vertical flip)
    // texOffset: 0.875 x (center crop), 0.067 y
    const crtMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: videoTexture },
        time: { value: 0 },
        texRepeat: { value: new THREE.Vector2(-0.75, 1.0) },
        texOffset: { value: new THREE.Vector2(0.875, 0.067) },
        scanlineIntensity: { value: CRTShader.uniforms.scanlineIntensity.value },
        scanlineCount: { value: CRTShader.uniforms.scanlineCount.value },
        rgbOffset: { value: CRTShader.uniforms.rgbOffset.value },
        vignetteIntensity: { value: CRTShader.uniforms.vignetteIntensity.value },
        brightness: { value: CRTShader.uniforms.brightness.value },
        curvature: { value: CRTShader.uniforms.curvature.value },
        flickerIntensity: { value: CRTShader.uniforms.flickerIntensity.value },
        noiseIntensity: { value: CRTShader.uniforms.noiseIntensity.value },
      },
      vertexShader: CRTShader.vertexShader,
      fragmentShader: CRTShader.fragmentShader,
      side: THREE.DoubleSide,
    });

    crtMaterialRef.current = crtMaterial;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materialName = ((child.material as THREE.Material)?.name || "").toLowerCase();

        if (materialName === "screen") {
          console.log(">>> SCREEN FOUND, applying CRT shader:", child.name);
          child.material = crtMaterial;
          screenMeshRef.current = child;
          if (onScreenMeshFound) {
            onScreenMeshFound(child);
          }
        }
      }
    });

    return () => {
      crtMaterial.dispose();
    };
  }, [scene, videoTexture]);

  useFrame(({ clock }) => {
    const currentTexture = videoTextureRef.current;
    if (currentTexture) {
      currentTexture.needsUpdate = true;
    }
    if (crtMaterialRef.current) {
      crtMaterialRef.current.uniforms.time.value = clock.getElapsedTime();
      if (currentTexture && crtMaterialRef.current.uniforms.tDiffuse.value !== currentTexture) {
        console.log('Switching texture in useFrame');
        crtMaterialRef.current.uniforms.tDiffuse.value = currentTexture;
      }
    }
  });

  return <primitive object={scene} />;
}

interface CRTModelViewerProps {
  /**
   * Model path - can be:
   * - A Supabase storage path (e.g., "tv_sony_trinitron_crt_low.glb")
   * - A local path starting with "/" (e.g., "/models/tv.glb") - will use local file
   * - A full URL starting with "http" - will use directly
   */
  modelPath?: string;
  className?: string;
  /**
   * Video URL - supports:
   * - Local video files (e.g., "/movie.webm")
   * - YouTube URLs (e.g., "https://www.youtube.com/watch?v=VIDEO_ID" or "https://youtu.be/VIDEO_ID")
   *   Note: YouTube videos use CSS3D iframe with CSS-based CRT overlay effects
   */
  videoUrl?: string;
}

// Default model filename in Supabase storage
const DEFAULT_MODEL_FILENAME = "tv_sony_trinitron_crt_low.glb";

export function CRTModelViewer({
  modelPath = DEFAULT_MODEL_FILENAME,
  className = "",
  videoUrl
}: CRTModelViewerProps) {
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  // Resolve model URL - either from Supabase storage, local path, or direct URL
  useEffect(() => {
    async function resolveModelUrl() {
      // If it's already a full URL, use directly
      if (modelPath.startsWith('http://') || modelPath.startsWith('https://')) {
        console.log("Using direct model URL:", modelPath);
        setResolvedModelUrl(modelPath);
        return;
      }

      // If it starts with /, treat as local path
      if (modelPath.startsWith('/')) {
        console.log("Using local model path:", modelPath);
        setResolvedModelUrl(modelPath);
        return;
      }

      // Otherwise, fetch from Supabase storage
      try {
        console.log("Fetching model from Supabase storage:", modelPath);
        await initializeSupabase();
        const supabase = getSupabase();

        const { data } = supabase.storage
          .from('models')
          .getPublicUrl(modelPath);

        if (data?.publicUrl) {
          console.log("Resolved Supabase model URL:", data.publicUrl);
          setResolvedModelUrl(data.publicUrl);
        } else {
          console.error("Failed to get public URL for model - no publicUrl in response");
          setModelError('Failed to get public URL for model');
          // Fallback to local path
          const fallbackPath = `/models/${modelPath}`;
          console.log("Falling back to local path:", fallbackPath);
          setResolvedModelUrl(fallbackPath);
        }
      } catch (error) {
        console.error("Failed to resolve model URL:", error);
        setModelError(error instanceof Error ? error.message : 'Failed to load model');
        // Fallback to local path
        const fallbackPath = `/models/${modelPath}`;
        console.log("Falling back to local path:", fallbackPath);
        setResolvedModelUrl(fallbackPath);
      }
    }

    resolveModelUrl();
  }, [modelPath]);

  useEffect(() => {
    if (resolvedModelUrl) {
      console.log("Loading GLB model from:", resolvedModelUrl);
    }
  }, [resolvedModelUrl]);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCaptureMuted, setIsCaptureMuted] = useState(false);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const captureVideoRef = useRef<HTMLVideoElement | null>(null);
  const [screenMesh, setScreenMesh] = useState<THREE.Mesh | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceTypeValue>(VideoSourceType.LocalVideo);

  useEffect(() => {
    if (!videoUrl) {
      setVideoSourceType(VideoSourceType.LocalVideo);
      setYoutubeVideoId(null);
      return;
    }

    if (isYouTubeUrl(videoUrl)) {
      const videoId = extractYouTubeVideoId(videoUrl);
      setYoutubeVideoId(videoId);
      setVideoSourceType(VideoSourceType.YouTubeEmbed);
      return;
    }

    setYoutubeVideoId(null);
    setVideoSourceType(VideoSourceType.LocalVideo);
  }, [videoUrl]);

  useEffect(() => {
    // Skip video element creation for YouTube URLs
    if (!videoUrl) return;
    
    // Double-check it's not a YouTube URL before creating video element
    if (isYouTubeUrl(videoUrl) || videoSourceType === VideoSourceType.YouTubeEmbed) {
      console.log("Skipping video element creation for YouTube URL:", videoUrl);
      return;
    }

    const video = document.createElement('video');
    video.src = videoUrl;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';

    videoRef.current = video;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      console.log("Video loaded, duration:", video.duration, "dimensions:", video.videoWidth, "x", video.videoHeight);

      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      setVideoTexture(texture);

      video.play().then(() => {
        console.log("Video auto-started for texture");
      }).catch((e) => {
        console.log("Auto-play blocked, user must click play:", e);
      });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.pause();
      video.src = '';
      if (videoTexture) {
        videoTexture.dispose();
      }
      if (captureStreamRef.current) {
        captureStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoUrl]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setShowControls(true);
    hideTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2500);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const bottomThreshold = rect.height * 0.25; // Bottom 25% of container
      const mouseY = e.clientY - rect.top;

      if (mouseY > rect.height - bottomThreshold) {
        resetHideTimer();
      }
    };

    const handleMouseLeave = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setShowControls(false);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [resetHideTimer]);

  const togglePlay = useCallback(() => {
    if (isCapturing) {
      if (!captureVideoRef.current) return;
      if (captureVideoRef.current.paused) {
        captureVideoRef.current.play();
        setIsPlaying(true);
      } else {
        captureVideoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isCapturing]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const skipBackward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  }, []);

  const skipForward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
  }, [duration]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const stopCapture = useCallback(() => {
    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach(track => track.stop());
      captureStreamRef.current = null;
    }

    if (captureVideoRef.current) {
      captureVideoRef.current.srcObject = null;
      captureVideoRef.current = null;
    }

    setIsCapturing(false);

    if (videoRef.current && videoUrl) {
      const texture = new THREE.VideoTexture(videoRef.current);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      setVideoTexture(texture);

      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30,
        },
        audio: true,
      });

      const captureVideo = document.createElement('video');
      captureVideo.srcObject = stream;
      captureVideo.muted = isCaptureMuted;
      captureVideo.playsInline = true;
      captureVideo.autoplay = true;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          stopCapture();
        });
      }

      await new Promise<void>((resolve) => {
        captureVideo.onloadedmetadata = () => {
          console.log('Capture video ready:', captureVideo.videoWidth, 'x', captureVideo.videoHeight);
          resolve();
        };
      });

      await captureVideo.play();

      // Create new texture from capture stream
      const texture = new THREE.VideoTexture(captureVideo);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;

      console.log('Capture texture created, setting state...');

      // Pause original video if playing
      if (videoRef.current) {
        videoRef.current.pause();
      }

      // Store references
      captureStreamRef.current = stream;
      captureVideoRef.current = captureVideo;

      // Update texture state
      setVideoTexture(texture);
      setIsCapturing(true);
      setIsPlaying(true);

    } catch (err) {
      // User cancelled or permission denied - silently ignore
      console.log('Screen capture cancelled or denied:', err);
    }
  }, [stopCapture, isCaptureMuted]);

  const toggleCapture = useCallback(() => {
    if (isCapturing) {
      stopCapture();
    } else {
      startCapture();
    }
  }, [isCapturing, startCapture, stopCapture]);

  const toggleCaptureMute = useCallback(() => {
    if (captureVideoRef.current) {
      captureVideoRef.current.muted = !captureVideoRef.current.muted;
      setIsCaptureMuted(captureVideoRef.current.muted);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Ref for the 3D viewer container (for YouTube overlay positioning)
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={`${className} flex flex-col bg-black`} style={{ width: '100%', height: '100%' }}>
      {/* 3D Viewer */}
      <div ref={viewerContainerRef} className="relative flex-1 min-h-0" style={{ overflow: 'hidden' }}>
        {!resolvedModelUrl ? (
          <div className="flex items-center justify-center h-full text-white/50">
            {modelError ? (
              <div className="text-red-400 text-center">
                <p>Failed to load model</p>
                <p className="text-sm mt-1">{modelError}</p>
              </div>
            ) : (
              <p>Loading model...</p>
            )}
          </div>
        ) : (
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          style={{ 
            width: '100%', 
            height: '100%',
            pointerEvents: videoSourceType === VideoSourceType.YouTubeEmbed ? 'none' : 'auto'
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <directionalLight position={[-5, 5, 5]} intensity={0.5} />
            <Bounds fit clip observe margin={1.2}>
              <Model 
                url={resolvedModelUrl}
                videoTexture={videoSourceType === VideoSourceType.YouTubeEmbed ? null : videoTexture}
                onScreenMeshFound={setScreenMesh}
              />
            </Bounds>
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              enableRotate={true}
              target={[0, 0, 0]}
              makeDefault
            />
            <Environment preset="city" />
            {/* CSS3D YouTube - renders iframe ON the TV screen in 3D space */}
            {videoSourceType === VideoSourceType.YouTubeEmbed && youtubeVideoId && (
              <CSS3DYouTube
                screenMesh={screenMesh}
                youtubeVideoId={youtubeVideoId}
                isMuted={isMuted}
                containerRef={viewerContainerRef}
              />
            )}
          </Suspense>
        </Canvas>
        )}

        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5 text-white" />
          ) : (
            <Maximize className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Video Controls Bar */}
      {videoUrl && (
        <div
          className={`bg-slate-800 border-t border-slate-700 p-3 transition-all duration-300 ${
            isFullscreen
              ? `absolute bottom-0 left-0 right-0 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`
              : ''
          }`}
        >
          {/* Timeline - hidden during capture and YouTube mode (YouTube controls are in iframe) */}
          {!isCapturing && videoSourceType !== VideoSourceType.YouTubeEmbed && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-white/70 text-sm font-mono w-12">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                style={{
                  background: `linear-gradient(to right, rgb(34 211 238) 0%, rgb(34 211 238) ${(currentTime / (duration || 1)) * 100}%, rgb(71 85 105) ${(currentTime / (duration || 1)) * 100}%, rgb(71 85 105) 100%)`
                }}
              />
              <span className="text-white/70 text-sm font-mono w-12">{formatTime(duration)}</span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2">
            {/* Skip buttons - hidden during capture and YouTube mode */}
            {!isCapturing && videoSourceType !== VideoSourceType.YouTubeEmbed && (
              <button
                onClick={skipBackward}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Skip back 10s"
              >
                <SkipBack className="w-5 h-5 text-white" />
              </button>
            )}

            <button
              onClick={togglePlay}
              className="p-3 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-full transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-cyan-400" />
              ) : (
                <Play className="w-6 h-6 text-cyan-400" />
              )}
            </button>

            {!isCapturing && videoSourceType !== VideoSourceType.YouTubeEmbed && (
              <button
                onClick={skipForward}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Skip forward 10s"
              >
                <SkipForward className="w-5 h-5 text-white" />
              </button>
            )}

            <div className="w-px h-6 bg-slate-600 mx-2" />

            <button
              onClick={toggleCapture}
              className={`p-2 rounded-lg transition-colors ${
                isCapturing
                  ? 'bg-cyan-500/30 hover:bg-cyan-500/40'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title={isCapturing ? "Stop Capture" : "Capture Tab"}
            >
              {isCapturing ? (
                <ScreenShareOff className="w-5 h-5 text-cyan-400" />
              ) : (
                <ScreenShare className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={isCapturing ? toggleCaptureMute : toggleMute}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={(isCapturing ? isCaptureMuted : isMuted) ? "Unmute" : "Mute"}
            >
              {(isCapturing ? isCaptureMuted : isMuted) ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
