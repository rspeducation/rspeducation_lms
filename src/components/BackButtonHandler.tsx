import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

const EXIT_PATHS = new Set<string>([
  "/", "/login", "/student/dashboard", "/admin/dashboard"
]);

export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBack = useRef(0);
  const handleRef = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    // Only attach Capacitor backButton handler in Android app
    if (Capacitor.getPlatform() !== "android") return;

    // Remove any previous handler
    handleRef.current?.remove();

    let mounted = true;

    const attach = async () => {
      const handle = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
        const onExitPath = EXIT_PATHS.has(location.pathname);
        if (!canGoBack || onExitPath) {
          const now = Date.now();
          if (now - lastBack.current < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBack.current = now;
            alert("Press again to exit");
          }
        } else {
          navigate(-1);
        }
      });

      if (mounted) handleRef.current = handle;
      else handle.remove();
    };

    attach();

    return () => {
      mounted = false;
      handleRef.current?.remove();
      handleRef.current = null;
    };
  }, [navigate, location.pathname]);

  return null;
}
