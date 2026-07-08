import z from "zod";


export const ViewManagerRuntimeShape = z.object({
 // TODO
});

export const ViewManagerRuntimeSchema = ViewManagerRuntimeShape.extend({
});

export type ViewManagerRuntime = z.infer<typeof ViewManagerRuntimeSchema>;
export type ViewManagerRuntimeInput = z.input<typeof ViewManagerRuntimeSchema>;
