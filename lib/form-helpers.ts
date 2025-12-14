import { zodResolver } from "@hookform/resolvers/zod"
import type { UseFormProps } from "react-hook-form"
import type { z } from "zod"

export function createFormConfig<T extends z.ZodType>(
  schema: T
): Omit<UseFormProps<z.infer<T>>, "defaultValues"> {
  return {
    resolver: zodResolver(schema),
    mode: "onChange",
  }
}

