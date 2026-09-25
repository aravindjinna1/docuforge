"use client";

import { useForm } from "react-hook-form";
import type { CoverLetterInputs } from "@/types";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { TONE_OPTIONS } from "@/lib/constants";

interface Props {
  defaultValues?: Partial<CoverLetterInputs>;
  onSubmit: (data: CoverLetterInputs) => void;
  isLoading: boolean;
}

export function CoverLetterForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CoverLetterInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Your Full Name" required error={errors.candidateName?.message}>
        <Input
          {...register("candidateName", { required: "Your name is required" })}
          placeholder="Alex Johnson"
          error={!!errors.candidateName}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Position / Role" required error={errors.role?.message}>
          <Input
            {...register("role", { required: "Role title is required" })}
            placeholder="Senior Product Designer"
            error={!!errors.role}
          />
        </FormField>
        <FormField label="Company Name" required error={errors.company?.message}>
          <Input
            {...register("company", { required: "Company name is required" })}
            placeholder="Acme Corporation"
            error={!!errors.company}
          />
        </FormField>
      </div>

      <FormField
        label="Experience Summary"
        required
        error={errors.experienceSummary?.message}
        hint="Summarize your most relevant experience for this specific role."
      >
        <Textarea
          {...register("experienceSummary", {
            required: "Experience summary is required",
            minLength: { value: 30, message: "Please provide more detail" },
          })}
          rows={4}
          placeholder="5 years of product design experience at B2B SaaS companies. Led the end-to-end redesign of our core product which increased trial-to-paid conversion by 34%. Specialize in design systems and cross-functional collaboration with engineering teams."
          error={!!errors.experienceSummary}
        />
      </FormField>

      <FormField
        label="Key Skills"
        required
        error={errors.skills?.message}
        hint="Comma-separated list of skills most relevant to this role."
      >
        <Input
          {...register("skills", { required: "Skills are required" })}
          placeholder="Figma, Design Systems, User Research, Prototyping, Stakeholder Management"
          error={!!errors.skills}
        />
      </FormField>

      <FormField label="Tone" required>
        <Select {...register("tone")} defaultValue="professional">
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
