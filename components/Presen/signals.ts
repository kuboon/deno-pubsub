import { computed, signal } from "@preact/signals";

export const markdownSignal = signal("");

const conditionalSignal = <T, T2 = Record<string, unknown>>(
  defaultValue: T,
  computeFn: (val: T) => T,
  ext = {} as T2,
) => {
  const val = signal(defaultValue);
  const computedVal = computed(() => computeFn(val.value));
  return {
    get value() {
      return computedVal.value;
    },
    set value(newVal: T) {
      val.value = newVal;
    },
    update: (fn: (value: T) => T) => {
      val.value = fn(computedVal.value);
    },
    peek: () => computedVal.peek(),
    ...ext,
  };
};

const rangedNumSignal = () => {
  const min = signal(0);
  const max = signal(0);
  const computeFn = (value: number) => {
    if (value < min.value) {
      return min.value;
    } else if (value > max.value) {
      return max.value;
    }
    return value;
  };
  return conditionalSignal(0, computeFn, { min, max });
};
export const currentPageRanged = rangedNumSignal();
export const currentSectionRanged = rangedNumSignal();

export type Reaction = {
  emoji: string;
  timestamp: number;
};
export const reactionsSignal = signal<Reaction[]>([]);
export const activeReactions = computed(() => {
  const timeout = Date.now() - 1000 * 3; // 3 seconds
  return reactionsSignal.value.filter(({ timestamp }) => timestamp > timeout);
});
