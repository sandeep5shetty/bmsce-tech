"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/features/quiz/lib/supabase-client"
import { QRCodeDisplay } from "@/features/quiz/components/qr-code-display"
import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog"
import { QuizAdminToolbarPortal } from "@/features/quiz/components/quiz-admin-toolbar-portal"
import { QuizAvatar } from "@/features/quiz/components/quiz-avatar"
import { SessionControlBar } from "@/features/quiz/components/session-control-bar"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { CustomTheme } from "@/features/quiz/lib/themes"

interface Participant {
  participantId: string
  displayName: string
  avatar: string
  joinedAt: string
}

interface SessionData {
  id: string
  status: string
  event_id: string
  current_question_id: string | null
  current_question_index: number | null
  question_started_at: string | null
  events: {
    id: string
    title: string
    join_code: string | null
    theme_id: string | null
    custom_theme: CustomTheme | null
    auto_play_mode: boolean
    enforce_focus_mode: boolean
    questions: Array<{
      id: string
      position: number
      question_type: string
      text: string
      image_url: string | null
      time_limit: number
      answer_options: Array<{
        id: string
        position: number
        text: string | null
        image_url: string | null
        is_correct: boolean
      }>
    }>
  } | null
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

interface AnswerCountPayload {
  questionId: string
  answeredCount: number
  totalParticipants: number
}

/**
 * Presenter screen — Client Component.
 *
 * Handles all session states:
 *   lobby            → LobbyView (QR code, participant grid, Start button)
 *   countdown        → CountdownView (3-2-1 animation)
 *   question         → QuestionView (question text, options, timer, answer count)
 *   results          → ResultsView (correct answers, response distribution bar chart)
 *   leaderboard      → LeaderboardView (top 10 ranked, score deltas)
 *   final_leaderboard → FinalLeaderboardView (podium top 3, full list, confetti)
 *   ended            → (redirect or end message)
 *
 * Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 9.1, 9.2, 11.1–11.6, 12.1, 12.2, 12.4
 */
export default function PresentPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId
  const router = useRouter()

  const [session, setSession] = useState<SessionData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map())
  const [startError, setStartError] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<string>("lobby")
  const [currentQuestion, setCurrentQuestion] = useState<SessionData["events"] extends null ? null : NonNullable<SessionData["events"]>["questions"][0] | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null)
  const [questionStartedAt, setQuestionStartedAt] = useState<string | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [resultsData, setResultsData] = useState<ResultsRevealedPayload | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUpdatedPayload | null>(null)
  const [wordCloudData, setWordCloudData] = useState<Array<{ word: string; count: number }>>([])
  const [advancing, setAdvancing] = useState(false)
  const [endingSession, setEndingSession] = useState(false)
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)

  // Guards so auto-advance fires at most once per state transition
  const autoAdvancedQuestionIdRef = useRef<string | null>(null)
  const autoAdvancedResultsIdRef = useRef<string | null>(null)
  const autoAdvancedLeaderboardIdRef = useRef<string | null>(null)
  const sessionRef = useRef<SessionData | null>(null)
  sessionRef.current = session

  const autoPlayMode = session?.events?.auto_play_mode ?? false
  const AUTO_PLAY_DWELL_MS = 2500
  const RESULTS_DWELL_MS = autoPlayMode ? AUTO_PLAY_DWELL_MS : 6000

  // Load session data
  useEffect(() => {
    fetch(`/api/quiz/v1/sessions/${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setLoadError(data?.error?.message ?? "Failed to load session.")
          return
        }
        const data = await res.json()
        const s = data.session as SessionData
        setSession(s)
        setSessionStatus(s.status)
        setCurrentQuestionIndex(s.current_question_index ?? null)
        // Restore current question if session is already in question state
        if (s.current_question_id && s.events?.questions) {
          const q = s.events.questions.find((q) => q.id === s.current_question_id) ?? null
          setCurrentQuestion(q)
          setQuestionStartedAt(s.question_started_at)
        }
      })
      .catch(() => setLoadError("Network error. Please refresh the page."))
  }, [sessionId])

  // Subscribe to Realtime Presence + Broadcast
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel(`session:${sessionId}`, {
      config: { presence: { key: "presenter" } },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const newMap = new Map<string, Participant>()
        for (const presences of Object.values(state)) {
          for (const p of presences as unknown as Participant[]) {
            if (p.participantId) newMap.set(p.participantId, p)
          }
        }
        setParticipants(newMap)
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setParticipants((prev) => {
          const next = new Map(prev)
          for (const p of newPresences as unknown as Participant[]) {
            if (p.participantId) next.set(p.participantId, p)
          }
          return next
        })
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setParticipants((prev) => {
          const next = new Map(prev)
          for (const p of leftPresences as unknown as Participant[]) {
            if (p.participantId) next.delete(p.participantId)
          }
          return next
        })
      })
      .on("broadcast", { event: "session_state_changed" }, ({ payload }) => {
        const status = payload?.status as string
        setSessionStatus(status)
        if (
          payload?.currentQuestionIndex !== undefined &&
          payload.currentQuestionIndex !== null
        ) {
          setCurrentQuestionIndex(payload.currentQuestionIndex)
        }
        if (payload?.currentQuestion) {
          const bq = payload.currentQuestion as {
            id: string
            position?: number
            text: string
            questionType: string
            imageUrl: string | null
            timeLimitSeconds: number
            options: Array<{ id: string; text: string | null; imageUrl: string | null; position: number }>
          }
          const fromSession = sessionRef.current?.events?.questions.find(
            (q) => q.id === bq.id,
          )
          if (fromSession) {
            setCurrentQuestion(fromSession)
          } else {
            const index =
              typeof payload.currentQuestionIndex === "number"
                ? payload.currentQuestionIndex
                : null
            setCurrentQuestion({
              id: bq.id,
              text: bq.text,
              question_type: bq.questionType,
              image_url: bq.imageUrl,
              time_limit: bq.timeLimitSeconds,
              position: bq.position ?? (index !== null ? index + 1 : 1),
              answer_options: bq.options.map((o) => ({
                ...o,
                image_url: o.imageUrl,
                is_correct: false,
              })),
            })
          }
          setQuestionStartedAt(payload.questionStartedAt ?? null)
          setAnsweredCount(0)
          setWordCloudData([])
          setResultsData(null)
          setLeaderboardData(null)
          // Sync totalParticipants from current presence count so the
          // "X / Y answered" display is correct from the first answer
          setParticipants((prev) => {
            setTotalParticipants(prev.size)
            return prev
          })
        }
      })
      .on("broadcast", { event: "results_revealed" }, ({ payload }) => {
        setResultsData(payload as ResultsRevealedPayload)
      })
      .on("broadcast", { event: "leaderboard_updated" }, ({ payload }) => {
        setLeaderboardData(payload as LeaderboardUpdatedPayload)
      })
      .on("broadcast", { event: "answer_count_updated" }, ({ payload }) => {
        const p = payload as AnswerCountPayload
        setAnsweredCount(p.answeredCount)
        setTotalParticipants(p.totalParticipants)
      })
      .on("broadcast", { event: "word_cloud_updated" }, ({ payload }) => {
        const p = payload as { questionId: string; words: Array<{ word: string; count: number }> }
        setWordCloudData(p.words)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  const handleAdvance = useCallback(async () => {
    setStartError(null)
    setAdvancing(true)
    try {
      const res = await fetch(`/api/quiz/v1/sessions/${sessionId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data?.error?.message ?? "Failed to advance."
        setStartError(msg)
        toast.error(msg)
      } else {
        // Apply state locally in case the Realtime broadcast is delayed or missed
        const data = await res.json().catch(() => ({}))
        const updatedSession = data?.session
        if (updatedSession?.status) {
          setSessionStatus(updatedSession.status)
          if (updatedSession.current_question_index !== undefined) {
            setCurrentQuestionIndex(updatedSession.current_question_index ?? null)
          }
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  current_question_index:
                    updatedSession.current_question_index ??
                    prev.current_question_index,
                  current_question_id:
                    updatedSession.current_question_id ?? prev.current_question_id,
                  question_started_at:
                    updatedSession.question_started_at ?? prev.question_started_at,
                }
              : prev,
          )
          // Only reset per-question state when entering a NEW question.
          // current_question_id remains set during results / leaderboard
          // (it points at the question we're showing results for), so we
          // must gate on the status itself.
          if (
            updatedSession.status === "question" &&
            updatedSession.current_question_id &&
            session?.events?.questions
          ) {
            const q = session.events.questions.find((q) => q.id === updatedSession.current_question_id) ?? null
            if (q) {
              setCurrentQuestion(q)
              setQuestionStartedAt(updatedSession.question_started_at ?? null)
              setAnsweredCount(0)
              setResultsData(null)
              setLeaderboardData(null)
              setParticipants((prev) => {
                setTotalParticipants(prev.size)
                return prev
              })
            }
          }
        }
      }
    } catch {
      const msg = "Network error. Please try again."
      setStartError(msg)
      toast.error(msg)
    } finally {
      setAdvancing(false)
    }
  }, [sessionId, session])

  // Polling fallback for the live answer count. Realtime broadcasts are the
  // primary channel, but if a message is dropped we still want the
  // "X / Y answered" counter to reflect reality. Polls every 2s while in
  // the question state.
  useEffect(() => {
    if (sessionStatus !== "question") return
    if (!currentQuestion) return

    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(`/api/quiz/v1/sessions/${sessionId}/live`, {
          cache: "no-store",
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (data.currentQuestionId !== currentQuestion.id) return
        setAnsweredCount((prev) =>
          typeof data.answeredCount === "number" && data.answeredCount > prev
            ? data.answeredCount
            : prev
        )
        setTotalParticipants((prev) =>
          typeof data.totalParticipants === "number" && data.totalParticipants > prev
            ? data.totalParticipants
            : prev
        )
      } catch {
        // Best-effort — Realtime is primary
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [sessionId, sessionStatus, currentQuestion])

  // Auto-advance question → results when the timer reaches zero.
  // Guard ensures we only fire once per question, even if the broadcast and
  // local fallback both update state.
  useEffect(() => {
    if (sessionStatus !== "question") return
    if (!currentQuestion || !questionStartedAt) return
    if (autoAdvancedQuestionIdRef.current === currentQuestion.id) return

    const startMs = new Date(questionStartedAt).getTime()
    const expiresAt = startMs + currentQuestion.time_limit * 1000
    const remainingMs = expiresAt - Date.now()

    const fire = () => {
      if (autoAdvancedQuestionIdRef.current === currentQuestion.id) return
      autoAdvancedQuestionIdRef.current = currentQuestion.id
      handleAdvance()
    }

    if (remainingMs <= 0) {
      fire()
      return
    }

    const t = setTimeout(fire, remainingMs)
    return () => clearTimeout(t)
  }, [sessionStatus, currentQuestion, questionStartedAt, handleAdvance])

  // Auto-play: advance question → results when every participant has answered.
  useEffect(() => {
    if (!autoPlayMode) return
    if (sessionStatus !== "question") return
    if (!currentQuestion) return
    if (totalParticipants <= 0) return
    if (answeredCount < totalParticipants) return
    if (autoAdvancedQuestionIdRef.current === currentQuestion.id) return

    autoAdvancedQuestionIdRef.current = currentQuestion.id
    handleAdvance()
  }, [
    autoPlayMode,
    sessionStatus,
    currentQuestion,
    totalParticipants,
    answeredCount,
    handleAdvance,
  ])

  // Auto-advance results → leaderboard after a brief dwell so participants
  // and the presenter can read the correct answer and per-option breakdown.
  useEffect(() => {
    if (sessionStatus !== "results") return
    if (!resultsData) return
    if (autoAdvancedResultsIdRef.current === resultsData.questionId) return

    const t = setTimeout(() => {
      if (autoAdvancedResultsIdRef.current === resultsData.questionId) return
      autoAdvancedResultsIdRef.current = resultsData.questionId
      handleAdvance()
    }, RESULTS_DWELL_MS)

    return () => clearTimeout(t)
  }, [sessionStatus, resultsData, handleAdvance, RESULTS_DWELL_MS])

  // Auto-play: advance leaderboard → next question after a short dwell.
  useEffect(() => {
    if (!autoPlayMode) return
    if (sessionStatus !== "leaderboard") return
    if (!leaderboardData) return

    const questionId =
      resultsData?.questionId ??
      currentQuestion?.id ??
      session?.current_question_id ??
      null
    if (!questionId) return
    if (autoAdvancedLeaderboardIdRef.current === questionId) return

    const t = setTimeout(() => {
      if (autoAdvancedLeaderboardIdRef.current === questionId) return
      autoAdvancedLeaderboardIdRef.current = questionId
      handleAdvance()
    }, AUTO_PLAY_DWELL_MS)

    return () => clearTimeout(t)
  }, [
    autoPlayMode,
    sessionStatus,
    leaderboardData,
    resultsData,
    currentQuestion,
    session,
    handleAdvance,
    AUTO_PLAY_DWELL_MS,
  ])

  const handleStartQuiz = useCallback(async () => {
    setStartError(null)
    setAdvancing(true)
    try {
      const res = await fetch(`/api/quiz/v1/sessions/${sessionId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data?.error?.message ?? "Failed to start quiz."
        setStartError(msg)
        toast.error(msg)
      } else {
        toast.success("Quiz started")
        // Apply state locally in case the Realtime broadcast is delayed or missed
        const data = await res.json().catch(() => ({}))
        const updatedSession = data?.session
        if (updatedSession?.status) {
          setSessionStatus(updatedSession.status)
        }
      }
    } catch {
      const msg = "Network error. Please try again."
      setStartError(msg)
      toast.error(msg)
    } finally {
      setAdvancing(false)
    }
  }, [sessionId])

  const performEndSession = useCallback(async () => {
    setEndingSession(true)
    try {
      const res = await fetch(`/api/quiz/v1/sessions/${sessionId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data?.error?.message ?? "Failed to end session."
        setStartError(msg)
        toast.error(msg)
        return
      }
      toast.success("Session ended")
      setEndConfirmOpen(false)
      router.push("/quiz")
    } catch {
      const msg = "Failed to end session."
      setStartError(msg)
      toast.error(msg)
    } finally {
      setEndingSession(false)
    }
  }, [sessionId, router])

  const participantList = Array.from(participants.values())
  const participantCount = participantList.length
  const joinCode = session?.events?.join_code ?? null
  const joinUrl = joinCode
    ? `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/quiz/join/${joinCode}`
    : ""

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <div className="text-4xl" aria-hidden="true">⚠️</div>
          <h1 className="text-xl font-bold">Failed to Load Session</h1>
          <p className="text-muted-foreground text-sm">{loadError}</p>
          <Button onClick={() => router.push("/quiz")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoadingScreen label="Loading session…" />
  }

  // ── Countdown ──────────────────────────────────────────────────────────────
  if (sessionStatus === "countdown") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CountdownView onComplete={handleAdvance} />
      </div>
    )
  }

  const totalQuestionsCount = session?.events?.questions?.length ?? 0
  const currentIdx =
    currentQuestionIndex ??
    session?.current_question_index ??
    (currentQuestion
      ? (session?.events?.questions.findIndex((q) => q.id === currentQuestion.id) ??
        -1)
      : -1)
  const questionNumber =
    currentIdx >= 0 ? currentIdx + 1 : (currentQuestion?.position ?? 1)
  const isLastQuestion = currentIdx >= 0 && currentIdx >= totalQuestionsCount - 1

  const showSessionControls = [
    "lobby",
    "question",
    "results",
    "leaderboard",
    "final_leaderboard",
  ].includes(sessionStatus)

  const showNextControl = ["question", "results", "leaderboard"].includes(sessionStatus)

  const nextControlLabel =
    sessionStatus === "question"
      ? "Reveal Results"
      : sessionStatus === "results"
        ? "Show Leaderboard"
        : isLastQuestion
          ? "Show Final Results"
          : "Next Question"

  const sessionControlBar = showSessionControls ? (
    <QuizAdminToolbarPortal>
      <SessionControlBar
        onNext={showNextControl ? handleAdvance : undefined}
        onEnd={() => setEndConfirmOpen(true)}
        advancing={advancing}
        ending={endingSession}
        error={startError}
        showNext={showNextControl}
        showEnd
        nextLabel={nextControlLabel}
        compact
      />
    </QuizAdminToolbarPortal>
  ) : null

  const endSessionDialog = (
    <ConfirmActionDialog
      open={endConfirmOpen}
      onOpenChange={setEndConfirmOpen}
      title="End session?"
      description="This will stop the live quiz for all participants. You can review analytics afterward, but the session cannot be resumed."
      confirmLabel="End Session"
      onConfirm={performEndSession}
      loading={endingSession}
      destructive
    />
  )

  // ── Question ───────────────────────────────────────────────────────────────
  if (sessionStatus === "question" && currentQuestion) {
    const isOpenText = currentQuestion.question_type === "open_text"
    return (
      <>
        {endSessionDialog}
        {sessionControlBar}
        <div className="flex min-h-full flex-col bg-background">
          <PresenterQuestionView
            question={currentQuestion}
            questionStartedAt={questionStartedAt}
            answeredCount={answeredCount}
            totalParticipants={totalParticipants}
            questionNumber={questionNumber}
            totalQuestions={totalQuestionsCount}
          />
          {isOpenText && (
            <div className="max-w-3xl mx-auto w-full px-6 pb-4">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Live Word Cloud</p>
                <WordCloudView words={wordCloudData} />
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (sessionStatus === "results") {
    if (!resultsData) {
      return (
        <>
          {endSessionDialog}
          {sessionControlBar}
          <div className="flex min-h-full flex-col bg-background">
            <LoadingScreen variant="section" label="Loading results…" emoji="📊" />
          </div>
        </>
      )
    }
    const questions = session.events?.questions ?? []
    const q = questions.find((q) => q.id === resultsData.questionId)
    return (
      <>
        {endSessionDialog}
        {sessionControlBar}
        <div className="flex min-h-full flex-col bg-background">
          <ResultsView resultsData={resultsData} question={q ?? null} />
        </div>
      </>
    )
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  if (sessionStatus === "leaderboard") {
    if (!leaderboardData) {
      return <LoadingScreen label="Loading leaderboard…" emoji="🏆" />
    }
    return (
      <>
        {endSessionDialog}
        {sessionControlBar}
        <div className="flex min-h-full flex-col bg-background">
          <LeaderboardView entries={leaderboardData.entries.slice(0, 10)} isFinal={false} />
        </div>
      </>
    )
  }

  if (sessionStatus === "final_leaderboard") {
    if (!leaderboardData) {
      return <LoadingScreen label="Loading final results…" emoji="🏆" />
    }
    return (
      <>
        {endSessionDialog}
        {sessionControlBar}
        <div className="flex min-h-full flex-col bg-background">
          <FinalLeaderboardView entries={leaderboardData.entries} />
        </div>
      </>
    )
  }

  if (sessionStatus === "ended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <div className="text-5xl" aria-hidden="true">🎉</div>
          <h1 className="text-2xl font-bold">Session Ended</h1>
          <p className="text-muted-foreground">Thanks for playing!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="site-theme">
              <a href={`/quiz/events/${session.event_id}/analytics/${sessionId}`}>
                View Analytics
              </a>
            </Button>
            <Button variant="outline" onClick={() => router.push("/quiz")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {endSessionDialog}
      {sessionControlBar}
      <div className="flex min-h-full flex-col bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{session.events?.title ?? "Session"}</h1>
            <p className="text-muted-foreground text-sm mt-1">Lobby — waiting for participants</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800" aria-live="polite">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border bg-card p-6 text-center space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Join Code</p>
              <p className="text-5xl font-mono font-bold tracking-widest text-primary" aria-label={`Join code: ${joinCode}`}>{joinCode ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Go to <span className="font-semibold">{typeof window !== "undefined" ? window.location.host : new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").host}/join</span></p>
            </div>
            {joinUrl && (
              <div className="rounded-xl border bg-card p-6 flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Scan to Join</p>
                <QRCodeDisplay url={joinUrl} size={180} alt={`QR code to join session with code ${joinCode}`} />
                <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition truncate max-w-full">{joinUrl}</a>
              </div>
            )}
            <div className="space-y-2">
              {startError && <p role="alert" className="text-sm text-destructive text-center">{startError}</p>}
              <Button
                onClick={handleStartQuiz}
                disabled={participantCount === 0 || advancing}
                className="site-theme h-auto w-full rounded-xl px-6 py-4 text-base font-bold"
                aria-disabled={participantCount === 0 || advancing}
              >
                {advancing ? (
                  <>
                    <Spinner size="sm" className="text-primary-foreground" />
                    Starting…
                  </>
                ) : (
                  "Start Quiz"
                )}
              </Button>
              {participantCount === 0 && <p className="text-xs text-muted-foreground text-center" role="status">Waiting for at least 1 participant to join</p>}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-6 min-h-[300px]">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Participants ({participantCount})</h2>
              {participantCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                  <div className="text-4xl" aria-hidden="true">👋</div>
                  <p className="text-muted-foreground text-sm">No participants yet. Share the join code!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2" role="list" aria-label="Joined participants" aria-live="polite" aria-atomic="false">
                  {participantList.map((p) => (
                    <div key={p.participantId} role="listitem" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
                      <QuizAvatar emoji={p.avatar} size="sm" />
                      <span>{p.displayName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CountdownView({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3)
  useEffect(() => {
    if (count <= 0) { onComplete(); return }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onComplete])
  return (
    <div className="text-center space-y-4" aria-live="assertive" aria-atomic="true">
      <p className="text-muted-foreground text-lg font-medium">Get ready!</p>
      <div className="text-9xl font-black text-primary animate-bounce" aria-label={`Countdown: ${count}`}>
        {count > 0 ? count : "🎯"}
      </div>
    </div>
  )
}

function PresenterQuestionView({
  question, questionStartedAt, answeredCount, totalParticipants, questionNumber, totalQuestions,
}: {
  question: NonNullable<SessionData["events"]>["questions"][0]
  questionStartedAt: string | null
  answeredCount: number
  totalParticipants: number
  questionNumber: number
  totalQuestions: number
}) {
  const [remaining, setRemaining] = useState(question.time_limit)

  useEffect(() => {
    if (!questionStartedAt) return
    const update = () => {
      const elapsed = (Date.now() - new Date(questionStartedAt).getTime()) / 1000
      setRemaining(Math.max(0, question.time_limit - elapsed))
    }
    update()
    const interval = setInterval(update, 200)
    return () => clearInterval(interval)
  }, [questionStartedAt, question.time_limit])

  const pct = (remaining / question.time_limit) * 100
  const sortedOptions = [...question.answer_options].sort((a, b) => a.position - b.position)
  const safeTotal = Math.max(totalParticipants, answeredCount)
  const answeredPct = safeTotal > 0 ? Math.round((answeredCount / safeTotal) * 100) : 0

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
      {totalQuestions > 0 && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
          Question {questionNumber} of {totalQuestions}
        </p>
      )}
      {question.image_url && (
        <img src={question.image_url} alt="Question image" className="w-full rounded-xl object-cover max-h-48" />
      )}
      <div className="rounded-xl border bg-card px-6 py-5">
        <p className="text-xl font-bold leading-snug">{question.text}</p>
      </div>
      {/* Timer bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span className={remaining < 5 ? "text-destructive font-semibold" : ""}>
            {Math.ceil(remaining)}s remaining
          </span>
          <span aria-live="polite" aria-atomic="true">
            <span className="font-semibold text-foreground">{answeredCount}</span>
            {" / "}
            {safeTotal} answered
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-200 ${remaining < 5 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
        {/* Answered-count progress bar — fills as participants submit */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${answeredPct}%` }}
          />
        </div>
      </div>
      {/* Options display-only */}
      <div className="grid grid-cols-2 gap-3">
        {sortedOptions.map((opt) => (
          <div key={opt.id} className="rounded-xl border bg-card px-4 py-3 text-sm font-medium">
            {opt.image_url && <img src={opt.image_url} alt="" className="w-full rounded-lg mb-2 object-cover max-h-24" aria-hidden="true" />}
            {opt.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultsView({
  resultsData, question,
}: {
  resultsData: ResultsRevealedPayload
  question: NonNullable<SessionData["events"]>["questions"][0] | null
}) {
  const sortedOptions = question
    ? [...question.answer_options].sort((a, b) => a.position - b.position)
    : []

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
      <h2 className="text-2xl font-bold">Results</h2>
      {question && (
        <div className="rounded-xl border bg-card px-6 py-4">
          <p className="text-lg font-semibold">{question.text}</p>
        </div>
      )}
      <div className="space-y-3">
        {sortedOptions.map((opt) => {
          const dist = resultsData.distribution.find((d) => d.optionId === opt.id)
          const isCorrect = resultsData.correctOptionIds.includes(opt.id)
          const pct = dist?.percentage ?? 0
          const count = dist?.count ?? 0
          return (
            <div
              key={opt.id}
              className={`rounded-xl border px-4 py-3 space-y-2 ${
                isCorrect
                  ? "border-green-600 bg-green-100 ring-2 ring-green-600/30 dark:border-green-500 dark:bg-green-950/50 dark:ring-green-400/40"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-sm font-medium">
                <span className="flex min-w-0 items-center gap-2">
                  {isCorrect ? (
                    <span
                      className="shrink-0 rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white dark:bg-green-500"
                      aria-label="Correct answer"
                    >
                      ✓ Correct
                    </span>
                  ) : null}
                  <span
                    className={
                      isCorrect
                        ? "font-semibold text-green-950 dark:text-green-50"
                        : "text-foreground"
                    }
                  >
                    {opt.text}
                  </span>
                </span>
                <span
                  className={
                    isCorrect
                      ? "shrink-0 font-medium text-green-800 dark:text-green-300"
                      : "text-muted-foreground shrink-0"
                  }
                >
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCorrect ? "bg-green-600 dark:bg-green-500" : "bg-primary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground text-center">{resultsData.totalResponses} total response{resultsData.totalResponses !== 1 ? "s" : ""}</p>
    </div>
  )
}

function LeaderboardView({ entries, isFinal }: { entries: LeaderboardEntry[]; isFinal: boolean }) {
  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 space-y-6">
      <h2 className="text-2xl font-bold">{isFinal ? "Final Leaderboard" : "Leaderboard"}</h2>
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={entry.participantId}
            className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 transition-all duration-500"
            style={{ animationDelay: `${i * 50}ms` }}>
            <span className="text-2xl font-black text-muted-foreground w-8 text-center">
              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
            </span>
            <QuizAvatar emoji={entry.avatar} size="2xl" />
            <span className="flex-1 font-semibold truncate">{entry.displayName}</span>
            <div className="text-right">
              <p className="font-bold">{entry.totalScore.toLocaleString()}</p>
              {entry.scoreDelta > 0 && (
                <p className="text-xs text-green-600 font-medium">+{entry.scoreDelta}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinalLeaderboardView({ entries }: { entries: LeaderboardEntry[] }) {
  const confettiFiredRef = useRef(false)

  useEffect(() => {
    if (confettiFiredRef.current) return
    confettiFiredRef.current = true
    // Dynamically import canvas-confetti to avoid SSR issues
    import("canvas-confetti").then((mod) => {
      const confetti = mod.default
      const end = Date.now() + 5000 // 5 seconds max
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } })
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    })
  }, [])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 space-y-8">
      <h2 className="text-3xl font-black text-center">🏆 Final Results</h2>

      {/* Podium for top 3 */}
      <div className="flex items-end justify-center gap-4">
        {/* 2nd place */}
        {top3[1] && (
          <div className="flex flex-col items-center gap-2 flex-1">
            <QuizAvatar emoji={top3[1].avatar} size="3xl" />
            <p className="font-bold text-sm text-center truncate w-full">{top3[1].displayName}</p>
            <p className="text-sm text-muted-foreground">{top3[1].totalScore.toLocaleString()}</p>
            <div className="w-full h-20 rounded-t-xl bg-slate-300 flex items-center justify-center text-3xl font-black">🥈</div>
          </div>
        )}
        {/* 1st place */}
        {top3[0] && (
          <div className="flex flex-col items-center gap-2 flex-1">
            <QuizAvatar emoji={top3[0].avatar} size="hero" />
            <p className="font-bold text-sm text-center truncate w-full">{top3[0].displayName}</p>
            <p className="text-sm text-muted-foreground">{top3[0].totalScore.toLocaleString()}</p>
            <div className="w-full h-28 rounded-t-xl bg-yellow-300 flex items-center justify-center text-3xl font-black">🥇</div>
          </div>
        )}
        {/* 3rd place */}
        {top3[2] && (
          <div className="flex flex-col items-center gap-2 flex-1">
            <QuizAvatar emoji={top3[2].avatar} size="3xl" />
            <p className="font-bold text-sm text-center truncate w-full">{top3[2].displayName}</p>
            <p className="text-sm text-muted-foreground">{top3[2].totalScore.toLocaleString()}</p>
            <div className="w-full h-14 rounded-t-xl bg-amber-600 flex items-center justify-center text-3xl font-black">🥉</div>
          </div>
        )}
      </div>

      {/* Full ranked list */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry) => (
            <div key={entry.participantId} className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3">
              <span className="text-sm font-bold text-muted-foreground w-8 text-center">#{entry.rank}</span>
              <QuizAvatar emoji={entry.avatar} size="xl" />
              <span className="flex-1 font-medium truncate">{entry.displayName}</span>
              <span className="font-bold">{entry.totalScore.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * WordCloudView — renders word frequencies as a proportional word cloud.
 * Font-size scales linearly from 14px (min) to 48px (max) based on count.
 * Requirements: 14.2, 14.3
 */
function WordCloudView({ words }: { words: Array<{ word: string; count: number }> }) {
  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Waiting for responses…
      </div>
    )
  }
  const maxCount = Math.max(...words.map((w) => w.count))
  const minSize = 14
  const maxSize = 48
  return (
    <div className="flex flex-wrap gap-3 items-center justify-center p-6" aria-label="Word cloud" role="img">
      {words.map(({ word, count }) => {
        const size = maxCount > 1
          ? minSize + Math.round(((count - 1) / (maxCount - 1)) * (maxSize - minSize))
          : maxSize
        const opacity = 0.5 + 0.5 * (count / maxCount)
        return (
          <span
            key={word}
            style={{ fontSize: `${size}px`, opacity, lineHeight: 1.2 }}
            className="font-bold text-primary transition-all duration-300"
            title={`${word}: ${count}`}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
