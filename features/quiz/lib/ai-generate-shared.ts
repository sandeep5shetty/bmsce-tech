import type { AiGeneratedQuestion, GenerateQuestionsInput } from "./validation";

export function normalizeGeneratedQuestion(
  question: AiGeneratedQuestion,
  input: GenerateQuestionsInput,
): AiGeneratedQuestion {
  const options = question.answer_options.map((opt) => ({
    text: opt.text.trim(),
    is_correct: opt.is_correct,
  }));

  if (input.question_type === "single_select") {
    const correctIndexes = options
      .map((opt, idx) => (opt.is_correct ? idx : -1))
      .filter((idx) => idx >= 0);
    const keepCorrect =
      correctIndexes.length > 0 ? correctIndexes[0] : 0;
    options.forEach((opt, idx) => {
      opt.is_correct = idx === keepCorrect;
    });
  } else {
    if (!options.some((opt) => opt.is_correct)) {
      options[0].is_correct = true;
      options[1].is_correct = true;
    }
  }

  return {
    text: question.text.trim(),
    question_type: input.question_type,
    time_limit: question.time_limit,
    answer_options: options,
    citations: question.citations,
  };
}
