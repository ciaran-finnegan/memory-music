import { BookOpen, CalendarDays, CalendarRange, Hash, Plus } from "lucide-react";
import { lessons, supportsDirection } from "../domain/catalog";
import type { Direction, Language, LessonId } from "../domain/types";

interface LessonPickerProps {
  activeId: LessonId;
  language: Language;
  direction: Direction;
  onSelect: (id: Exclude<LessonId, "custom">) => void;
  onCustom: () => void;
}

const icons = {
  days: CalendarDays,
  months: CalendarRange,
  numbers: Hash,
  "latin-future": BookOpen,
};

export function LessonPicker({ activeId, language, direction, onSelect, onCustom }: LessonPickerProps) {
  const interfaceLanguage = language === "id" ? "id" : "en";
  return (
    <nav className="lesson-picker" aria-label="Choose a lesson">
      {lessons.filter((lesson) => supportsDirection(lesson, direction)).map((lesson) => {
        const Icon = icons[lesson.id as keyof typeof icons];
        return (
          <button
            className="lesson-tab"
            data-active={activeId === lesson.id}
            key={lesson.id}
            type="button"
            onClick={() => onSelect(lesson.id as Exclude<LessonId, "custom">)}
            aria-pressed={activeId === lesson.id}
          >
            <span className="lesson-icon"><Icon aria-hidden="true" size={20} /></span>
            <span>
              <strong>{lesson.shortName[interfaceLanguage]}</strong>
              <small>{lesson.description[interfaceLanguage]}</small>
            </span>
          </button>
        );
      })}
      <button className="lesson-tab custom-tab" data-active={activeId === "custom"} type="button" onClick={onCustom}>
        <span className="lesson-icon"><Plus aria-hidden="true" size={20} /></span>
        <span>
          <strong>{interfaceLanguage === "en" ? "Custom lesson" : "Pelajaran sendiri"}</strong>
          <small>{interfaceLanguage === "en" ? "Use your own words" : "Pakai kata-katamu"}</small>
        </span>
      </button>
    </nav>
  );
}
