"use client";

import { useForm } from "react-hook-form";
import type { AgreementInputs } from "@/types";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues?: Partial<AgreementInputs>;
  onSubmit: (data: AgreementInputs) => void;
  isLoading: boolean;
}

export function AgreementForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<AgreementInputs>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Agreement Title" required error={errors.title?.message}>
        <Input
          {...register("title", { required: "Title is required" })}
          placeholder="Mutual Non-Disclosure Agreement"
          error={!!errors.title}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Party A" required error={errors.partyA?.message}>
          <Input
            {...register("partyA", { required: "Party A is required" })}
            placeholder="Acme Corporation"
            error={!!errors.partyA}
          />
        </FormField>
        <FormField label="Party B" required error={errors.partyB?.message}>
          <Input
            {...register("partyB", { required: "Party B is required" })}
            placeholder="Beta Technologies Inc."
            error={!!errors.partyB}
          />
        </FormField>
      </div>

      <FormField label="Effective Date" required error={errors.effectiveDate?.message}>
        <Input
          type="date"
          {...register("effectiveDate", { required: "Effective date is required" })}
          error={!!errors.effectiveDate}
        />
      </FormField>

      <FormField label="Scope of Agreement" required error={errors.scope?.message}>
        <Textarea
          {...register("scope", {
            required: "Scope is required",
            minLength: { value: 30, message: "Please provide more detail" },
          })}
          rows={3}
          placeholder="This agreement governs the exchange of confidential information between the parties for the purpose of evaluating a potential business partnership in the area of cloud infrastructure services."
          error={!!errors.scope}
        />
      </FormField>

      <FormField label="Key Terms & Conditions" required error={errors.terms?.message}>
        <Textarea
          {...register("terms", { required: "Terms are required" })}
          rows={4}
          placeholder="1. Definition of confidential information 2. Obligations of receiving party 3. Exclusions from confidential information 4. Term and termination 5. Return of materials 6. No license granted"
          error={!!errors.terms}
        />
      </FormField>

      <FormField label="Duration / Term" required error={errors.duration?.message}>
        <Input
          {...register("duration", { required: "Duration is required" })}
          placeholder="2 years from effective date"
          error={!!errors.duration}
        />
      </FormField>

      <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
        {isLoading ? "Generating…" : "Generate with AI"}
      </Button>
    </form>
  );
}

