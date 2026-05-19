import { type FormEvent, useRef } from "react";
import { SearchIcon } from "./Icon";

export type CardSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isCompact?: boolean;
  className?: string;
};

export function CardSearchInput({ value, onChange, onSubmit, isCompact, className }: CardSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  function handleClear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <form
      className={`min-w-0 ${className ?? ""}`}
      onSubmit={handleSubmit}
      role="search"
      aria-label="Card search"
    >
      <div className="flex items-stretch overflow-hidden min-h-[58px] rounded-[16px] bg-[rgba(11,14,22,0.48)] border border-[rgba(255,219,155,0.18)] backdrop-blur-[12px] focus-within:border-[rgba(247,198,91,0.72)] focus-within:shadow-[0_0_0_3px_rgba(215,170,73,0.2)]">
        <span
          className="grid place-items-center pl-[0.85rem] pr-[0.5rem] text-text-tertiary [&_svg]:w-4 [&_svg]:h-4 shrink-0"
          aria-hidden="true"
        >
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          className="flex-1 min-w-0 border-0 bg-transparent text-text-primary outline-none placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:hidden"
          type="search"
          placeholder={isCompact ? "Search" : "Search for Riftbound Cards"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search cards"
        />
        {value !== "" && (
          <button
            type="button"
            className="grid place-items-center px-[0.65rem] text-[#c62f45] hover:text-[#e03d55] cursor-pointer border-0 bg-transparent shrink-0 text-[0.85rem]"
            aria-label="Clear search"
            onClick={handleClear}
          >
            ✕
          </button>
        )}
        <button
          type="submit"
          className="self-stretch border-0 rounded-none px-[1.2rem] bg-[image:var(--gradient-accent-button)] text-[#fff9f5] font-bold cursor-pointer whitespace-nowrap shadow-[0_10px_24px_rgba(133,18,32,0.32),inset_0_1px_0_rgba(255,242,218,0.28)] hover:brightness-[1.08] hover:saturate-[1.04]"
        >
          Search
        </button>
      </div>
    </form>
  );
}
