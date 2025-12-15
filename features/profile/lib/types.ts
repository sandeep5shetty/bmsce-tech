import z from "zod";

import { editProfileSchema } from "./validation";

export type EditProfile = z.infer<typeof editProfileSchema>;
