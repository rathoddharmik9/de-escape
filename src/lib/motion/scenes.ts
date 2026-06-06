export type SceneName = "dawn" | "trail" | "deep" | "pulse";

export interface ScenePreset {
  colorA: [number, number, number]; // green motion color (0–1 rgb)
  colorB: [number, number, number]; // lime accent
  colorC: [number, number, number]; // cream base (keeps field light)
  speed: number;
  density: number;
}

const rgb = (r: number, g: number, b: number): [number, number, number] => [
  r / 255,
  g / 255,
  b / 255,
];

export const SCENE_PRESETS: Record<SceneName, ScenePreset> = {
  dawn:  { colorA: rgb(44, 138, 75), colorB: rgb(200, 241, 53), colorC: rgb(245, 236, 206), speed: 0.12, density: 0.55 },
  trail: { colorA: rgb(44, 138, 75), colorB: rgb(169, 206, 30), colorC: rgb(245, 236, 206), speed: 0.18, density: 0.7 },
  deep:  { colorA: rgb(31, 99, 54),  colorB: rgb(44, 138, 75),  colorC: rgb(236, 224, 192), speed: 0.07, density: 0.85 },
  pulse: { colorA: rgb(44, 138, 75), colorB: rgb(200, 241, 53), colorC: rgb(245, 236, 206), speed: 0.25, density: 0.6 },
};

export const DEFAULT_SCENE: SceneName = "dawn";
