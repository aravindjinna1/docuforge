"use client";

import { useForm } from "react-hook-form";
import type { ReportInputs } from "@/types";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues?: Partial<ReportInputs>;
  onSubmit: (data: ReportInputs) => void;
  isLoading: boolean;
}

export function ReportForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ReportInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Report Title" required error={errors.title?.message}>
        <Input
          {...register("title", { required: "Title is required" })}
          placeholder="Q1 2025 Sales Performance Report"
          error={!!errors.title}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Prepared By" required error={errors.preparedBy?.message}>
          <Input
            {...register("preparedBy", { required: "Your name is required" })}
            placeholder="Alex Johnson"
            error={!!errors.preparedBy}
          />
        </FormField>
        <FormField label="Date" required error={errors.date?.message}>
          <Input
            type="date"
            {...register("date", { required: "Date is required" })}
            error={!!errors.date}
          />
        </FormField>
      </div>

      <FormField label="Executive Summary" required error={errors.summary?.message}>
        <Textarea
          {...register("summary", {
            required: "Summary is required",
            minLength: { value: 30, message: "Please provide more detail" },
          })}
          rows={3}
          placeholder="Q1 2025 revenue reached $2.3M, exceeding target by 12%. Customer acquisition cost decreased by 8% while retention improved to 94%. Key initiatives include the launch of the enterprise tier and expansion into the APAC market."
          error={!!errors.summary}
        />
      </FormField>

      <FormField label="Report Body / Analysis" required error={errors.body?.message}>
        <Textarea
          {...register("body", {
            required: "Body is required",
            minLength: { value: 50, message: "Please provide more detail" },
          })}
          rows={5}
          placeholder="Revenue growth was driven primarily by the enterprise segment which grew 34% quarter-over-quarter. The SMB segment remained stable. The APAC expansion contributed $320K in new revenue. Customer support ticket volume increased by 18% due to the new product launch, but resolution time improved by 22%."
          error={!!errors.body}
        />
      </FormField>

      <FormField label="Key Findings" required error={errors.findings?.message}>
        <Textarea
          {...register("findings", { required: "Findings are required" })}
          rows={3}
          placeholder="1. Enterprise segment is the primary growth driver 2. Customer retention improved due to new onboarding flow 3. APAC market shows strong initial traction 4. Support team needs additional headcount for Q2"
          error={!!errors.findings}
        />
      </FormField>

      <FormField label="Recommendations" required error={errors.recommendations?.message}>
        <Textarea
          {...register("recommendations", { required: "Recommendations are required" })}
          rows={3}
          placeholder="1. Increase enterprise sales team by 2 headcount 2. Invest in APAC marketing budget 3. Hire 2 additional support engineers 4. Develop self-service knowledge base to reduce ticket volume"
          error={!!errors.recommendations}
        />
      </FormField>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}

