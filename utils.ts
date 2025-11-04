import { createDefine } from "fresh";

// Extend this type if you need to share values via ctx.state.
export type State = Record<string, unknown>;

export const define = createDefine<State>();
