// Parsing what the GM types into the HP box, and applying it.
//   "7" or "-7"  -> 7 damage
//   "+5"         -> heal 5 (never above max; healing from below 0 starts at 0)
//   "=20"        -> set HP to exactly 20
//   "max 30" / "m30" -> set max HP to 30 (current HP keeps the same damage taken)

export type HpOp =
  | { kind: "damage"; amount: number }
  | { kind: "heal"; amount: number }
  | { kind: "set"; amount: number }
  | { kind: "max"; amount: number };

export function parseHpInput(input: string): HpOp | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;
  let m = /^(?:max|m)=?(\d+)$/.exec(s);
  if (m) return { kind: "max", amount: Number(m[1]) };
  m = /^=(-?\d+)$/.exec(s);
  if (m) return { kind: "set", amount: Number(m[1]) };
  m = /^\+(\d+)$/.exec(s);
  if (m) return { kind: "heal", amount: Number(m[1]) };
  m = /^-?(\d+)$/.exec(s);
  if (m) return { kind: "damage", amount: Number(m[1]) };
  return null;
}

export interface HpState {
  hp: number;
  maxHp: number;
}

/** Damage can take HP below 0 (shows overkill); healing stops at max. */
export function applyHp(state: HpState, op: HpOp): HpState {
  switch (op.kind) {
    case "damage":
      return { ...state, hp: state.hp - op.amount };
    case "heal":
      return { ...state, hp: Math.min(state.maxHp, Math.max(state.hp, 0) + op.amount) };
    case "set":
      return { ...state, hp: op.amount };
    case "max": {
      const taken = state.maxHp - state.hp;
      const maxHp = Math.max(1, op.amount);
      return { hp: maxHp - taken, maxHp };
    }
  }
}

export function describeHpOp(op: HpOp): string {
  switch (op.kind) {
    case "damage":
      return `${op.amount} damage`;
    case "heal":
      return `healed ${op.amount}`;
    case "set":
      return `HP set to ${op.amount}`;
    case "max":
      return `max HP set to ${op.amount}`;
  }
}

/** Colour band for the on-token HP label. */
export function hpBand(state: HpState): "healthy" | "bloodied" | "down" {
  if (state.hp <= 0) return "down";
  if (state.hp <= state.maxHp / 2) return "bloodied";
  return "healthy";
}
