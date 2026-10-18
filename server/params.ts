const defaults = {
  SAIL_RISE: 0.25,
  SAIL_LOOSEN: 0.05,
  MAX_SPEED: 1.2,
  TURN_RATE: 0.8,
  REEF_DAMAGE: 15,
  LEAK_PER_DAMAGE: 0.07,
  LEAK_CAP: 40,
  REPAIR_RATE: 20,
  PUMP_RATE: 3,
  LAUNCH_DELAY_S: 10,
  DERELICT_S: 300,
  SIGHT: 8,
  BOARD_RANGE: 5.5,
  SHIPS_AT_PIER: 1,
  MAX_SHIPS: 12,
  LANDING_RANGE: 4.5,
  REEF_FROM: 10,
  REEF_SLOPE: 50,
  REEF_MAX: 0.5,
  REEF_CLUMP: 1,
  HELM_DRIFT: 0.1,
};

export type Params = typeof defaults;

let overrides: Partial<Params> = {};
try {
  overrides = JSON.parse(process.env.SHIP_PARAMS ?? "{}");
} catch {
  overrides = {};
}

export const P: Params = { ...defaults, ...overrides };
