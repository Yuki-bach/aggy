import { createDataFlow, type DataFlowController } from "./lib/dataFlowWebgl";

interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
const staticMotion = reducedMotion || saveData;

function initializeDataFlow(): () => void {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-data-flow]");
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!canvas || !hero || staticMotion) {
    root.classList.add("motion-static");
    return () => {};
  }

  let controller: DataFlowController;
  try {
    controller = createDataFlow(canvas, window.matchMedia("(max-width: 800px)").matches);
    root.classList.add("webgl-ready");
  } catch {
    root.classList.add("webgl-fallback");
    return () => {};
  }

  const observer = new IntersectionObserver(
    ([entry]) => controller.setActive(entry?.isIntersecting),
    { rootMargin: "100px" },
  );
  observer.observe(hero);
  return () => {
    observer.disconnect();
    controller.destroy();
  };
}

const cleanups = [initializeDataFlow()];
window.addEventListener(
  "pagehide",
  () => {
    for (const cleanup of cleanups) cleanup();
  },
  { once: true },
);
