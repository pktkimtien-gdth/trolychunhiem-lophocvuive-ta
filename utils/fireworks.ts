import confetti from 'canvas-confetti';

let activeAnimationId: number | null = null;
let activeTimeoutId: NodeJS.Timeout | null = null;

/**
 * Triggers a 60fps hardware-accelerated fireworks celebration.
 * Optimized using requestAnimationFrame to prevent layout thrashing and jank.
 * Respects 'prefers-reduced-motion'.
 */
export function triggerFireworksCelebration() {
  // Cancel any ongoing animation before starting a new one
  cancelFireworksCelebration();

  // Respect system reduced-motion preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
    });
    return;
  }

  const duration = 2.2 * 1000;
  const animationEnd = performance.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 99999,
    disableForReducedMotion: true,
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Initial immediate center burst (GPU compositor friendly)
  confetti({
    particleCount: 80,
    spread: 75,
    origin: { y: 0.6 },
    colors: ['#ffd700', '#ff4757', '#2ed573', '#1e90ff', '#ffa502'],
    disableForReducedMotion: true,
  });

  let lastBurstTime = performance.now();
  const burstInterval = 200; // ms

  // 60fps requestAnimationFrame loop for side cannons
  function frame(currentTime: number) {
    const timeLeft = animationEnd - currentTime;

    if (timeLeft <= 0) {
      activeAnimationId = null;
      return;
    }

    // Fire side cannons at controlled intervals locked to frame refresh
    if (currentTime - lastBurstTime >= burstInterval) {
      lastBurstTime = currentTime;
      const particleCount = Math.floor(35 * (timeLeft / duration));

      // Left side cannon
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.35), y: Math.random() * 0.35 + 0.35 },
        colors: ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#e056fd'],
      });

      // Right side cannon
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.65, 0.9), y: Math.random() * 0.35 + 0.35 },
        colors: ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#e056fd'],
      });
    }

    activeAnimationId = requestAnimationFrame(frame);
  }

  activeAnimationId = requestAnimationFrame(frame);

  // Grand finale stars and shapes burst
  activeTimeoutId = setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.5 },
      shapes: ['star', 'circle'],
      colors: ['#ffd700', '#ffa502', '#ffffff'],
      disableForReducedMotion: true,
    });
  }, 750);
}

/**
 * Clean up running confetti frames to prevent memory leaks when components unmount
 */
export function cancelFireworksCelebration() {
  if (activeAnimationId !== null) {
    cancelAnimationFrame(activeAnimationId);
    activeAnimationId = null;
  }
  if (activeTimeoutId !== null) {
    clearTimeout(activeTimeoutId);
    activeTimeoutId = null;
  }
}
