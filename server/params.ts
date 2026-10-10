const defaults = {
  SAIL_RISE: 0.25,
  SAIL_LOOSEN: 0.05,
  MAX_SPEED: 3,
  TURN_RATE: 0.8,
  REEF_DAMAGE: 10,
  LEAK_PER_DAMAGE: 0.02,
  PUMP_RATE: 3,
  LAUNCH_DELAY_S: 300,
  SIGHT: 8,
  BOARD_RANGE: 7,
  SHIPS_AT_PIER: 3,
  LANDING_RANGE: 1.2,
};

export type Params = typeof defaults;

let overrides: Partial<Params> = {};
try {
  overrides = JSON.parse(process.env.SHIP_PARAMS ?? "{}");
} catch {
  overrides = {};
}

export const P: Params = { ...defaults, ...overrides };
