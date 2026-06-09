"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, HelpCircle, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { QuestionTypeSelector } from "@/features/quiz/components/question-type-selector"
import { QuizImageUpload } from "@/features/quiz/components/quiz-image-upload"
import {
  AnswerOptionEditor,
  REQUIRED_OPTION_COUNT,
  type AnswerOptionDraft,
} from "@/features/quiz/components/answer-option-editor"
import type { QuestionType } from "@/features/quiz/components/question-card"

const SUPPORTED_TYPES: QuestionType[] = ["single_select", "multi_select"]

interface FormErrors {
  text?: string
  time_limit?: string
  answer_options?: string
  general?: string
}

function makeEmptyOptions(): AnswerOptionDraft[] {
  return Array.from({ length: REQUIRED_OPTION_COUNT }, () => ({ text: "", is_correct: false }))
}

/**
 * Add Question page — Client Component.
 *
 * Two-column layout:
 *   - Left: configuration (question type, time limit, helpful tips).
 *   - Right: the question prompt and the four required answer options.
 *
 * Only `single_select` and `multi_select` are supported. Every question has
 * exactly {@link REQUIRED_OPTION_COUNT} answer options and at least one must
 * be marked as correct.
 *
 * Requirements: 2.3, 3.1–3.8
 */
export default function NewQuestionPage() {
  const router = useRouter()
  const params = useParams<{ eventId: string }>()
  const eventId = params.eventId

  const [questionType, setQuestionType] = useState<QuestionType>("single_select")
  const [text, setText] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [timeLimit, setTimeLimit] = useState(20)
  const [answerOptions, setAnswerOptions] = useState<AnswerOptionDraft[]>(makeEmptyOptions)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const next: FormErrors = {}

    if (!text.trim()) {
      next.text = "Question text is required."
    } else if (text.trim().length > 255) {
      next.text = "Question text must be 255 characters or fewer."
    }

    if (!Number.isInteger(timeLimit) || timeLimit < 5 || timeLimit > 120) {
      next.time_limit = "Time limit must be between 5 and 120 seconds."
    }

    if (answerOptions.length !== REQUIRED_OPTION_COUNT) {
      next.answer_options = `You must provide exactly ${REQUIRED_OPTION_COUNT} answer options.`
    } else if (answerOptions.some((o) => o.text.trim().length === 0)) {
      next.answer_options = "All four answer options must be filled in."
    } else if (!answerOptions.some((o) => o.is_correct)) {
      next.answer_options =
        questionType === "single_select"
          ? "Pick the correct answer."
          : "Tick at least one correct answer."
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleTypeChange(type: QuestionType) {
    if (!SUPPORTED_TYPES.includes(type)) return
    setQuestionType(type)
    setErrors({})
    // When moving from multi to single, keep at most one correct selection so
    // the radio behavior doesn't start with multiple selected options.
    if (type === "single_select") {
      let kept = false
      setAnswerOptions((prev) =>
        prev.map((opt) => {
          if (opt.is_correct && !kept) {
            kept = true
            return opt
          }
          return { ...opt, is_correct: false }
        })
      )
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    const payload = {
      question_type: questionType,
      text: text.trim(),
      time_limit: timeLimit,
      image_url: imageUrl,
      answer_options: answerOptions.map((opt, idx) => ({
        text: opt.text.trim(),
        is_correct: opt.is_correct,
        position: idx + 1,
      })),
    }

    try {
      const res = await fetch(`/api/quiz/v1/events/${eventId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const body = await res.json()

      if (!res.ok) {
        const apiError = body?.error
        if (apiError?.field) {
          setErrors({ [apiError.field as keyof FormErrors]: apiError.message })
          toast.error(apiError.message ?? "Please fix the highlighted fields.")
        } else {
          const msg = apiError?.message ?? "Failed to create question."
          setErrors({ general: msg })
          toast.error(msg)
        }
        return
      }

      toast.success("Question added")
      router.push(`/quiz/events/${eventId}`)
    } catch {
      const msg = "An unexpected error occurred. Please try again."
      setErrors({ general: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/quiz/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add Question</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the question on the left and write the prompt and answers on the right.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <div
            role="alert"
            className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* Left column — configuration */}
          <aside className="space-y-6 lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  Question Type
                </CardTitle>
                <CardDescription>
                  Pick how participants should answer this question.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionTypeSelector value={questionType} onChange={handleTypeChange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Time Limit
                </CardTitle>
                <CardDescription>
                  How long participants have to answer, in seconds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="time_limit">
                    Seconds{" "}
                    <span className="text-muted-foreground font-normal text-xs">
                      (5–120, default 20)
                    </span>
                  </Label>
                  <Input
                    id="time_limit"
                    type="number"
                    min={5}
                    max={120}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    aria-describedby={errors.time_limit ? "time-limit-error" : undefined}
                    aria-invalid={!!errors.time_limit}
                    className="w-32"
                  />
                  {errors.time_limit && (
                    <p id="time-limit-error" role="alert" className="text-sm text-destructive">
                      {errors.time_limit}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Keep the question short — under 120 characters works best on phones.</li>
                  <li>Every question has exactly four answer options.</li>
                  <li>
                    {questionType === "single_select"
                      ? "Pick one correct answer; participants pick exactly one."
                      : "Tick every option that is correct; participants can pick multiple."}
                  </li>
                  <li>20 seconds is a good default — bump it up for trickier questions.</li>
                </ul>
              </CardContent>
            </Card>
          </aside>

          {/* Right column — prompt + answer options */}
          <div className="space-y-6 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Question</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <textarea
                    id="text"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Enter your question…"
                    maxLength={255}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    aria-label="Question text"
                    aria-describedby={errors.text ? "text-error" : undefined}
                    aria-invalid={!!errors.text}
                    required
                  />
                  {errors.text && (
                    <p id="text-error" role="alert" className="text-sm text-destructive">
                      {errors.text}
                    </p>
                  )}
                  <p
                    className={`text-xs tabular-nums text-right ${
                      text.length >= 255 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {text.length}/255
                  </p>
                </div>
                <div className="mt-4">
                  <QuizImageUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    label="Question image (optional)"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <AnswerOptionEditor
                  options={answerOptions}
                  onChange={setAnswerOptions}
                  mode={questionType === "single_select" ? "single" : "multi"}
                  error={errors.answer_options}
                />
              </CardContent>
            </Card>

            {/* Footer actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <Link
                href={`/quiz/events/${eventId}`}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </Link>
              <Button type="submit" disabled={loading} className="sm:min-w-[160px]">
                {loading ? (
                  <>
                    <Spinner size="sm" className="text-primary-foreground" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
