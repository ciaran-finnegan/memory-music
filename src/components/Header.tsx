import { ArrowLeftRight } from "lucide-react";
import { languageNames } from "../domain/catalog";
import type { Direction, Language } from "../domain/types";

interface HeaderProps {
  direction: Direction;
  onSwap: () => void;
  onCourse: (language: "id" | "la") => void;
}

export function Header({ direction, onSwap, onCourse }: HeaderProps) {
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

      <label className="course-picker">
        <span>Language course</span>
        <select aria-label="Language course" value={direction.includes("la") ? "la" : "id"} onChange={(event) => onCourse(event.target.value as "id" | "la")}>
          <option value="id">English ↔ Indonesian</option>
          <option value="la">English ↔ Latin</option>
        </select>
      </label>
    </header>
  );
}
