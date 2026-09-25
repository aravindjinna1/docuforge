"use client";

import { useForm } from "react-hook-form";
import type { ResignationLetterInputs } from "@/types";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues?: Partial<ResignationLetterInputs>;
  onSubmit: (data: ResignationLetterInputs) => void;
  isLoading: boolean;
}

export function ResignationLetterForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ResignationLetterInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Your Full Name" required error={errors.employeeName?.message}>
          <Input
            {...register("employeeName", { required: "Your name is required" })}
            placeholder="Alex Johnson"
            error={!!errors.employeeName}
          />
        </FormField>
        <FormField label="Manager's Name" required error={errors.managerName?.message}>
          <Input
            {...register("managerName", { required: "Manager name is required" })}
            placeholder="Sarah Williams"
            error={!!errors.managerName}
          />
        </FormField>
      </div>

      <FormField label="Company Name" required error={errors.company?.message}>
        <Input
          {...register("company", { required: "Company name is required" })}
          placeholder="Acme Corporation"
          error={!!errors.company}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Last Working Day" required error={errors.lastWorkingDay?.message}>
          <Input
            type="date"
            {...register("lastWorkingDay", { required: "Last working day is required" })}
            error={!!errors.lastWorkingDay}
          />
        </FormField>
        <FormField
          label="Years at Company"
          hint="Optional — adds context to the letter."
        >
          <Input
            {...register("yearsWorked")}
            placeholder="3 years"
          />
        </FormField>
      </div>

      <FormField
        label="Reason (optional)"
        hint="Optional. Will be incorporated sensitively — not quoted verbatim."
      >
        <Textarea
          {...register("reason")}
          rows={3}
          placeholder="Pursuing a new opportunity that better aligns with my long-term career goals in product leadership."
        />
      </FormField>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}
