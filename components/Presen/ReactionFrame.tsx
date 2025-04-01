import { JSX } from "preact/jsx-runtime";
import { activeReactions, reactionsSignal } from "./signals.ts";
import { publishReaction } from "./connection.ts";

const postionFromTimestamp = (timestamp: number) => {
  const top = timestamp % 97;
  const left = timestamp % 71;
  return `top: ${top}%; left: ${left}%;`;
};

export default function ReactionFrame({ children }: { children: JSX.Element }) {
  return (
    <>
      <div class="reaction-frame h-full">
        {children}
        {activeReactions.value.map(({ emoji, timestamp }) => (
          <div
            class="reaction-item"
            key={timestamp}
            style={postionFromTimestamp(timestamp)}
          >
            {emoji}
          </div>
        ))}
      </div>
      <ReactionSender />
    </>
  );
}

function ReactionSender() {
  const reactions = ["👍", "❤️", "😂", "😮", "👏"];

  return (
    <div class="reaction-sender">
      {reactions.map((reaction) => (
        <button
          type="button"
          key={reaction}
          class="reaction-button btn btn-ghost"
          onClick={() => {
            const newReaction = {
              emoji: reaction,
              timestamp: Date.now(),
            };
            reactionsSignal.value = [...activeReactions.value, newReaction];
            publishReaction(newReaction);
          }}
        >
          {reaction}
        </button>
      ))}
    </div>
  );
}
