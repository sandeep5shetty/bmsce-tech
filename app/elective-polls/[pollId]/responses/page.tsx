"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowLeft, UserX, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { NonRespondersList } from "@/features/elective-polls/components/non-responders-list";
import {
  type PollResponseRow,
  ResponsesTable,
} from "@/features/elective-polls/components/responses-table";

interface PollOption {
  id: string;
  label: string;
}

export default function ElectivePollResponsesPage() {
  const params = useParams();
  const pollId = typeof params.pollId === "string" ? params.pollId : "";

  const [title, setTitle] = useState("Poll");
  const [options, setOptions] = useState<PollOption[]>([]);
  const [responses, setResponses] = useState<PollResponseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/elective-polls/v1/polls/${pollId}`).then((r) => r.json()),
      fetch(`/api/elective-polls/v1/polls/${pollId}/responses`).then((r) =>
        r.json(),
      ),
    ])
      .then(([pollBody, responsesBody]) => {
        if (pollBody?.poll?.title) setTitle(pollBody.poll.title);
        if (pollBody?.poll?.options) setOptions(pollBody.poll.options);
        setResponses(responsesBody.responses ?? []);
      })
      .finally(() => setLoading(false));
  }, [pollId]);

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/elective-polls/${pollId}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to poll
        </Link>
      </Button>

      <div>
        <h1 className="font-serif text-2xl font-semibold">
          {title} — Responses
        </h1>
      </div>

      <Tabs defaultValue="responded">
        <TabsList>
          <TabsTrigger value="responded">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Responded
          </TabsTrigger>
          <TabsTrigger value="not-responded">
            <UserX className="mr-1.5 h-3.5 w-3.5" />
            Not Responded
          </TabsTrigger>
        </TabsList>
        <TabsContent value="responded">
          <ResponsesTable
            title={title}
            responses={responses}
            options={options}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="not-responded">
          <NonRespondersList pollId={pollId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
