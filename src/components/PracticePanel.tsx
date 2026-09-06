import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { checkAnswer, createPracticeQuestions } from "../domain/practice";
import type { DirectedPair, Language } from "../domain/types";

interface PracticePanelProps {
  pairs: DirectedPair[];
  seed: number;
  onClose: () => void;
}

export function PracticePanel({ pairs, seed, onClose }: PracticePanelProps) {
  const questions = useMemo(() => createPracticeQuestions(pairs, seed), [pairs, seed]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const targetLanguage = pairs[0]?.targetLanguage ?? "id";
  const sourceLanguage = pairs[0]?.sourceLanguage ?? "en";
  const targetName: Record<Language, string> = { en: "English", id: "Indonesian" };

  const choose = (answer: string) => {
    if (selected || !question) return;
    setSelected(answer);
    if (checkAnswer(question, answer)) setScore((current) => current + 1);
  };

  const next = () => {
    if (index === questions.length - 1) {
      setFinished(true);
    } else {
      setIndex((current) => current + 1);
      setSelected(null);
    }
  };

  return (
    <section className="practice-panel" aria-labelledby="practice-title">
      <div className="practice-topline">
        <div>
          <h2 id="practice-title">Quick recall</h2>
          <p>Choose the {targetName[targetLanguage]} match.</p>
        </div>
        <button type="button" className="text-button" onClick={onClose}>Back to lyrics</button>
      </div>
      {finished ? (
        <div className="score-card">
          <span>{score}/{questions.length}</span>
          <h3>{score === questions.length ? "That loop stuck!" : "One more listen will lock it in."}</h3>
          <button className="primary-button" type="button" onClick={onClose}>Hear the song again</button>
        </div>
      ) : question ? (
        <div className="question-card">
          <div className="question-count">Question {index + 1} of {questions.length}</div>
          <p className="question-prompt">What does <strong lang={sourceLanguage}>{question.prompt}</strong> mean?</p>
          <div className="answer-grid">
            {question.options.map((option) => {
              const isSelected = selected === option;
              const isCorrect = selected !== null && checkAnswer(question, option);
              return (
                <button
                  type="button"
                  key={option}
                  onClick={() => choose(option)}
                  disabled={selected !== null}
                  data-result={isCorrect ? "correct" : isSelected ? "incorrect" : undefined}
                >
                  <span>{option}</span>
                  {isCorrect && <Check aria-hidden="true" size={19} />}
                  {isSelected && !isCorrect && <X aria-hidden="true" size={19} />}
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="answer-feedback" role="status">
              <p>{checkAnswer(question, selected) ? "Yes — right on beat." : `Not quite. The match is ${question.answer}.`}</p>
              <button className="primary-button" type="button" onClick={next}>{index === questions.length - 1 ? "See my score" : "Next word"}</button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
