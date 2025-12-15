import z from "zod";

import { listSchema } from "./validation";

export type List = z.infer<typeof listSchema>;
