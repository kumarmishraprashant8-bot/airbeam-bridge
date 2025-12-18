// frontend/src/components/ProjectForm/groups/StrapsGroup.tsx
import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProjectPayload, StrapsConfig } from "../../../types";




const StrapSchema = z.object({
  enabled: z.boolean().optional(),
  type: z.string().optional(),


  spacing: z.number().min(50).max(2000).optional(),
  area: z.number().min(1).optional(),
  E: z.number().min(0.001).optional(),
  pretension: z.number().min(0).optional(),
});

type StrapForm = z.infer<typeof StrapSchema>;

export function StrapsGroup({ value, onChange }: { value: StrapsConfig; onChange: (s: StrapsConfig) => void }) {
  const { control, register, watch } = useForm<StrapForm>({
    resolver: zodResolver(StrapSchema),
    defaultValues: value || {},
    mode: "onChange",
  });

  // we only have a single straps object, keep it simple
  const watched = watch();

  React.useEffect(() => {
    onChange({ ...(value || {}), ...watched });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched]);

  return (
    <div>
      <label>
        <input type="checkbox" {...register("enabled")} defaultChecked={value?.enabled} /> Enable straps
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <label>
          Type
          <select {...register("type")} defaultValue={value?.type ?? "strap_flat"}>
            <option value="strap_flat">strap_flat</option>
            <option value="wire_rope">wire_rope</option>
            <option value="tendon">tendon</option>
          </select>
        </label>

        <label>
          Spacing (mm)
          <input type="number" {...register("spacing", { valueAsNumber: true })} defaultValue={value?.spacing ?? 300} />
        </label>

        <label>
          Area (mm^2)
          <input type="number" {...register("area", { valueAsNumber: true })} defaultValue={value?.area ?? 100} />
        </label>

        <label>
          E (N/mm^2)
          <input type="number" {...register("E", { valueAsNumber: true })} defaultValue={value?.E ?? 200000} />
        </label>

        <label>
          Pretension (kN)
          <input type="number" {...register("pretension", { valueAsNumber: true })} defaultValue={value?.pretension ?? 5} />
        </label>
      </div>
    </div>
  );
}

