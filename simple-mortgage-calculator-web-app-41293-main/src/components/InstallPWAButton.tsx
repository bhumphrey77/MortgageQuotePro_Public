import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "desktop" | "other";

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac with touch support
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
};

const isStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
};

export const InstallPWAButton = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const isIOS = platform === "ios";
  // Show the button if we have a native prompt, OR we're on iOS (manual instructions)
  if (!deferred && !isIOS) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    if (isIOS) {
      setShowIosModal(true);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleClick} className="gap-2">
        <Download className="h-4 w-4" />
        Install app
      </Button>

      <Dialog open={showIosModal} onOpenChange={setShowIosModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Mortgage Quote Pro</DialogTitle>
            <DialogDescription>
              Add this app to your Home Screen for a full-screen, app-like experience.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-4 py-2 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                1
              </span>
              <div className="flex-1">
                <p className="font-medium">Open this page in Safari</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Install only works from Safari — not Chrome, Firefox, or in-app browsers.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                2
              </span>
              <div className="flex-1">
                <p className="font-medium flex items-center gap-2 flex-wrap">
                  Tap the Share button
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded border bg-muted">
                    <Share className="h-3.5 w-3.5" />
                  </span>
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Usually at the bottom of the screen on iPhone, or top-right on iPad.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                3
              </span>
              <div className="flex-1">
                <p className="font-medium flex items-center gap-2 flex-wrap">
                  Choose "Add to Home Screen"
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded border bg-muted">
                    <PlusSquare className="h-3.5 w-3.5" />
                  </span>
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Scroll down in the Share menu if you don't see it right away.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                4
              </span>
              <div className="flex-1">
                <p className="font-medium">Tap "Add" in the top-right</p>
                <p className="text-muted-foreground text-xs mt-1">
                  The app icon will appear on your Home Screen. Tap it anytime to launch.
                </p>
              </div>
            </li>
          </ol>

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <MoreVertical className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              On Android, tap your browser's menu (⋮) and choose <strong>Install app</strong> or{" "}
              <strong>Add to Home Screen</strong>.
            </span>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowIosModal(false)} className="w-full sm:w-auto">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
