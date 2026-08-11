import type { OptionKey } from "../lib/types";
import "./OptionButton.css";

export function OptionButton({
  optionKey,
  text,
  selected,
  onSelect,
}: {
  optionKey: OptionKey;
  text: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`option ${selected ? "option--selected" : ""}`}
      onClick={onSelect}
    >
      <span className="option__key">{optionKey}</span>
      <span className="option__text">{text}</span>
    </button>
  );
}
