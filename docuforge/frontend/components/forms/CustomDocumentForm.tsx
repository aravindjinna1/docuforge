"use client";

import { useForm } from "react-hook-form";
import type { CustomDocumentInputs } from "@/types";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { TONE_OPTIONS } from "@/lib/constants";

interface Props {
  defaultValues?: Partial<CustomDocumentInputs>;
  onSubmit: (data: CustomDocumentInputs) => void;
  isLoading: boolean;
}

export function CustomDocumentForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomDocumentInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Document Title" required error={errors.title?.message}>
        <Input
          {...register("title", { required: "Document title is required" })}
          placeholder="Notice of Upcoming Office Relocation"
          error={!!errors.title}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="From / Sender" hint="Optional">
          <Input
            {...register("sender")}
            placeholder="HR Department"
          />
        </FormField>
        <FormField label="To / Recipient" hint="Optional">
          <Input
            {...register("recipient")}
            placeholder="All Staff"
          />
        </FormField>
      </div>

      <FormField
        label="Context & Instructions"
        required
        error={errors.context?.message}
        hint="Describe exactly what the document should say. The more detail you provide, the better the output."
      >
        <Textarea
          {...register("context", {
            required: "Context is required",
            minLength: { value: 20, message: "Please provide more detail" },
          })}
          rows={5}
          placeholder="This document should inform all staff about the office relocation to 123 Business Park, Suite 400 on March 1st. Include information about parking arrangements (permit required), the moving schedule (Feb 28 – Mar 1), and who to contact with questions (facilities@company.com)."
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
