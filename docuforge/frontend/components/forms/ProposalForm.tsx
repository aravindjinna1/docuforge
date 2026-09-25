"use client";

import { useForm } from "react-hook-form";
import type { ProposalInputs } from "@/types";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues?: Partial<ProposalInputs>;
  onSubmit: (data: ProposalInputs) => void;
  isLoading: boolean;
}

export function ProposalForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProposalInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Proposal Title" required error={errors.title?.message}>
        <Input
          {...register("title", { required: "Title is required" })}
          placeholder="Website Redesign Proposal"
          error={!!errors.title}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Client / Company Name" required error={errors.clientName?.message}>
          <Input
            {...register("clientName", { required: "Client name is required" })}
            placeholder="Acme Corp"
            error={!!errors.clientName}
          />
        </FormField>
        <FormField label="Prepared By" required error={errors.preparedBy?.message}>
          <Input
            {...register("preparedBy", { required: "Your name is required" })}
            placeholder="Alex Johnson"
            error={!!errors.preparedBy}
          />
        </FormField>
      </div>

      <FormField label="Project Scope" required error={errors.projectScope?.message}>
        <Textarea
          {...register("projectScope", {
            required: "Project scope is required",
            minLength: { value: 30, message: "Please provide more detail" },
          })}
          rows={4}
          placeholder="A complete redesign of the company website including homepage, product pages, blog, and admin dashboard. Mobile-responsive design with modern UI framework."
          error={!!errors.projectScope}
        />
      </FormField>

      <FormField label="Deliverables" required error={errors.deliverables?.message}>
        <Textarea
          {...register("deliverables", { required: "Deliverables are required" })}
          rows={3}
          placeholder="1. Wireframes and mockups for all pages (Figma) 2. Frontend implementation in Next.js 3. Content migration from old site 4. SEO optimization 5. Performance testing report"
          error={!!errors.deliverables}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Timeline" required error={errors.timeline?.message}>
          <Input
            {...register("timeline", { required: "Timeline is required" })}
            placeholder="8 weeks (Start: March 1, 2025)"
            error={!!errors.timeline}
          />
        </FormField>
        <FormField label="Budget" required error={errors.budget?.message}>
          <Input
            {...register("budget", { required: "Budget is required" })}
            placeholder="$25,000"
            error={!!errors.budget}
          />
        </FormField>
      </div>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}

