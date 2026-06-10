"use client";

import { useEffect, useState } from "react";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { GripVertical, Loader2, Minus, Plus, RotateCcw, Shield, Shuffle, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { EmptyAddCard } from "@/components/common/empty-add-card";

import { isActivityCoordinator } from "@/lib/students/section-b-roster";

import { Student } from "@/types";

const poolActionButtonClass =
  "text-muted-foreground h-7 w-7 shrink-0 rounded-md border border-border/80 bg-background/80 shadow-xs";

/* ── Draggable student chip ─────────────────────────────────────── */
function DraggableStudent({
  student,
  index,
  variant = "chip",
  onMarkExcluded,
  onRestoreToPool,
  isCoordinatorExcluded = false,
}: {
  student: Student;
  index?: number;
  variant?: "chip" | "card";
  onMarkExcluded?: () => void;
  onRestoreToPool?: () => void;
  isCoordinatorExcluded?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: student.id, disabled: isCoordinatorExcluded });

  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  if (variant === "card") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="group bg-card hover:shadow-primary/5 relative flex cursor-grab overflow-hidden rounded-xl border transition-all duration-300 active:cursor-grabbing hover:border-primary/30"
      >
        <div className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex w-full items-center gap-3 px-4 py-3">
          <GripVertical className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
          {index !== undefined && (
            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {index + 1}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">{student.name}</p>
            <p className="text-muted-foreground truncate text-xs">{student.usn}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isCoordinatorExcluded ? listeners : {})}
      {...(!isCoordinatorExcluded ? attributes : {})}
      className={`bg-card flex items-center gap-2 rounded-lg border px-3 py-2 ${
        isCoordinatorExcluded ? "border-primary/20 bg-primary/5" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      {!isCoordinatorExcluded && (
        <GripVertical className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {isCoordinatorExcluded && (
        <Shield className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{student.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {student.usn}
          {isCoordinatorExcluded ? " · Coordinator" : ""}
        </p>
      </div>
      {onMarkExcluded && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${poolActionButtonClass} hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onMarkExcluded();
          }}
          aria-label={`Exclude ${student.name}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
      )}
      {onRestoreToPool && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${poolActionButtonClass} hover:text-primary hover:bg-primary/10 hover:border-primary/30`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRestoreToPool();
          }}
          aria-label={`Restore ${student.name} to pool`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/* ── Droppable zone ──────────────────────────────────────────────── */
function DroppableZone({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`h-full rounded-lg transition-colors ${isOver ? "bg-primary/5 ring-primary/30 ring-2" : ""}`}
    >
      {children}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function RandomPickerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pickedStudents, setPickedStudents] = useState<Student[]>([]);
  const [alreadyPicked, setAlreadyPicked] = useState<Set<string>>(new Set());
  const [numberOfPicks, setNumberOfPicks] = useState<number | "">(1);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [excludeCoordinators, setExcludeCoordinators] = useState(true);
  const [reseeding, setReseeding] = useState(false);

  async function reseedStudents() {
    const confirmed = window.confirm(
      "Replace all students with the latest Section B roster? Your pick history will be cleared.",
    );
    if (!confirmed) return;

    setReseeding(true);
    try {
      const res = await fetch("/api/seed-students", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Seed failed");

      localStorage.removeItem("rp_picked");
      toast.success(data.message);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Seed failed");
    } finally {
      setReseeding(false);
    }
  }

  /* ── Load students + restore from localStorage ── */
  useEffect(() => {
    const savedExclude = localStorage.getItem("rp_exclude_coordinators");
    if (savedExclude !== null) {
      setExcludeCoordinators(savedExclude === "true");
    }

    async function load() {
      try {
        const res = await fetch("/api/students");
        if (!res.ok) throw new Error();
        const all: Student[] = await res.json();
        const sectionB = all.filter((s) => s.section === "B");
        setStudents(sectionB);

        const saved = localStorage.getItem("rp_picked");
        if (saved) {
          const ids: string[] = JSON.parse(saved);
          setAlreadyPicked(new Set(ids));
          setPickedStudents(sectionB.filter((s) => ids.includes(s.id)));
        }
      } catch {
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Persist alreadyPicked ── */
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem("rp_picked", JSON.stringify([...alreadyPicked]));
    }
  }, [alreadyPicked, students.length]);

  useEffect(() => {
    localStorage.setItem("rp_exclude_coordinators", String(excludeCoordinators));
  }, [excludeCoordinators]);

  function isPoolEligible(student: Student) {
    if (alreadyPicked.has(student.id)) return false;
    if (excludeCoordinators && isActivityCoordinator(student.usn)) return false;
    return true;
  }

  function isCoordinatorExcluded(student: Student) {
    return excludeCoordinators && isActivityCoordinator(student.usn) && !alreadyPicked.has(student.id);
  }

  function isExcludedFromPool(student: Student) {
    return alreadyPicked.has(student.id) || isCoordinatorExcluded(student);
  }

  function markAsExcluded(student: Student) {
    if (isExcludedFromPool(student)) return;

    setAlreadyPicked(new Set(alreadyPicked).add(student.id));
    toast.success(`${student.name} excluded from pool`);
  }

  function restoreToPool(student: Student) {
    if (isCoordinatorExcluded(student)) return;
    if (!alreadyPicked.has(student.id)) return;

    setPickedStudents(pickedStudents.filter((x) => x.id !== student.id));
    const nextPicked = new Set(alreadyPicked);
    nextPicked.delete(student.id);
    setAlreadyPicked(nextPicked);
    toast.success(`${student.name} restored to pool`);
  }

  function secureRandom(max: number) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }

  function pickRandom(addToCurrent = false) {
    const n = Number(numberOfPicks);
    if (!n || n < 1) { toast.error("Enter a valid number (min 1)"); return; }

    const available = students.filter(isPoolEligible);
    if (available.length === 0) { toast.error("All students picked. Reset to continue."); return; }

    const actual = Math.min(n, available.length);
    if (actual < n) toast.warning(`Only ${actual} student(s) available`);

    setPicking(true);
    setTimeout(() => {
      const picked: Student[] = [];
      const newPicked = new Set(alreadyPicked);
      const pool = [...available];

      for (let i = 0; i < actual; i++) {
        const remaining = pool.filter((s) => !picked.includes(s));
        const idx = secureRandom(remaining.length);
        picked.push(remaining[idx]);
        newPicked.add(remaining[idx].id);
      }

      setPickedStudents(addToCurrent ? [...pickedStudents, ...picked] : picked);
      setAlreadyPicked(newPicked);
      toast.success(`Picked ${picked.length} student(s)!`);
      setPicking(false);
    }, 400);
  }

  function reset() {
    setPickedStudents([]);
    setAlreadyPicked(new Set());
    localStorage.removeItem("rp_picked");
    toast.success("Picker reset");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const sid = active.id as string;
    const zone = over.id as string;
    const s = students.find((s) => s.id === sid);
    if (!s) return;

    const isPicked = alreadyPicked.has(sid);

    if ((zone === "picked-zone" || zone === "picked-sidebar") && !isPicked) {
      setPickedStudents([...pickedStudents, s]);
      setAlreadyPicked(new Set(alreadyPicked).add(sid));
      toast.success(`${s.name} added`);
    } else if (zone === "available-zone" && isPicked) {
      setPickedStudents(pickedStudents.filter((x) => x.id !== sid));
      const np = new Set(alreadyPicked);
      np.delete(sid);
      setAlreadyPicked(np);
      toast.success(`${s.name} removed`);
    }
  }

  const availableStudents = students.filter(isPoolEligible);
  const availableCount = availableStudents.length;
  const excludedStudents = students
    .filter(isExcludedFromPool)
    .sort((a, b) => {
      const aIsCoordinator = isCoordinatorExcluded(a) ? 0 : 1;
      const bIsCoordinator = isCoordinatorExcluded(b) ? 0 : 1;
      if (aIsCoordinator !== bIsCoordinator) return aIsCoordinator - bIsCoordinator;
      return a.name.localeCompare(b.name);
    });
  const excludedCount = excludedStudents.length;
  const activeStudent = students.find((s) => s.id === activeId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading students…</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="container mx-auto mt-8 mb-32 max-w-6xl px-4 sm:px-6">
        <EmptyAddCard
          title="Seed Students"
          description="No Section B students in the database. Re-seed to load the latest MCA 1st year roster."
          action={
            <Button
              className="mt-2"
              disabled={reseeding}
              onClick={reseedStudents}
            >
              {reseeding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Seed Students Now
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto mt-8 mb-32 max-w-6xl px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-semibold">Random Student Picker</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            MCA 1st yr Sec B — {students.length} students · {availableCount} available · {excludedCount} excluded
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main picker card */}
          <Card className="shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Pick Random Students
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Controls */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="count">Number to pick</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={availableCount}
                    value={numberOfPicks}
                    onChange={(e) =>
                      setNumberOfPicks(e.target.value ? parseInt(e.target.value) : "")
                    }
                    className="w-36"
                    placeholder="e.g. 3"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => pickRandom(false)}
                    disabled={picking || availableCount === 0}
                  >
                    {picking ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Shuffle className="mr-2 h-4 w-4" />
                    )}
                    Pick Random
                  </Button>
                  {pickedStudents.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => pickRandom(true)}
                      disabled={picking || availableCount === 0}
                    >
                      <Shuffle className="mr-2 h-4 w-4" />
                      Pick More
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={reset}
                    disabled={alreadyPicked.size === 0 && pickedStudents.length === 0}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Current picks */}
              {pickedStudents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Picked Students ({pickedStudents.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPickedStudents([])}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                  <DroppableZone id="picked-zone">
                    <div className="grid min-h-[80px] gap-3 rounded-lg p-1">
                      {pickedStudents.map((s, i) => (
                        <DraggableStudent key={s.id} student={s} index={i} variant="card" />
                      ))}
                    </div>
                  </DroppableZone>
                </div>
              )}

              {/* Already picked history */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Already Picked / Excluded  ({excludedCount})
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    Manually excluded students and activity coordinators. Use + to restore picks to the pool.
                  </p>
                </CardHeader>
                <CardContent>
                  <DroppableZone id="picked-sidebar">
                    {excludedCount === 0 ? (
                      <p className="text-muted-foreground py-8 text-center text-sm">
                        No students excluded yet.
                      </p>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {excludedStudents.map((s) => (
                          <DraggableStudent
                            key={s.id}
                            student={s}
                            variant="chip"
                            isCoordinatorExcluded={isCoordinatorExcluded(s)}
                            onRestoreToPool={
                              isCoordinatorExcluded(s)
                                ? undefined
                                : () => restoreToPool(s)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </DroppableZone>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Available students sidebar */}
          <Card className="flex max-h-[calc(100vh-8rem)] flex-col shadow-md lg:sticky lg:top-4 gap-0">
            <CardHeader className="shrink-0 space-y-4 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="text-primary h-4 w-4" />
                  Available ({availableCount})
                </CardTitle>
                <p className="text-muted-foreground mt-1 text-xs">
                  Use − to exclude or drag students into Already Picked.
                </p>
              </div>
              
              <label className="hover:bg-muted/60 flex cursor-pointer items-center gap-2.5 rounded-lg border bg-background px-3 py-2 transition-colors">
                      <input
                        id="exclude-coordinators"
                        type="checkbox"
                        checked={excludeCoordinators}
                        onChange={(event) =>
                          setExcludeCoordinators(event.target.checked)
                        }
                        className="border-input text-primary focus:ring-ring size-4 rounded"
                      />
                      <span className="text-sm leading-none">
                        Exclude activity coordinators 
                      </span>
                    </label>

              {/* <div className="bg-muted/40 space-y-3 rounded-xl border border-dashed p-3">
                <div className="flex items-start gap-3">
                  <Shield className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-medium">Activity Coordinators</p>
                      <p className="text-muted-foreground text-xs">
                        Optional exclusion from the pick pool
                      </p>
                    </div>
                    
                  </div>
                </div>
              </div> */}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
              <DroppableZone id="available-zone">
                {availableCount === 0 ? (
                  <p className="text-muted-foreground py-12 text-center text-sm">
                    No students available in the pool.
                  </p>
                ) : (
                  <div className="h-full space-y-2 overflow-y-auto p-4">
                    {availableStudents.map((s) => (
                      <DraggableStudent
                        key={s.id}
                        student={s}
                        variant="chip"
                        onMarkExcluded={() => markAsExcluded(s)}
                      />
                    ))}
                  </div>
                )}
              </DroppableZone>
            </CardContent>
          </Card>
        </div>
      </div>

      <DragOverlay>
        {activeStudent ? (
          <div className="bg-card rounded-xl border p-3 shadow-lg">
            <p className="text-sm font-medium">{activeStudent.name}</p>
            <p className="text-muted-foreground text-xs">{activeStudent.usn}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
