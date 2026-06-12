"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/features/quiz/lib/supabase-client"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { QuizFullscreenGuard } from "@/features/quiz/components/quiz-fullscreen-guard"
import { QuizAvatar } from "@/features/quiz/components/quiz-avatar"
import { QuizAvatarPicker } from "@/features/quiz/components/quiz-avatar-picker"
import { useQuizFullscreen } from "@/features/quiz/hooks/use-quiz-fullscreen"
import { DEFAULT_QUIZ_AVATAR } from "@/features/quiz/lib/quiz-avatars"
import { buildParticipantThemeStyle, type CustomTheme } from "@/features/quiz/lib/themes"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface SessionStatePayload {
  status: string
  currentQuestionIndex: number | null
  currentQuestion: {
    id: string
    position: number
    text: string
    questionType: string
    imageUrl: string | null
    timeLimitSeconds: number
    options: Array<{
      id: string
      text: string | null
      imageUrl: string | null
      position: number
    }>
  } | null
  questionStartedAt: string | null
}

interface ResultsRevealedPayload {
  questionId: string
  correctOptionIds: string[]
  distribution: Array<{ optionId: string; count: number; percentage: number }>
  totalResponses: number
}

interface LeaderboardEntry {
  rank: number
  participantId: string
  displayName: string
  avatar: string
  totalScore: number
  scoreDelta: number
}

interface LeaderboardUpdatedPayload {
  isFinal: boolean
  entries: LeaderboardEntry[]
}

/**
 * Participant quiz screen — Client Component.
 *
 * Handles all session states:
 *   lobby            → WaitingView
 *   countdown        → CountdownView
 *   question         → QuestionView (answer buttons, timer)
 *   results          → ResultFeedbackView (correct/incorrect, points earned, running total)
 *   leaderboard      → ParticipantLeaderboardView (own rank highlighted)
 *   final_leaderboard → ParticipantLeaderboardView (isFinal=true)
 *   ended            → EndView (thank-you, final rank and score)
 *
 * Requirements: 6.3, 9.2–9.8, 11.1–11.6, 12.1, 12.2, 12.4
 */
export default function PlayPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId
  const router = useRouter()

  const [participantToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem("quiz_participant_token")
  })
  const [participantId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem("quiz_participant_id")
  })
  const [displayName] = useState<string>(() => {
    if (typeof window === "undefined") return ""
    return sessionStorage.getItem("quiz_display_name") ?? ""
  })
  const [avatar, setAvatar] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_QUIZ_AVATAR
    return sessionStorage.getItem("quiz_avatar") ?? DEFAULT_QUIZ_AVATAR
  })
  const [avatarUpdating, setAvatarUpdating] = useState(false)
  const [sessionTitle, setSessionTitle] = useState<string>("")
  const [sessionStatus, setSessionStatus] = useState<string>("lobby")
  const [currentQuestion, setCurrentQuestion] = useState<SessionStatePayload["currentQuestion"]>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [questionStartedAt, setQuestionStartedAt] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [themeId, setThemeId] = useState<string | null>(null)
  const [customTheme, setCustomTheme] = useState<CustomTheme | null>(null)

  // Answer submission state
  const [lastScoreAwarded, setLastScoreAwarded] = useState<number>(0)
  const [lastIsCorrect, setLastIsCorrect] = useState<boolean | null>(null)
  const [runningTotal, setRunningTotal] = useState<number>(0)
  const [submittedForQuestion, setSubmittedForQuestion] = useState<string | null>(null)

  // Results / leaderboard data
  const [resultsData, setResultsData] = useState<ResultsRevealedPayload | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUpdatedPayload | null>(null)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])

  const channelRef = useRef<RealtimeChannel | null>(null)
  // Reconnection state
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "reconnecting" | "failed">("connected")
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load session data when participant token is available
  useEffect(() => {
    if (!participantToken) {
      router.replace("/quiz/join")
      return
    }

    fetch(`/api/quiz/v1/sessions/${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setLoadError(data?.error?.message ?? "Failed to load session.")
          return
        }
        const data = await res.json()
        setSessionTitle(data.session?.events?.title ?? "Quiz")
        setSessionStatus(data.session?.status ?? "lobby")
        setTotalQuestions(data.session?.events?.questions?.length ?? 0)
        setCurrentQuestionIndex(data.session?.current_question_index ?? null)
        setThemeId(data.session?.events?.theme_id ?? null)
        setCustomTheme((data.session?.events?.custom_theme as CustomTheme | null) ?? null)
      })
      .catch(() => setLoadError("Network error. Please refresh the page."))
  }, [sessionId, router, participantToken])

  // Apply the event's colour theme to this full-screen route by overriding the
  // theme CSS variables on the document root. Restores the previous values on
  // unmount so the theme stays scoped to the play screen.
  useEffect(() => {
    const style = buildParticipantThemeStyle({ themeId, customTheme })
    const root = document.documentElement
    const previous: Record<string, string> = {}
    for (const [key, value] of Object.entries(style)) {
      previous[key] = root.style.getPropertyValue(key)
      root.style.setProperty(key, String(value))
    }
    return () => {
      for (const key of Object.keys(style)) {
        if (previous[key]) root.style.setProperty(key, previous[key])
        else root.style.removeProperty(key)
      }
    }
  }, [themeId, customTheme])

  // Subscribe to Realtime channel
  useEffect(() => {
    if (!participantToken) return
    const supabase = createClient()
    const presenceKey = participantId ?? participantToken.slice(0, 8)

    const channel = supabase.channel(`session:${sessionId}`, {
      config: { presence: { key: presenceKey } },
    })
    channelRef.current = channel

    channel
      .on("broadcast", { event: "session_state_changed" }, ({ payload }: { payload: SessionStatePayload }) => {
        setSessionStatus(payload.status)
        if (payload.currentQuestionIndex !== undefined && payload.currentQuestionIndex !== null) {
          setCurrentQuestionIndex(payload.currentQuestionIndex)
        }
        if (payload.currentQuestion) {
          setCurrentQuestion(payload.currentQuestion)
          setQuestionStartedAt(payload.questionStartedAt)
          setSelectedOptionIds([])
          setSubmittedForQuestion(null)
          setResultsData(null)
          setLeaderboardData(null)
        }
      })
      .on("broadcast", { event: "results_revealed" }, ({ payload }) => {
        setResultsData(payload as ResultsRevealedPayload)
      })
      .on("broadcast", { event: "leaderboard_updated" }, ({ payload }) => {
        setLeaderboardData(payload as LeaderboardUpdatedPayload)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
          reconnectAttemptsRef.current = 0
          if (reconnectTimerRef.current) {
            clearInterval(reconnectTimerRef.current)
            reconnectTimerRef.current = null
          }
          await channel.track({
            participantId: participantId ?? presenceKey,
            displayName: displayName || "Participant",
            avatar: avatar || DEFAULT_QUIZ_AVATAR,
            joinedAt: new Date().toISOString(),
          })
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnectionStatus("reconnecting")
          // Retry every 2 seconds for up to 60 seconds (30 attempts)
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setInterval(async () => {
              reconnectAttemptsRef.current += 1
              if (reconnectAttemptsRef.current > 30) {
                setConnectionStatus("failed")
                if (reconnectTimerRef.current) {
                  clearInterval(reconnectTimerRef.current)
                  reconnectTimerRef.current = null
                }
                return
              }
              // Attempt to restore state from server
              try {
                const res = await fetch(`/api/quiz/v1/sessions/${sessionId}`)
                if (res.ok) {
                  const data = await res.json()
                  const s = data.session
                  if (s) {
                    setSessionStatus(s.status)
                    setTotalQuestions(s.events?.questions?.length ?? 0)
                    if (s.current_question_id && s.status === "question") {
                      const questions: Array<{
                        id: string; position: number; question_type: string; text: string;
                        image_url: string | null; time_limit: number;
                        answer_options: Array<{ id: string; position: number; text: string | null; image_url: string | null }>
                      }> = (s.events?.questions ?? [])
                      const q = questions.find((q) => q.id === s.current_question_id)
                      if (q) {
                        setCurrentQuestionIndex(s.current_question_index ?? null)
                        setCurrentQuestion({
                          id: q.id,
                          position: q.position,
                          text: q.text,
                          questionType: q.question_type,
                          imageUrl: q.image_url,
                          timeLimitSeconds: q.time_limit,
                          options: q.answer_options
                            .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                            .map((o: { id: string; text: string | null; image_url: string | null; position: number }) => ({
                              id: o.id, text: o.text, imageUrl: o.image_url, position: o.position,
                            })),
                        })
                        setQuestionStartedAt(s.question_started_at ?? null)
                      }
                    }
                  }
                }
              } catch {
                // Ignore — will retry
              }
            }, 2000)
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }
  }, [sessionId, participantToken, participantId, displayName, avatar])

  // Poll session status as a fallback for missed Realtime broadcasts.
  // Only ever advances state forward, never backward, so it can run safely
  // alongside the Realtime channel.
  useEffect(() => {
    if (!participantToken) return
    if (sessionStatus === "ended") return

    const order = ["lobby", "countdown", "question", "results", "leaderboard", "final_leaderboard", "ended"]

    const poll = async () => {
      try {
        const res = await fetch(`/api/quiz/v1/sessions/${sessionId}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const s = data.session
        if (!s) return

        const currentIdx = order.indexOf(sessionStatus)
        const newIdx = order.indexOf(s.status)
        if (newIdx <= currentIdx) return

        setSessionStatus(s.status)

        if (s.events?.questions?.length) {
          setTotalQuestions(s.events.questions.length)
        }

        if (s.current_question_id && s.status === "question") {
          const questions: Array<{
            id: string; position: number; question_type: string; text: string;
            image_url: string | null; time_limit: number;
            answer_options: Array<{ id: string; position: number; text: string | null; image_url: string | null }>
          }> = s.events?.questions ?? []
          const q = questions.find((q) => q.id === s.current_question_id)
          if (q) {
            setCurrentQuestionIndex(s.current_question_index ?? null)
            setCurrentQuestion({
              id: q.id,
              position: q.position,
              text: q.text,
              questionType: q.question_type,
              imageUrl: q.image_url,
              timeLimitSeconds: q.time_limit,
              options: q.answer_options
                .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                .map((o: { id: string; text: string | null; image_url: string | null; position: number }) => ({
                  id: o.id,
                  text: o.text,
                  imageUrl: o.image_url,
                  position: o.position,
                })),
            })
            setQuestionStartedAt(s.question_started_at ?? null)
            setSelectedOptionIds([])
            setSubmittedForQuestion(null)
          }
        }
      } catch {
        // Best-effort — Realtime is the primary channel
      }
    }

    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [sessionId, participantToken, sessionStatus])

  const quizActive = [
    "countdown",
    "question",
    "results",
    "leaderboard",
    "final_leaderboard",
  ].includes(sessionStatus)

  const fullscreen = useQuizFullscreen(quizActive)

  const removedCalledRef = useRef(false)
  useEffect(() => {
    if (!fullscreen.isRemoved || !participantToken || removedCalledRef.current) return
    removedCalledRef.current = true
    void fetch(`/api/quiz/v1/sessions/${sessionId}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${participantToken}` },
    })
    sessionStorage.removeItem("quiz_participant_token")
    sessionStorage.removeItem("quiz_session_id")
    sessionStorage.removeItem("quiz_participant_id")
  }, [fullscreen.isRemoved, participantToken, sessionId])

  const submitAnswer = useCallback(async (optionIds: string[], questionId: string) => {
    if (!participantToken || submittedForQuestion === questionId || fullscreen.isBlocking) return
    setSubmittedForQuestion(questionId)
    try {
      const res = await fetch(`/api/quiz/v1/sessions/${sessionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${participantToken}` },
        body: JSON.stringify({ questionId, selectedOptionIds: optionIds }),
      })
      if (res.ok) {
        const data = await res.json()
        setLastScoreAwarded(data.scoreAwarded ?? 0)
        setLastIsCorrect(data.isCorrect ?? null)
        setRunningTotal((prev) => prev + (data.scoreAwarded ?? 0))
      }
    } catch {
      // Silently fail — answer may still have been recorded
    }
  }, [participantToken, sessionId, submittedForQuestion, fullscreen.isBlocking])

  const handleAvatarSelect = useCallback(async (emoji: string) => {
    if (!participantToken || avatarUpdating || sessionStatus !== "lobby") return
    setAvatarUpdating(true)
    try {
      const res = await fetch(`/api/quiz/v1/sessions/${sessionId}/avatar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${participantToken}`,
        },
        body: JSON.stringify({ avatar: emoji }),
      })
      if (!res.ok) return
      const data = await res.json()
      setAvatar(data.avatar)
      sessionStorage.setItem("quiz_avatar", data.avatar)
      const presenceKey = participantId ?? participantToken.slice(0, 8)
      await channelRef.current?.track({
        participantId: presenceKey,
        displayName: displayName || "Participant",
        avatar: data.avatar,
        joinedAt: new Date().toISOString(),
      })
    } finally {
      setAvatarUpdating(false)
    }
  }, [participantToken, participantId, displayName, sessionId, sessionStatus, avatarUpdating])

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <div className="text-4xl" aria-hidden="true">⚠️</div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">{loadError}</p>
          <Link href="/quiz/join" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">Back to Join</Link>
        </div>
      </div>
    )
  }

  if (!participantToken) return null

  // Reconnection overlay — shown after first failure, non-blocking
  const reconnectionBanner = connectionStatus === "reconnecting" ? (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 text-center text-sm font-medium py-2 px-4" role="status" aria-live="polite">
      ⚡ Reconnecting… please wait
    </div>
  ) : connectionStatus === "failed" ? (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground text-center text-sm font-medium py-2 px-4" role="alert">
      Connection lost. <button onClick={() => window.location.reload()} className="underline font-bold">Tap to reload</button>
    </div>
  ) : null

  if (sessionStatus === "countdown") {
    return (
      <>
        <QuizFullscreenGuard active={quizActive} state={fullscreen} />
        <div className="min-h-screen flex items-center justify-center bg-background">
          {reconnectionBanner}
          <CountdownView />
        </div>
      </>
    )
  }

  if (sessionStatus === "question" && currentQuestion) {
    const questionNumber =
      currentQuestionIndex !== null && currentQuestionIndex >= 0
        ? currentQuestionIndex + 1
        : currentQuestion.position
    return (
      <>
        <QuizFullscreenGuard active={quizActive} state={fullscreen} />
        <QuestionView
        key={currentQuestion.id}
        question={currentQuestion}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        questionStartedAt={questionStartedAt}
        submittedForQuestion={submittedForQuestion}
        selectedOptionIds={selectedOptionIds}
        setSelectedOptionIds={setSelectedOptionIds}
        onSubmit={submitAnswer}
        interactionLocked={fullscreen.isBlocking}
      />
      </>
    )
  }

  if (sessionStatus === "results") {
    return (
      <>
        <QuizFullscreenGuard active={quizActive} state={fullscreen} />
        <ResultFeedbackView
        isCorrect={lastIsCorrect}
        scoreAwarded={lastScoreAwarded}
        runningTotal={runningTotal}
        resultsData={resultsData}
        currentQuestion={currentQuestion}
        submittedOptionIds={selectedOptionIds}
      />
      </>
    )
  }

  if (sessionStatus === "leaderboard") {
    if (!leaderboardData) {
      return (
        <>
          <QuizFullscreenGuard active={quizActive} state={fullscreen} />
          {reconnectionBanner}
          <LoadingScreen label="Loading leaderboard…" emoji="🏆" />
        </>
      )
    }
    return (
      <>
        <QuizFullscreenGuard active={quizActive} state={fullscreen} />
        <ParticipantLeaderboardView entries={leaderboardData.entries} participantId={participantId} isFinal={false} />
      </>
    )
  }

  if (sessionStatus === "final_leaderboard") {
    if (!leaderboardData) {
      return (
        <>
          <QuizFullscreenGuard active={quizActive} state={fullscreen} />
          {reconnectionBanner}
          <LoadingScreen label="Loading final results…" emoji="🏆" />
        </>
      )
    }
    return (
      <>
        <QuizFullscreenGuard active={quizActive} state={fullscreen} />
        <ParticipantLeaderboardView entries={leaderboardData.entries} participantId={participantId} isFinal={true} />
      </>
    )
  }

  if (sessionStatus === "ended") {
    const myEntry = leaderboardData?.entries.find((e) => e.participantId === participantId)
    return (
      <>
        <QuizFullscreenGuard active={quizActive} state={fullscreen} />
        <EndView displayName={displayName} avatar={avatar} rank={myEntry?.rank ?? null} totalScore={myEntry?.totalScore ?? runningTotal} />
      </>
    )
  }

  // Lobby / waiting state
  return (
    <>
      <QuizFullscreenGuard active={quizActive} state={fullscreen} />
      <LobbyWaitingView
        sessionTitle={sessionTitle}
        displayName={displayName}
        avatar={avatar}
        avatarUpdating={avatarUpdating}
        onAvatarSelect={handleAvatarSelect}
      />
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LobbyWaitingView({
  sessionTitle,
  displayName,
  avatar,
  avatarUpdating,
  onAvatarSelect,
}: {
  sessionTitle: string
  displayName: string
  avatar: string
  avatarUpdating: boolean
  onAvatarSelect: (emoji: string) => void
}) {
  const hasChosenAvatar = avatar !== DEFAULT_QUIZ_AVATAR

  return (
    <div className="min-h-screen bg-background px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{sessionTitle}</h1>
          {displayName && (
            <p className="text-muted-foreground text-sm">
              Joined as{" "}
              <span className="font-semibold text-foreground">{displayName}</span>
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-card px-4 py-4 space-y-3 sm:px-5" role="status" aria-live="polite">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" aria-hidden="true" />
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" aria-hidden="true" />
          </div>
          <p className="text-base font-medium text-center">Waiting for host to start…</p>
          <p className="text-sm text-muted-foreground text-center">
            Pick an avatar below while you wait. When the quiz begins you&apos;ll
            be asked to enter fullscreen mode.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Choose Your Avatar</p>
            {hasChosenAvatar && (
              <div className="shrink-0" aria-label={`Your avatar: ${avatar}`}>
                <QuizAvatar emoji={avatar} size="xl" />
              </div>
            )}
          </div>
          <QuizAvatarPicker
            selectedAvatar={hasChosenAvatar ? avatar : null}
            onSelect={onAvatarSelect}
            disabled={avatarUpdating}
          />
        </div>
      </div>
    </div>
  )
}

function CountdownView() {
  const [count, setCount] = useState(3)
  useEffect(() => {
    if (count <= 0) return
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count])
  return (
    <div className="text-center space-y-4" aria-live="assertive" aria-atomic="true">
      <p className="text-muted-foreground text-lg font-medium">Get ready!</p>
      <div className="text-9xl font-black text-primary animate-bounce" aria-label={count > 0 ? `Countdown: ${count}` : "Go!"}>
        {count > 0 ? count : "🎯"}
      </div>
    </div>
  )
}

function QuestionView({
  question, questionNumber, totalQuestions, questionStartedAt,
  submittedForQuestion, selectedOptionIds, setSelectedOptionIds, onSubmit, interactionLocked,
}: {
  question: NonNullable<SessionStatePayload["currentQuestion"]>
  questionNumber: number
  totalQuestions: number
  questionStartedAt: string | null
  submittedForQuestion: string | null
  selectedOptionIds: string[]
  setSelectedOptionIds: (ids: string[]) => void
  onSubmit: (optionIds: string[], questionId: string) => void
  interactionLocked?: boolean
}) {
  const [remaining, setRemaining] = useState(question.timeLimitSeconds)
  const [timedOut, setTimedOut] = useState(false)
  const submitted = submittedForQuestion === question.id

  useEffect(() => {
    if (!questionStartedAt) return
    const update = () => {
      const elapsed = (Date.now() - new Date(questionStartedAt).getTime()) / 1000
      const rem = Math.max(0, question.timeLimitSeconds - elapsed)
      setRemaining(rem)
      if (rem <= 0 && !timedOut) {
        setTimedOut(true)
        // Auto-submit multi-select if options selected
        if (question.questionType === "multi_select" && selectedOptionIds.length > 0 && !submitted) {
          onSubmit(selectedOptionIds, question.id)
        }
      }
    }
    update()
    const interval = setInterval(update, 200)
    return () => clearInterval(interval)
  }, [questionStartedAt, question, timedOut, selectedOptionIds, submitted, onSubmit])

  const pct = (remaining / question.timeLimitSeconds) * 100
  const sortedOptions = [...question.options].sort((a, b) => a.position - b.position)
  const isMultiSelect = question.questionType === "multi_select"

  const handleOptionClick = (optionId: string) => {
    if (interactionLocked || submitted || timedOut) return
    if (isMultiSelect) {
      setSelectedOptionIds(
        selectedOptionIds.includes(optionId)
          ? selectedOptionIds.filter((id) => id !== optionId)
          : [...selectedOptionIds, optionId]
      )
    } else {
      // Single-select: auto-submit immediately
      setSelectedOptionIds([optionId])
      onSubmit([optionId], question.id)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Timer bar — sticks below the floating navbar while scrolling */}
      <div className="sticky top-[4.25rem] sm:top-[4.75rem] z-30 h-2 shrink-0 bg-muted">
        <div className={`h-full transition-all duration-200 ${remaining < 5 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6 space-y-5">
        {totalQuestions > 0 && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
            Question {questionNumber} of {totalQuestions}
          </p>
        )}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{Math.ceil(remaining)}s</span>
          {timedOut && !submitted && <span className="text-destructive font-semibold" role="alert">Time&apos;s up!</span>}
        </div>
        {question.imageUrl && (
          <img src={question.imageUrl} alt="Question image" className="w-full rounded-xl object-cover max-h-48" />
        )}
        <div className="rounded-xl border bg-card px-5 py-4">
          <p className="text-lg font-semibold leading-snug">{question.text}</p>
        </div>
        {submitted ? (
          <div className="rounded-xl border bg-muted px-6 py-5 text-center" role="status">
            <p className="font-medium">Answer submitted!</p>
            <p className="text-sm text-muted-foreground mt-1">Waiting for results…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3" role="group" aria-label="Answer options">
              {sortedOptions.map((option) => {
                const isSelected = selectedOptionIds.includes(option.id)
                return (
                  <button key={option.id} onClick={() => handleOptionClick(option.id)}
                    disabled={interactionLocked || submitted || (timedOut && !isMultiSelect)}
                    className={`min-h-[44px] rounded-xl border px-4 py-3 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition disabled:cursor-not-allowed ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"}`}
                    aria-pressed={isSelected}>
                    {option.imageUrl && <img src={option.imageUrl} alt="" className="w-full rounded-lg mb-2 object-cover max-h-24" aria-hidden="true" />}
                    {option.text}
                  </button>
                )
              })}
            </div>
            {isMultiSelect && selectedOptionIds.length > 0 && !timedOut && (
              <button onClick={() => onSubmit(selectedOptionIds, question.id)}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition">
                Submit ({selectedOptionIds.length} selected)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ResultFeedbackView({
  isCorrect, scoreAwarded, runningTotal, resultsData, currentQuestion, submittedOptionIds,
}: {
  isCorrect: boolean | null
  scoreAwarded: number
  runningTotal: number
  resultsData: ResultsRevealedPayload | null
  currentQuestion: SessionStatePayload["currentQuestion"]
  submittedOptionIds: string[]
}) {
  const noAnswer = isCorrect === null && scoreAwarded === 0 && submittedOptionIds.length === 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 space-y-6">
      {/* Correct/incorrect indicator */}
      <div className={`text-7xl ${isCorrect === true ? "animate-bounce" : ""}`} aria-hidden="true">
        {noAnswer ? "⏱️" : isCorrect === true ? "✅" : isCorrect === false ? "❌" : "📊"}
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">
          {noAnswer ? "Time's up!" : isCorrect === true ? "Correct!" : isCorrect === false ? "Incorrect" : "Submitted!"}
        </h2>
        {scoreAwarded > 0 && (
          <p className="text-lg font-semibold text-green-600">+{scoreAwarded} points</p>
        )}
      </div>
      <div className="rounded-xl border bg-card px-6 py-4 text-center w-full max-w-xs">
        <p className="text-sm text-muted-foreground">Total Score</p>
        <p className="text-3xl font-black">{runningTotal.toLocaleString()}</p>
      </div>
      {/* Show correct answers if available */}
      {resultsData && currentQuestion && (
        <div className="w-full max-w-xs space-y-2">
          {[...currentQuestion.options].sort((a, b) => a.position - b.position).map((opt) => {
            const isCorrectOpt = resultsData.correctOptionIds.includes(opt.id)
            const wasSelected = submittedOptionIds.includes(opt.id)
            return (
              <div key={opt.id} className={`rounded-lg border px-3 py-2 text-sm flex items-center gap-2 ${isCorrectOpt ? "border-green-500 bg-green-50 text-green-800" : wasSelected ? "border-destructive bg-red-50 text-destructive" : "bg-card"}`}>
                {isCorrectOpt ? "✓" : wasSelected ? "✗" : "○"}
                <span>{opt.text}</span>
              </div>
            )
          })}
        </div>
      )}
      <p className="text-sm text-muted-foreground">Waiting for leaderboard…</p>
    </div>
  )
}

function ParticipantLeaderboardView({
  entries, participantId, isFinal,
}: {
  entries: LeaderboardEntry[]
  participantId: string | null
  isFinal: boolean
}) {
  const top10 = entries.slice(0, 10)
  const myEntry = entries.find((e) => e.participantId === participantId)
  const myRankInTop10 = top10.some((e) => e.participantId === participantId)

  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-8 space-y-6">
      <h2 className="text-2xl font-bold text-center">{isFinal ? "🏆 Final Leaderboard" : "Leaderboard"}</h2>
      <div className="space-y-2 max-w-sm mx-auto w-full">
        {top10.map((entry) => {
          const isMe = entry.participantId === participantId
          return (
            <div key={entry.participantId}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${isMe ? "border-primary bg-primary/10 ring-2 ring-primary" : "bg-card"}`}>
              <span className="text-lg font-black w-8 text-center text-muted-foreground">
                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
              </span>
              <QuizAvatar emoji={entry.avatar} size="xl" />
              <span className="flex-1 font-semibold truncate text-sm">{entry.displayName}{isMe ? " (you)" : ""}</span>
              <div className="text-right">
                <p className="font-bold text-sm">{entry.totalScore.toLocaleString()}</p>
                {entry.scoreDelta > 0 && <p className="text-xs text-green-600">+{entry.scoreDelta}</p>}
              </div>
            </div>
          )
        })}
        {/* Show own rank if not in top 10 */}
        {myEntry && !myRankInTop10 && (
          <>
            <div className="text-center text-muted-foreground text-sm py-1">…</div>
            <div className="flex items-center gap-3 rounded-xl border border-primary bg-primary/10 ring-2 ring-primary px-4 py-3">
              <span className="text-lg font-black w-8 text-center text-muted-foreground">#{myEntry.rank}</span>
              <QuizAvatar emoji={myEntry.avatar} size="xl" />
              <span className="flex-1 font-semibold truncate text-sm">{myEntry.displayName} (you)</span>
              <div className="text-right">
                <p className="font-bold text-sm">{myEntry.totalScore.toLocaleString()}</p>
                {myEntry.scoreDelta > 0 && <p className="text-xs text-green-600">+{myEntry.scoreDelta}</p>}
              </div>
            </div>
          </>
        )}
      </div>
      {!isFinal && <p className="text-sm text-muted-foreground text-center">Waiting for host…</p>}
    </div>
  )
}

function EndView({
  displayName, avatar, rank, totalScore,
}: {
  displayName: string
  avatar: string
  rank: number | null
  totalScore: number
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 space-y-8">
      <QuizAvatar emoji={avatar || "🦉"} size="hero" className="mx-auto" />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black">Thanks for playing!</h1>
        {displayName && <p className="text-muted-foreground">Well done, <span className="font-semibold text-foreground">{displayName}</span>!</p>}
      </div>
      <div className="rounded-xl border bg-card px-8 py-6 text-center space-y-4 w-full max-w-xs">
        {rank !== null && (
          <div>
            <p className="text-sm text-muted-foreground">Final Rank</p>
            <p className="text-4xl font-black">
              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
            </p>
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">Total Score</p>
          <p className="text-3xl font-bold">{totalScore.toLocaleString()}</p>
        </div>
      </div>
      <Link href="/quiz/join" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition">
        Play Again
      </Link>
    </div>
  )
}
