import { ArrowLeftRight, Headphones } from "lucide-react";
import { languageNames } from "../domain/catalog";
import type { Direction, Language } from "../domain/types";

interface HeaderProps {
  direction: Direction;
  onSwap: () => void;
}

export function Header({ direction, onSwap }: HeaderProps) {
  const [source, target] = direction.split("-") as [Language, Language];
  return (
    <header className="site-header">
      <a className="brand" href="#studio" aria-label="MemoryMusic home">
        <span className="brand-mark" aria-hidden="true">
          <span /><span />
        </span>
        <span>
          <strong>MemoryMusic</strong>
          <small>Learn it in a loop</small>
        </span>
      </a>

      <div className="language-route" aria-label={`Learning from ${languageNames[source]} to ${languageNames[target]}`}>
        <span className="language-name source-language">{languageNames[source]}</span>
        <button type="button" onClick={onSwap} aria-label="Swap languages" title="Swap languages">
          <ArrowLeftRight aria-hidden="true" size={18} strokeWidth={2.5} />
        </button>
        <span className="language-name target-language">{languageNames[target]}</span>
      </div>

      <div className="headphone-note">
        <Headphones aria-hidden="true" size={18} />
        <span>Headphones help</span>
      </div>
    </header>
  );
}
