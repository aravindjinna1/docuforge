"use client";

import { useForm } from "react-hook-form";
import type { EmailInputs } from "@/types";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { TONE_OPTIONS, LENGTH_OPTIONS } from "@/lib/constants";

interface Props {
  defaultValues?: Partial<EmailInputs>;
  onSubmit: (data: EmailInputs) => void;
  isLoading: boolean;
}

export function EmailForm({ defaultValues, onSubmit, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="From (Your Name)" required error={errors.fromName?.message}>
          <Input
            {...register("fromName", { required: "Your name is required" })}
            placeholder="Alex Johnson"
            error={!!errors.fromName}
          />
        </FormField>
        <FormField label="To (Recipient)" required error={errors.toName?.message}>
          <Input
            {...register("toName", { required: "Recipient name is required" })}
            placeholder="Sarah Williams"
            error={!!errors.toName}
          />
        </FormField>
      </div>

      <FormField label="Subject" required error={errors.subject?.message}>
        <Input
          {...register("subject", { required: "Subject is required" })}
          placeholder="Request for Project Timeline Extension"
          error={!!errors.subject}
        />
      </FormField>

      <FormField
        label="Purpose / Context"
        required
        error={errors.purpose?.message}
        hint="Describe what this email should say. Include key details, any specific requests, and relevant context."
      >
        <Textarea
          {...register("purpose", {
            required: "Purpose is required",
            minLength: { value: 15, message: "Please provide more context" },
          })}
          rows={4}
          placeholder="I need to request a 2-week extension on the Q3 deliverables due to unexpected scope changes from the client last week. The team has been working through the holidays and needs additional runway."
          error={!!errors.purpose}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tone" required>
          <Select {...register("tone")} defaultValue="professional">
            {TONE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.hint}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Length" required>
          <Select {...register("length")} defaultValue="medium">
            {LENGTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.hint})
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}
