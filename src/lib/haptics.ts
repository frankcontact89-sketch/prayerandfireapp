import { toast } from "@/hooks/use-toast";

interface HapticsOptions {
  pattern?: number | number[];
  successMessage?: string;
  showToast?: boolean;
}

/**
 * Trigger haptic feedback (vibration) with fallback for unsupported devices.
 * On devices that don't support vibration (like iPhone), shows a toast and/or returns false.
 * 
 * @param options - Configuration options
 * @returns boolean - true if vibration was triggered, false if fallback was used
 */
export function triggerHaptics(options: HapticsOptions = {}): boolean {
  const {
    pattern = 50,
    successMessage,
    showToast = false
  } = options;

  // Try to use the Vibration API
  if ("vibrate" in navigator) {
    try {
      const result = navigator.vibrate(pattern);
      if (result) {
        // Vibration triggered successfully
        if (showToast && successMessage) {
          toast({
            title: successMessage,
            duration: 2000,
          });
        }
        return true;
      }
    } catch (error) {
      // Vibration failed, use fallback
      console.log("Vibration API error:", error);
    }
  }

  // Fallback for devices that don't support vibration (iPhone, etc.)
  if (showToast && successMessage) {
    toast({
      title: successMessage,
      duration: 2000,
    });
  }
  
  return false;
}

/**
 * Light haptic feedback for button taps
 */
export function lightHaptic(): boolean {
  return triggerHaptics({ pattern: 10 });
}

/**
 * Medium haptic feedback for confirmations
 */
export function mediumHaptic(): boolean {
  return triggerHaptics({ pattern: 50 });
}

/**
 * Strong haptic feedback for notifications/alerts
 */
export function strongHaptic(): boolean {
  return triggerHaptics({ pattern: [100, 50, 100] });
}

/**
 * Notification pattern - multiple vibrations
 */
export function notificationHaptic(): boolean {
  return triggerHaptics({ pattern: [500, 200, 500, 200, 500] });
}

/**
 * Success feedback with optional toast
 */
export function successFeedback(message?: string): void {
  const vibrated = triggerHaptics({ pattern: [50, 30, 50] });
  
  // Always show toast for success, regardless of vibration support
  if (message) {
    toast({
      title: message,
      duration: 2000,
    });
  }
}

/**
 * Apply pulse animation to an element
 */
export function pulseElement(element: HTMLElement | null): void {
  if (!element) return;
  
  element.classList.add("animate-pulse-quick");
  setTimeout(() => {
    element.classList.remove("animate-pulse-quick");
  }, 200);
}
