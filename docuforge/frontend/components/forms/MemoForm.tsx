"use client";

import { useForm } from "react-hook-form";
import type { MemoInputs } from "@/types";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { TONE_OPTIONS } from "@/lib/constants";

interface Props {
  defaultValues?: Partial<MemoInputs>;
  onSubmit: (data: MemoInputs) => void;
  isLoading: boolean;
}

export function MemoForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<MemoInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Document Title" required error={errors.title?.message}>
        <Input
          {...register("title", { required: "Title is required" })}
          placeholder="Q3 Budget Adjustment"
          error={!!errors.title}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="From" required error={errors.from?.message}>
          <Input
            {...register("from", { required: "Sender is required" })}
            placeholder="HR Department"
            error={!!errors.from}
          />
        </FormField>
        <FormField label="To" required error={errors.to?.message}>
          <Input
            {...register("to", { required: "Recipient is required" })}
            placeholder="All Staff"
            error={!!errors.to}
          />
        </FormField>
      </div>

      <FormField label="Subject" required error={errors.subject?.message}>
        <Input
          {...register("subject", { required: "Subject is required" })}
          placeholder="New Remote Work Policy"
          error={!!errors.subject}
        />
      </FormField>

      <FormField
        label="Context & Details"
        required
        error={errors.context?.message}
        hint="Describe the purpose, background, and any action items for this memo."
      >
        <Textarea
          {...register("context", {
            required: "Context is required",
            minLength: { value: 20, message: "Please provide more detail" },
          })}
          rows={5}
          placeholder="This memo announces the new flexible working hours policy effective March 1st. Employees may choose their start time between 7:00 AM and 10:00 AM. Core hours remain 10:00 AM to 3:00 PM."
          error={!!errors.context}
        />
      </FormField>

      <FormField label="Tone" required>
        <Select {...register("tone")} defaultValue="formal">
          {TONE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label} — {o.hint}</option>
          ))}
        </Select>
      </FormField>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}

