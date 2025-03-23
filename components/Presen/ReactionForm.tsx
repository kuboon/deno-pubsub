export function ReactionSender(
  { onSubmit }: { onSubmit: (reaction: string) => void },
) {
  const reactions = ["👍", "👎", "❤️", "😂", "😮", "😢", "😡"];

  return (
    <div class="reaction-sender">
      {reactions.map((reaction) => (
        <button
          type="button"
          key={reaction}
          class="reaction-button btn btn-ghost"
          onClick={() => onSubmit(reaction)}
        >
          {reaction}
        </button>
      ))}
    </div>
  );
}
