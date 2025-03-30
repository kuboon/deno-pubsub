import { computed, effect, signal } from "@preact/signals";

export { effect };

export const markdownSignal = signal("");

export const currentPageSignal = signal(0);
export const currentSectionSignal = signal(0);

export type Reaction = {
  emoji: string;
  timestamp: number;
};
export const reactionsSignal = signal<Reaction[]>([]);
export const activeReactions = computed(() => {
  const timeout = Date.now() - 1000 * 3; // 3 seconds
  return reactionsSignal.value.filter(({ timestamp }) => timestamp > timeout);
});
