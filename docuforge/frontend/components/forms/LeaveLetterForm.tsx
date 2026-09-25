"use client";

import { useForm } from "react-hook-form";
import type { LeaveLetterInputs } from "@/types";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { LEAVE_TYPE_OPTIONS } from "@/lib/constants";

interface Props {
  defaultValues?: Partial<LeaveLetterInputs>;
  onSubmit: (data: LeaveLetterInputs) => void;
  isLoading: boolean;
}

export function LeaveLetterForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<LeaveLetterInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Employee Name" required error={errors.employeeName?.message}>
          <Input
            {...register("employeeName", { required: "Your name is required" })}
            placeholder="Alex Johnson"
            error={!!errors.employeeName}
          />
        </FormField>
        <FormField label="Manager / Supervisor Name" required error={errors.managerName?.message}>
          <Input
            {...register("managerName", { required: "Manager name is required" })}
            placeholder="Sarah Williams"
            error={!!errors.managerName}
          />
        </FormField>
      </div>

      <FormField label="Leave Type" required>
        <Select {...register("leaveType")} defaultValue="Annual Leave">
          {LEAVE_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="From Date" required error={errors.fromDate?.message}>
          <Input
            type="date"
            {...register("fromDate", { required: "Start date is required" })}
            error={!!errors.fromDate}
          />
        </FormField>
        <FormField label="To Date" required error={errors.toDate?.message}>
          <Input
            type="date"
            {...register("toDate", { required: "End date is required" })}
            error={!!errors.toDate}
          />
        </FormField>
      </div>

      <FormField
        label="Reason"
        required
        error={errors.reason?.message}
        hint="Brief explanation for the leave request."
      >
        <Textarea
          {...register("reason", { required: "Reason is required" })}
          rows={3}
          placeholder="I need to attend to a personal family matter that requires my presence out of the city for the duration of the leave."
          error={!!errors.reason}
        />
      </FormField>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}
