/**
 * V-nus 2.0 Industrial UI Constants
 */
export const INDUSTRIAL_TRANSITIONS = {
  spring: { type: "spring", stiffness: 300, damping: 30 },
  heavy: { type: "spring", stiffness: 100, damping: 20, mass: 1.2 },
  glitch: { repeat: Infinity, duration: 0.2, repeatType: "mirror" }
};

export const NEURAL_COLORS = {
  active: "#6366f1",
  processing: "#f472b6",
  success: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
  glass: "rgba(10, 10, 12, 0.85)",
  border: "rgba(255, 255, 255, 0.08)"
};
