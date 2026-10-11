const defaults = {
  SAIL_RISE: 0.25,
  SAIL_LOOSEN: 0.05,
  MAX_SPEED: 3,
  TURN_RATE: 0.8,
  REEF_DAMAGE: 10,
  LEAK_PER_DAMAGE: 0.02,
  PUMP_RATE: 3,
  LAUNCH_DELAY_S: 5,
  SIGHT: 8,
  BOARD_RANGE: 9,
  SHIPS_AT_PIER: 3,
  MAX_SHIPS: 12,
  LANDING_RANGE: 4.5,
};

export type Params = typeof defaults;

let overrides: Partial<Params> = {};
try {
  overrides = JSON.parse(process.env.SHIP_PARAMS ?? "{}");
} catch {
  overrides = {};
}

export const P: Params = { ...defaults, ...overrides };
