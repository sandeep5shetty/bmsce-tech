"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Download, ArrowLeft, Users, Clock, BarChart2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Spinner } from "@/components/ui/spinner"
import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog"

interface AnswerOption {
  id: string
  position: number
  text: string | null
  is_correct: boolean
}

interface Question {
  id: string
  position: number
  text: string
  question_type: string
  answer_options: AnswerOption[]
}

interface OptionCount {
  optionId: string
  count: number
  percentage: number
}

interface Snapshot {
  id: string
  question_id: string
  total_responses: number
  option_counts: OptionCount[]
  avg_response_time_ms: number | null
  questions: Question
}

interface AnalyticsData {
  sessionId: string
  participantCount: number
  snapshots: Snapshot[]
}

/**
 * Analytics summary page for a completed session.
 *
 * Shows per-question stats: response count, option distribution bar chart,
 * average response time, and a CSV download button.
 *
 * Requirements: 13.2, 13.3
 */
export default function AnalyticsPage() {
  const params = useParams<{ eventId: string; sessionId: string }>()
  const { eventId, sessionId } = params
  const router = useRouter()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/quiz/v1/analytics/${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body?.error?.message ?? "Failed to load analytics.")
          return
        }
        const body = await res.json()
        setData(body)
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleDownloadCsv = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/quiz/v1/analytics/${sessionId}/export`)
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `session-${sessionId}-results.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV downloaded")
    } catch {
      toast.error("Failed to download CSV. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/quiz/v1/analytics/${sessionId}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error?.message ?? "Failed to delete session.")
        return
      }
      toast.success("Session deleted")
      setDeleteConfirmOpen(false)
      router.push(`/quiz/events/${eventId}`)
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <LoadingScreen variant="section" label="Loading analytics…" emoji="📊" />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" onClick={() => router.push(`/quiz/events/${eventId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event
        </Button>
      </div>
    )
  }

  const snapshots = data?.snapshots ?? []
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => (a.questions?.position ?? 0) - (b.questions?.position ?? 0)
  )

  return (
    <>
      <ConfirmActionDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete session?"
        description="This will permanently delete the session and all of its analytics. This action cannot be undone."
        confirmLabel="Delete Session"
        onConfirm={handleDelete}
        loading={deleting}
        destructive
      />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/quiz/events/${eventId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Session Analytics</h1>
            <p className="text-sm text-muted-foreground">
              <Users className="inline h-3.5 w-3.5 mr-1" />
              {data?.participantCount ?? 0} participants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadCsv} disabled={downloading} variant="outline">
            {downloading ? (
              <>
                <Spinner size="sm" />
                Downloading…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
          <Button onClick={() => setDeleteConfirmOpen(true)} disabled={deleting} variant="destructive">
            {deleting ? (
              <>
                <Spinner size="sm" className="text-destructive-foreground" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Per-question cards */}
      {sortedSnapshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No analytics data available yet. Analytics are generated when a session ends.
          </CardContent>
        </Card>
      ) : (
        sortedSnapshots.map((snapshot) => {
          const question = snapshot.questions
          const options = question?.answer_options ?? []
          const sortedOptions = [...options].sort((a, b) => a.position - b.position)
          const optionCountMap = new Map(
            (snapshot.option_counts ?? []).map((oc) => [oc.optionId, oc])
          )

          return (
            <Card key={snapshot.question_id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Q{question?.position ?? "?"}
                    </p>
                    <CardTitle className="text-base leading-snug">
                      {question?.text ?? "Unknown question"}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {snapshot.total_responses}
                    </span>
                    {snapshot.avg_response_time_ms !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {(snapshot.avg_response_time_ms / 1000).toFixed(1)}s avg
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              {sortedOptions.length > 0 && (
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3">
                    <BarChart2 className="h-3.5 w-3.5" />
                    Response Distribution
                  </div>
                  {sortedOptions.map((option) => {
                    const oc = optionCountMap.get(option.id)
                    const count = oc?.count ?? 0
                    const pct = oc?.percentage ?? 0
                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`flex items-center gap-1.5 ${option.is_correct ? "font-semibold text-green-700" : "text-foreground"}`}>
                            {option.is_correct && <span className="text-green-600">✓</span>}
                            {option.text ?? `Option ${option.position}`}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${option.is_correct ? "bg-green-500" : "bg-primary/60"}`}
                            style={{ width: `${pct}%` }}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${option.text}: ${pct}%`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              )}
            </Card>
          )
        })
      )}
    </div>
    </>
  )
}
