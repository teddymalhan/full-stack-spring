import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds, useBounds } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Maximize, Minimize } from "lucide-react";

interface ModelProps {
  url: string;
  screenImageUrl?: string;
}

function Model({ url, screenImageUrl }: ModelProps) {
  const { scene } = useGLTF(url);
  const bounds = useBounds();

  // Load the screen texture
  const screenTexture = useLoader(THREE.TextureLoader, screenImageUrl || "/models/tv-screen.jpg");

  // Flip the texture vertically
  screenTexture.flipY = false;

  // Configure texture to crop/cover instead of stretch
  // Assuming 4:3 CRT aspect ratio and adjusting for image aspect ratio
  useEffect(() => {
    if (screenTexture.image) {
      const imageAspect = screenTexture.image.width / screenTexture.image.height;
      const screenAspect = 4 / 3; // CRT TV aspect ratio

      if (imageAspect > screenAspect) {
        // Image is wider - crop sides
        const scale = screenAspect / imageAspect;
        screenTexture.repeat.set(scale, 1);
        screenTexture.offset.set((1 - scale) / 2, 0);
      } else {
        // Image is taller - crop top/bottom
        const scale = imageAspect / screenAspect;
        screenTexture.repeat.set(1, scale);
        screenTexture.offset.set(0, (1 - scale) / 2);
      }
      screenTexture.needsUpdate = true;
    }
  }, [screenTexture]);

  useEffect(() => {
    // Fit camera to model on load
    bounds.refresh().fit();
  }, [bounds, scene]);

  useEffect(() => {
    if (screenTexture) {
      // Log all mesh names to help identify the screen
      console.log("Model meshes:");
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log("Mesh:", child.name, "Material:", (child.material as THREE.Material)?.name);
        }
      });

      // Traverse the model to find the screen material and replace it
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const meshName = child.name.toLowerCase();
          const materialName = ((child.material as THREE.Material)?.name || "").toLowerCase();

          // Look for screen-related mesh or material names
          if (
            meshName.includes("screen") ||
            meshName.includes("display") ||
            meshName.includes("glass") ||
            meshName.includes("tv") ||
            meshName.includes("crt") ||
            materialName.includes("screen") ||
            materialName.includes("emissive")
          ) {
            console.log("Replacing material for:", child.name);
            const material = new THREE.MeshBasicMaterial({
              map: screenTexture,
              side: THREE.DoubleSide,
            });
            child.material = material;
          }
        }
      });
    }
  }, [scene, screenTexture]);

  return <primitive object={scene} />;
}

interface CRTModelViewerProps {
  modelPath?: string;
  screenImageUrl?: string;
  className?: string;
}

export function CRTModelViewer({
  modelPath = "/models/tv_sony_trinitron_crt_low.glb",
  screenImageUrl = "/models/tv-screen.jpg",
  className = ""
}: CRTModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <div ref={containerRef} className={`${className} relative bg-slate-900`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 5, 5]} intensity={0.5} />
          <Bounds fit clip observe margin={1.5}>
            <Model url={modelPath} screenImageUrl={screenImageUrl} />
          </Bounds>
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            target={[0, 0, 0]}
            makeDefault
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

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
  );
}
