import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { validateCustomPairs, type CustomPairRow } from "../domain/customLesson";
import type { Direction, Language } from "../domain/types";

interface CustomLessonDialogProps {
  direction: Direction;
  initialRows: CustomPairRow[];
  onClose: () => void;
  onSave: (rows: CustomPairRow[]) => void;
}

const blankRows = (): CustomPairRow[] => [{ source: "", target: "" }, { source: "", target: "" }];

export function CustomLessonDialog({ direction, initialRows, onClose, onSave }: CustomLessonDialogProps) {
  const [sourceLanguage, targetLanguage] = direction.split("-") as [Language, Language];
  const [rows, setRows] = useState<CustomPairRow[]>(initialRows.length >= 2 ? initialRows : blankRows);
  const [submitted, setSubmitted] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const validation = useMemo(() => validateCustomPairs(rows), [rows]);
  const languageLabel = (language: Language) => ({ en: "English", id: "Indonesian", la: "Latin" })[language];
  const placeholder = (language: Language) => ({ en: "e.g. I will be", id: "mis. merah", la: "e.g. ero" })[language];

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    firstInputRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const changeRow = (index: number, field: keyof CustomPairRow, value: string) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  const submit = () => {
    setSubmitted(true);
    if (validation.valid) onSave(rows);
  };

  return (
    <div className="dialog-scrim">
      <section className="custom-dialog" role="dialog" aria-modal="true" aria-labelledby="custom-title">
        <div className="dialog-header">
          <div>
            <h2 id="custom-title">Build a custom lesson</h2>
            <p>Add words in the same direction as your song.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close custom lesson">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="custom-rows">
          {rows.map((row, index) => (
            <div className="custom-row" key={index}>
              <label>
                <span>{languageLabel(sourceLanguage)} word {index + 1}</span>
                <input maxLength={80} ref={index === 0 ? firstInputRef : undefined} value={row.source} onChange={(event) => changeRow(index, "source", event.target.value)} placeholder={placeholder(sourceLanguage)} />
              </label>
              <label>
                <span>{languageLabel(targetLanguage)} word {index + 1}</span>
                <input maxLength={80} value={row.target} onChange={(event) => changeRow(index, "target", event.target.value)} placeholder={placeholder(targetLanguage)} />
              </label>
              <button type="button" className="remove-row" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} disabled={rows.length <= 2} aria-label={`Remove word pair ${index + 1}`}>
                <Trash2 aria-hidden="true" size={18} />
              </button>
              {submitted && validation.rowErrors[index] && <p className="row-error">{validation.rowErrors[index].join(" ")}</p>}
            </div>
          ))}
        </div>

        <button className="add-row" type="button" onClick={() => setRows((current) => [...current, { source: "", target: "" }])} disabled={rows.length >= 12}>
          <Plus aria-hidden="true" size={18} /> Add another pair
        </button>
        {submitted && !validation.valid && <p className="form-error" role="alert">{validation.message}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="button" onClick={submit}>Make my song</button>
        </div>
      </section>
    </div>
  );
}
