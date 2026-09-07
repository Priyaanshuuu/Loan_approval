"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getVisibleQuestions,
  type QuestionAnswers,
  type QuestionDefinition,
} from "@/lib/questions/questions";
import type { BorrowerProfile } from "@/types/borrower";

interface AssessmentFlowProps {
  onComplete?: (profile: BorrowerProfile) => void;
}

export default function AssessmentFlow({ onComplete }: AssessmentFlowProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => getVisibleQuestions(answers), [answers]);
  const question = questions[questionIndex] ?? questions[questions.length - 1];
  const progress = question
    ? Math.round(((questionIndex + 1) / questions.length) * 100)
    : 0;
  const currentValue = question ? answers[question.key] : undefined;

  function updateAnswer(value: unknown) {
    if (!question) return;

    setAnswers((current) => ({
      ...current,
      [question.key]: normalizeAnswer(question, value),
    }));
    setError(null);
  }

  function moveNext() {
    if (!question) return;

    if (question.required && currentValue === undefined) {
      setError("Please answer this question to continue.");
      return;
    }

    if (questionIndex === questions.length - 1) {
      const profile = buildProfile(answers);
      if (!profile) {
        setError("Please complete all required questions before continuing.");
        return;
      }
      window.sessionStorage.setItem(
        "borrower-copilot-profile",
        JSON.stringify(profile),
      );
      onComplete?.(profile);
      router.push("/results");
      return;
    }

    setQuestionIndex((index) => index + 1);
  }

  function moveBack() {
    setError(null);
    setQuestionIndex((index) => Math.max(0, index - 1));
  }

  if (!question) return null;

  return (
    <section className="assessment-card" aria-labelledby="question-title">
      <div className="assessment-topline">
        <span className="eyebrow">Borrower Copilot / Assessment</span>
        <span className="question-count">
          {questionIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="progress-track" aria-label={`${progress}% complete`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="question-body">
        <p className="question-kicker">
          {question.required ? "Core question" : "Only if relevant to you"}
        </p>
        <h1 id="question-title">{question.label}</h1>
        {question.helpText && <p className="question-help">{question.helpText}</p>}
        <QuestionInput
          question={question}
          value={currentValue}
          onChange={updateAnswer}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>

      <div className="assessment-actions">
        <button
          className="button button-quiet"
          type="button"
          onClick={moveBack}
          disabled={questionIndex === 0}
        >
          Back
        </button>
        <button className="button button-primary" type="button" onClick={moveNext}>
          {questionIndex === questions.length - 1 ? "Review answers" : "Continue"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

interface QuestionInputProps {
  question: QuestionDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  if (question.kind === "select") {
    return (
      <div className="option-grid">
        {question.options?.map((option) => (
          <button
            className={`option-button ${value === option.value ? "selected" : ""}`}
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (question.kind === "boolean") {
    return (
      <div className="option-grid option-grid-small">
        {[{ label: "Yes", value: true }, { label: "No", value: false }].map(
          (option) => (
            <button
              className={`option-button ${value === option.value ? "selected" : ""}`}
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={value === option.value}
            >
              {option.label}
            </button>
          ),
        )}
      </div>
    );
  }

  return (
    <div className="input-stack">
      <div className="input-shell">
        <span className="input-prefix">
          {question.kind === "currency" ? "₹" : question.kind === "percentage" ? "%" : ""}
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={question.kind === "percentage" ? 0 : undefined}
          step={question.kind === "percentage" ? "0.1" : "1"}
          value={value === null || value === undefined ? "" : String(displayValue(question, value))}
          onChange={(event) => onChange(event.target.value)}
          aria-label={question.label}
        />
      </div>
      {question.allowUnknown && (
        <button
          className={`unknown-button ${value === null ? "selected" : ""}`}
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
        >
          I don&apos;t know
        </button>
      )}
    </div>
  );
}

function normalizeAnswer(question: QuestionDefinition, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (question.kind === "number" || question.kind === "currency") {
    if (value === "") return undefined;
    return Number(value);
  }
  if (question.kind === "percentage") {
    if (value === "") return undefined;
    return Number(value) / 100;
  }
  return value;
}

function displayValue(question: QuestionDefinition, value: unknown): unknown {
  if (question.kind === "percentage" && typeof value === "number") {
    return value * 100;
  }
  return value;
}

function buildProfile(answers: QuestionAnswers): BorrowerProfile | null {
  const requiredKeys: (keyof BorrowerProfile)[] = [
    "age",
    "purpose",
    "amountWanted",
    "monthlyIncome",
    "incomeType",
    "existingEmi",
    "householdExpenses",
    "creditScore",
  ];

  if (requiredKeys.some((key) => answers[key] === undefined)) return null;
  return answers as BorrowerProfile;
}