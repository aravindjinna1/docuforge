"use client";

import { useForm } from "react-hook-form";
import type { MeetingMinutesInputs } from "@/types";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues?: Partial<MeetingMinutesInputs>;
  onSubmit: (data: MeetingMinutesInputs) => void;
  isLoading: boolean;
}

export function MeetingMinutesForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<MeetingMinutesInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Meeting Title" required error={errors.meetingTitle?.message}>
        <Input
          {...register("meetingTitle", { required: "Meeting title is required" })}
          placeholder="Weekly Sprint Planning — Week 12"
          error={!!errors.meetingTitle}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date" required error={errors.date?.message}>
          <Input
            type="date"
            {...register("date", { required: "Date is required" })}
            error={!!errors.date}
          />
        </FormField>
        <FormField label="Chaired By" required error={errors.chairedBy?.message}>
          <Input
            {...register("chairedBy", { required: "Chairperson is required" })}
            placeholder="Sarah Williams"
            error={!!errors.chairedBy}
          />
        </FormField>
      </div>

      <FormField label="Attendees" required error={errors.attendees?.message}>
        <Input
          {...register("attendees", { required: "Attendees are required" })}
          placeholder="Alex J., Maria G., David K., Lisa T."
          error={!!errors.attendees}
        />
      </FormField>

      <FormField label="Agenda" required error={errors.agenda?.message}>
        <Textarea
          {...register("agenda", {
            required: "Agenda is required",
            minLength: { value: 20, message: "Please provide more detail" },
          })}
          rows={3}
          placeholder="1. Review last sprint deliverables 2. Q2 roadmap discussion 3. Resource allocation for upcoming project 4. Client feedback review"
          error={!!errors.agenda}
        />
      </FormField>

      <FormField label="Discussion Summary" required error={errors.discussion?.message}>
        <Textarea
          {...register("discussion", {
            required: "Discussion summary is required",
            minLength: { value: 30, message: "Please provide more detail" },
          })}
          rows={4}
          placeholder="The team reviewed the completed deliverables from last sprint. Two items were carried over due to dependency issues. Q2 roadmap was discussed with focus on the platform migration project."
          error={!!errors.discussion}
        />
      </FormField>

      <FormField label="Action Items" required error={errors.actionItems?.message}>
        <Textarea
          {...register("actionItems", { required: "Action items are required" })}
          rows={3}
          placeholder="1. Maria: Complete API documentation by Friday 2. David: Schedule client feedback session for next Tuesday 3. Alex: Prepare resource allocation spreadsheet"
          error={!!errors.actionItems}
        />
      </FormField>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}

