"use client";

import { useForm } from "react-hook-form";
import type { ResumeInputs } from "@/types";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues?: Partial<ResumeInputs>;
  onSubmit: (data: ResumeInputs) => void;
  isLoading: boolean;
}

export function ResumeForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ResumeInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Full Name" required error={errors.name?.message}>
          <Input
            {...register("name", { required: "Name is required" })}
            placeholder="Alex Johnson"
            error={!!errors.name}
          />
        </FormField>
        <FormField label="Target Role" hint="Optional — helps tailor the summary.">
          <Input
            {...register("targetRole")}
            placeholder="Senior Software Engineer"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            {...register("email", { required: "Email is required" })}
            placeholder="alex@example.com"
            error={!!errors.email}
          />
        </FormField>
        <FormField label="Phone" required error={errors.phone?.message}>
          <Input
            {...register("phone", { required: "Phone is required" })}
            placeholder="+1 (555) 000-0000"
            error={!!errors.phone}
          />
        </FormField>
      </div>

      <FormField
        label="Key Skills"
        required
        error={errors.skills?.message}
        hint="Comma-separated list of technical and soft skills."
      >
        <Input
          {...register("skills", { required: "Skills are required" })}
          placeholder="TypeScript, React, Node.js, System Design, PostgreSQL, Team Leadership"
          error={!!errors.skills}
        />
      </FormField>

      <FormField
        label="Experience Summary"
        required
        error={errors.experienceSummary?.message}
        hint="Include roles, companies, dates, and key achievements. More detail = better output."
      >
        <Textarea
          {...register("experienceSummary", {
            required: "Experience summary is required",
            minLength: { value: 40, message: "Please provide more detail about your experience" },
          })}
          rows={5}
          placeholder="Senior Engineer at TechCorp (Jan 2022 – Present): Led team of 6, architected payment system handling $5M/month. Software Engineer at StartupXYZ (Mar 2019 – Dec 2021): Built core product API from scratch, reduced latency by 60%."
          error={!!errors.experienceSummary}
        />
      </FormField>

      <FormField
        label="Education"
        required
        error={errors.education?.message}
      >
        <Textarea
          {...register("education", { required: "Education is required" })}
          rows={2}
          placeholder="B.S. Computer Science, State University, 2019. AWS Solutions Architect (Professional), 2022."
          error={!!errors.education}
        />
      </FormField>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}
