interface ServiceWorkerContainerLike {
  register(scriptURL: string): Promise<unknown>;
}

interface NavigatorLike {
  serviceWorker?: ServiceWorkerContainerLike;
}

interface WindowLike {
  readyState: DocumentReadyState;
  addEventListener(type: "load", listener: () => void, options?: { once?: boolean }): void;
}

export function registerServiceWorker(
  navigatorLike: NavigatorLike = navigator,
  windowLike: WindowLike = {
    get readyState() { return document.readyState; },
    addEventListener: (type, listener, options) => window.addEventListener(type, listener, options),
  },
): Promise<unknown> {
  if (!navigatorLike.serviceWorker) return Promise.resolve(undefined);
  const register = () => navigatorLike.serviceWorker?.register("/sw.js") ?? Promise.resolve(undefined);
  if (windowLike.readyState === "complete") return register();
  return new Promise((resolve) => {
    windowLike.addEventListener("load", () => resolve(register()), { once: true });
  });
}
