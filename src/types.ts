/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface CarStats {
  id: number;
  name: string;
  maxSpeed: number;
  acceleration: number;
  steering: number;
  price: number;
  color: string;
  unlocked: boolean;
  upgrades: {
    speed: number;
    handling: number;
  };
}

export interface GameState {
  money: number;
  currentCarId: number;
  cars: CarStats[];
  isPlaying: boolean;
  score: number;
  multiplier: number;
}

export const CAR_CONFIG = {
  WIDTH: 30,
  HEIGHT: 60,
  DRIFT_THRESHOLD: 1.5,
  LATERAL_FRICTION: 0.92,
  DRIFT_LATERAL_FRICTION: 0.98,
  MAX_UPGRADE_LEVEL: 5,
};

export const INITIAL_CARS: CarStats[] = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  name: i === 0 ? "Starter Drift" : `Speedster RX-${i + 1}`,
  maxSpeed: 6 + i * 0.4,
  acceleration: 0.12 + i * 0.01,
  steering: 0.05 + i * 0.002,
  price: i * 1500,
  color: `hsl(${i * 24}, 80%, 50%)`,
  unlocked: i === 0,
  upgrades: { speed: 0, handling: 0 },
}));
