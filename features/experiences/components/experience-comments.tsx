"use client";

import { useState } from "react";

import { MessageSquare, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { deleteComment, postComment } from "../lib/actions";
import { CommentWithAuthor } from "../lib/types";
import { postCommentSchema } from "../lib/validation";

export function ExperienceComments({
  experienceId,
  authorId,
  currentUserId,
  isCoordinator,
  initialComments,
}: {
  experienceId: string;
  authorId: string;
  currentUserId: string | null;
  isCoordinator: boolean;
  initialComments: CommentWithAuthor[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = postCommentSchema.safeParse({ experienceId, body });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid question");
      return;
    }

    setIsSubmitting(true);
    try {
      const comment = await postComment(parsed.data);
      setComments((prev) => [...prev, comment]);
      setBody("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to post question",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete question",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <h2 className="text-lg font-semibold">
          Ask the Senior{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({comments.length})
          </span>
        </h2>
      </div>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Ask a question about this experience..."
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSubmitting}
          />
          <Button type="submit" size="sm" disabled={isSubmitting || !body.trim()}>
            {isSubmitting ? "Posting..." : "Post Question"}
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground text-sm">
          Log in to ask a question.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No questions yet. Be the first to ask.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const canDelete =
              currentUserId === comment.authorId || isCoordinator;
            return (
              <div key={comment.id} className="flex items-start gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={comment.author.image ?? undefined} />
                  <AvatarFallback>
                    <UserIcon className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted min-w-0 flex-1 space-y-0.5 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">
                      {comment.author.name ?? "Anonymous"}
                    </span>
                    {comment.authorId === authorId && (
                      <Badge className="bg-primary/15 text-primary hover:bg-primary/15 text-[10px]">
                        Author
                      </Badge>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {new Date(comment.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
