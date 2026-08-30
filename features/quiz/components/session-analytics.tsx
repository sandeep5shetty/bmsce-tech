"use client";

import { useMemo } from "react";

import {
  BarChart2,
  CheckCircle2,
  Clock,
  HelpCircle,
  ListChecks,
  MessageSquareText,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { QuizAvatar } from "./quiz-avatar";

// ── API payload shapes (snake_case, as returned by /api/quiz/v1/analytics) ──

export interface AnalyticsParticipant {
  id: string;
  display_name: string;
  avatar: string;
  total_score: number;
  rank: number | null;
  answered_count: number;
  correct_count: number;
}

export interface AnalyticsAnswer {
  participant_id: string;
  question_id: string;
  selected_option_ids: string[] | null;
  open_text_response: string | null;
  rating_value: number | null;
  is_correct: boolean | null;
  score_awarded: number;
  response_time_ms: number | null;
}

export interface AnalyticsAnswerOption {
  id: string;
  position: number;
  text: string | null;
  is_correct: boolean;
}

export interface AnalyticsQuestion {
  id: string;
  position: number;
  text: string;
  question_type: string;
  answer_options: AnalyticsAnswerOption[];
}

export interface AnalyticsOptionCount {
  optionId: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSnapshot {
  id: string;
  question_id: string;
  total_responses: number;
  option_counts: AnalyticsOptionCount[];
  avg_response_time_ms: number | null;
  questions?: AnalyticsQuestion;
}

// Question types where isCorrect is meaningful; open text and ratings are
// collected, not scored, so they stay out of the accuracy charts.
const SCORABLE_TYPES = new Set(["single_select", "multi_select", "image_choice"]);

// Status trio validated with the dataviz palette checker in both modes —
// direct labels + the leaderboard table provide the required contrast relief.
const outcomeChartConfig = {
  correct: {
    label: "Correct",
    theme: { light: "#059669", dark: "#059669" },
  },
  unanswered: {
    label: "No answer",
    theme: { light: "#f59e0b", dark: "#d97706" },
  },
  incorrect: {
    label: "Incorrect",
    theme: { light: "#dc2626", dark: "#b91c1c" },
  },
} satisfies ChartConfig;

const accuracyChartConfig = {
  correctPct: {
    label: "Correct",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

/** Small avatar+name chip used everywhere a participant is listed. */
function ParticipantChip({
  participant,
  muted = false,
}: {
  participant: AnalyticsParticipant;
  muted?: boolean;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${
        muted ? "text-muted-foreground border-dashed" : "bg-muted/60"
      }`}
    >
      <QuizAvatar emoji={participant.avatar} size="xs" />
      <span className="truncate">{participant.display_name}</span>
    </span>
  );
}

function ChipList({
  participants,
  muted = false,
}: {
  participants: AnalyticsParticipant[];
  muted?: boolean;
}) {
  if (participants.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {participants.map((p) => (
        <ParticipantChip key={p.id} participant={p} muted={muted} />
      ))}
    </div>
  );
}

export function SessionAnalytics({
  participants,
  answers,
  snapshots,
}: {
  participants: AnalyticsParticipant[];
  answers: AnalyticsAnswer[];
  snapshots: AnalyticsSnapshot[];
}) {
  const participantById = useMemo(
    () => new Map(participants.map((p) => [p.id, p])),
    [participants],
  );

  const answersByQuestion = useMemo(() => {
    const map = new Map<string, AnalyticsAnswer[]>();
    for (const answer of answers) {
      const existing = map.get(answer.question_id);
      if (existing) existing.push(answer);
      else map.set(answer.question_id, [answer]);
    }
    return map;
  }, [answers]);

  const sortedSnapshots = useMemo(
    () =>
      [...snapshots].sort(
        (a, b) => (a.questions?.position ?? 0) - (b.questions?.position ?? 0),
      ),
    [snapshots],
  );

  const scorableSnapshots = sortedSnapshots.filter((s) =>
    SCORABLE_TYPES.has(s.questions?.question_type ?? ""),
  );

  // ── Overview aggregates (scorable questions only) ──
  const totalSlots = scorableSnapshots.length * participants.length;
  let correctTotal = 0;
  let incorrectTotal = 0;
  for (const snapshot of scorableSnapshots) {
    for (const answer of answersByQuestion.get(snapshot.question_id) ?? []) {
      if (answer.is_correct) correctTotal += 1;
      else incorrectTotal += 1;
    }
  }
  const unansweredTotal = Math.max(
    0,
    totalSlots - correctTotal - incorrectTotal,
  );

  const outcomeData = [
    { outcome: "correct", count: correctTotal, fill: "var(--color-correct)" },
    {
      outcome: "unanswered",
      count: unansweredTotal,
      fill: "var(--color-unanswered)",
    },
    {
      outcome: "incorrect",
      count: incorrectTotal,
      fill: "var(--color-incorrect)",
    },
  ].filter((d) => d.count > 0);

  const accuracyData = scorableSnapshots.map((snapshot) => {
    const qAnswers = answersByQuestion.get(snapshot.question_id) ?? [];
    const correctCount = qAnswers.filter((a) => a.is_correct).length;
    return {
      label: `Q${snapshot.questions?.position ?? "?"}`,
      question: snapshot.questions?.text ?? "",
      correctPct:
        participants.length > 0
          ? Math.round((correctCount / participants.length) * 100)
          : 0,
      correctCount,
    };
  });

  const responseTimes = answers
    .map((a) => a.response_time_ms)
    .filter((t): t is number => t !== null);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : null;

  const overallAccuracy =
    totalSlots > 0 ? Math.round((correctTotal / totalSlots) * 100) : null;

  const leaderboard = [...participants].sort(
    (a, b) =>
      b.total_score - a.total_score ||
      a.display_name.localeCompare(b.display_name),
  );

  return (
    <div className="space-y-6">
      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Users}
          value={String(participants.length)}
          label="Participants"
        />
        <StatTile
          icon={ListChecks}
          value={String(sortedSnapshots.length)}
          label="Questions"
        />
        <StatTile
          icon={CheckCircle2}
          value={overallAccuracy !== null ? `${overallAccuracy}%` : "—"}
          label="Overall accuracy"
        />
        <StatTile
          icon={Clock}
          value={
            avgResponseTime !== null
              ? `${(avgResponseTime / 1000).toFixed(1)}s`
              : "—"
          }
          label="Avg response time"
        />
      </div>

      {/* ── Charts row ── */}
      {scorableSnapshots.length > 0 && participants.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <BarChart2 className="h-4 w-4" />
                Correct Answers by Question
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={accuracyChartConfig}
                className="h-[240px] w-full"
              >
                <BarChart data={accuracyData} margin={{ top: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    width={40}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          const row = payload?.[0]?.payload as
                            | (typeof accuracyData)[number]
                            | undefined;
                          return row
                            ? `${row.label} · ${row.question.slice(0, 60)}`
                            : "";
                        }}
                        formatter={(value, _name, item) => {
                          const row = item.payload as
                            | (typeof accuracyData)[number]
                            | undefined;
                          return (
                            <span className="text-foreground font-medium">
                              {value}% correct
                              {row
                                ? ` (${row.correctCount} of ${participants.length})`
                                : ""}
                            </span>
                          );
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey="correctPct"
                    fill="var(--color-correctPct)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Answer Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={outcomeChartConfig}
                className="h-[240px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="outcome" hideLabel />}
                  />
                  <Pie
                    data={outcomeData}
                    dataKey="count"
                    nameKey="outcome"
                    innerRadius={50}
                    stroke="var(--background)"
                    strokeWidth={2}
                    label={({ percent }) =>
                      percent !== undefined && percent > 0.04
                        ? `${Math.round(percent * 100)}%`
                        : ""
                    }
                    labelLine={false}
                  >
                    {outcomeData.map((entry) => (
                      <Cell key={entry.outcome} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (
                          !viewBox ||
                          !("cx" in viewBox) ||
                          !("cy" in viewBox)
                        ) {
                          return null;
                        }
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-xl font-bold"
                            >
                              {totalSlots}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 18}
                              className="fill-muted-foreground text-xs"
                            >
                              answer slots
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="outcome" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Leaderboard table (the table-view twin for the charts) ── */}
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="text-right">Answered</TableHead>
                  <TableHead className="text-right">Correct</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((p, index) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <QuizAvatar emoji={p.avatar} size="sm" />
                        <span className="truncate font-medium">
                          {p.display_name}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {p.answered_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.correct_count}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {p.total_score}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Per-question breakdown ── */}
      {sortedSnapshots.map((snapshot) => (
        <QuestionBreakdown
          key={snapshot.question_id}
          snapshot={snapshot}
          answers={answersByQuestion.get(snapshot.question_id) ?? []}
          participants={participants}
          participantById={participantById}
        />
      ))}
    </div>
  );
}

function QuestionBreakdown({
  snapshot,
  answers,
  participants,
  participantById,
}: {
  snapshot: AnalyticsSnapshot;
  answers: AnalyticsAnswer[];
  participants: AnalyticsParticipant[];
  participantById: Map<string, AnalyticsParticipant>;
}) {
  const question = snapshot.questions;
  const questionType = question?.question_type ?? "";
  const sortedOptions = [...(question?.answer_options ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const optionCountMap = new Map(
    (snapshot.option_counts ?? []).map((oc) => [oc.optionId, oc]),
  );

  const respondentIds = new Set(answers.map((a) => a.participant_id));
  const nonResponders = participants.filter((p) => !respondentIds.has(p.id));

  const resolve = (id: string) => participantById.get(id);

  // Who picked each option (multi-select answers appear under every option
  // they chose — that's the point).
  const participantsByOption = new Map<string, AnalyticsParticipant[]>();
  for (const answer of answers) {
    for (const optionId of answer.selected_option_ids ?? []) {
      const participant = resolve(answer.participant_id);
      if (!participant) continue;
      const existing = participantsByOption.get(optionId);
      if (existing) existing.push(participant);
      else participantsByOption.set(optionId, [participant]);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Q{question?.position ?? "?"}
            </p>
            <CardTitle className="text-base leading-snug">
              {question?.text ?? "Unknown question"}
            </CardTitle>
          </div>
          <div className="text-muted-foreground flex shrink-0 items-center gap-4 text-sm">
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

      <CardContent className="space-y-4">
        {/* Choice questions: distribution bars + who picked each option */}
        {sortedOptions.length > 0 && (
          <div className="space-y-3">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <BarChart2 className="h-3.5 w-3.5" />
              Response Distribution
            </div>
            {sortedOptions.map((option) => {
              const oc = optionCountMap.get(option.id);
              const count = oc?.count ?? 0;
              const pct = oc?.percentage ?? 0;
              const pickers = participantsByOption.get(option.id) ?? [];
              return (
                <div key={option.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`flex items-center gap-1.5 ${
                        option.is_correct
                          ? "font-semibold text-emerald-700 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {option.is_correct && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {option.text ?? `Option ${option.position}`}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        option.is_correct ? "bg-emerald-500" : "bg-primary/60"
                      }`}
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${option.text ?? "Option"}: ${pct}%`}
                    />
                  </div>
                  <ChipList participants={pickers} />
                </div>
              );
            })}
          </div>
        )}

        {/* Open text: every participant's actual response */}
        {questionType === "open_text" && answers.length > 0 && (
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <MessageSquareText className="h-3.5 w-3.5" />
              Responses
            </div>
            {answers.map((answer) => {
              const participant = resolve(answer.participant_id);
              if (!participant) return null;
              return (
                <div
                  key={answer.participant_id}
                  className="flex items-start gap-2.5"
                >
                  <QuizAvatar
                    emoji={participant.avatar}
                    size="sm"
                    className="mt-0.5"
                  />
                  <div className="bg-muted min-w-0 flex-1 rounded-xl rounded-tl-sm px-3 py-2">
                    <p className="text-xs font-medium">
                      {participant.display_name}
                    </p>
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {answer.open_text_response ?? "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rating scale: distribution per rating value + who gave it */}
        {questionType === "rating_scale" && answers.length > 0 && (
          <RatingBreakdown answers={answers} resolve={resolve} />
        )}

        {/* Who didn't answer this question */}
        {nonResponders.length > 0 && (
          <div className="space-y-1.5 border-t border-dashed pt-3">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <HelpCircle className="h-3.5 w-3.5" />
              No answer ({nonResponders.length})
            </div>
            <ChipList participants={nonResponders} muted />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RatingBreakdown({
  answers,
  resolve,
}: {
  answers: AnalyticsAnswer[];
  resolve: (id: string) => AnalyticsParticipant | undefined;
}) {
  const byRating = new Map<number, AnalyticsParticipant[]>();
  for (const answer of answers) {
    if (answer.rating_value === null) continue;
    const participant = resolve(answer.participant_id);
    if (!participant) continue;
    const existing = byRating.get(answer.rating_value);
    if (existing) existing.push(participant);
    else byRating.set(answer.rating_value, [participant]);
  }

  const rated = answers.filter((a) => a.rating_value !== null);
  const avg =
    rated.length > 0
      ? (
          rated.reduce((sum, a) => sum + (a.rating_value ?? 0), 0) /
          rated.length
        ).toFixed(1)
      : null;
  const ratings = [...byRating.keys()].sort((a, b) => a - b);
  const maxCount = Math.max(
    1,
    ...ratings.map((r) => byRating.get(r)?.length ?? 0),
  );

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Star className="h-3.5 w-3.5" />
        Ratings{avg !== null ? ` · ${avg} average` : ""}
      </div>
      {ratings.map((rating) => {
        const raters = byRating.get(rating) ?? [];
        return (
          <div key={rating} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <Badge variant="secondary" className="tabular-nums">
                {rating}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {raters.length}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary/60 h-full rounded-full"
                style={{ width: `${(raters.length / maxCount) * 100}%` }}
              />
            </div>
            <ChipList participants={raters} />
          </div>
        );
      })}
    </div>
  );
}
