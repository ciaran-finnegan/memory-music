import { CalendarDays, CalendarRange, Hash, Plus } from "lucide-react";
import { lessons } from "../domain/catalog";
import type { Language, LessonId } from "../domain/types";

interface LessonPickerProps {
  activeId: LessonId;
  language: Language;
  onSelect: (id: "days" | "months" | "numbers") => void;
  onCustom: () => void;
}

const icons = {
  days: CalendarDays,
  months: CalendarRange,
  numbers: Hash,
};

export function LessonPicker({ activeId, language, onSelect, onCustom }: LessonPickerProps) {
  return (
    <nav className="lesson-picker" aria-label="Choose a lesson">
      {lessons.map((lesson) => {
        const Icon = icons[lesson.id as keyof typeof icons];
        return (
          <button
            className="lesson-tab"
            data-active={activeId === lesson.id}
            key={lesson.id}
            type="button"
            onClick={() => onSelect(lesson.id as "days" | "months" | "numbers")}
            aria-pressed={activeId === lesson.id}
          >
            <span className="lesson-icon"><Icon aria-hidden="true" size={20} /></span>
            <span>
              <strong>{lesson.shortName[language]}</strong>
              <small>{lesson.description[language]}</small>
            </span>
          </button>
        );
      })}
      <button className="lesson-tab custom-tab" data-active={activeId === "custom"} type="button" onClick={onCustom}>
        <span className="lesson-icon"><Plus aria-hidden="true" size={20} /></span>
        <span>
          <strong>{language === "en" ? "Custom lesson" : "Pelajaran sendiri"}</strong>
          <small>{language === "en" ? "Use your own words" : "Pakai kata-katamu"}</small>
        </span>
      </button>
    </nav>
  );
}
