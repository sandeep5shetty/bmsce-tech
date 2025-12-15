import z from "zod";

export const listSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must not exceed 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .or(z.literal("")),

  playlistLink: z
    .url("Please enter a valid URL")
    .refine(
      (url) => {
        if (!url) return true; // Allow empty for optional
        // Match youtube.com/playlist?list=PLAYLIST_ID
        const youtubePlaylistPattern =
          /^https?:\/\/(www\.)?(youtube\.com\/playlist\?list=|m\.youtube\.com\/playlist\?list=)[\w-]+/;
        return youtubePlaylistPattern.test(url);
      },
      {
        message:
          "Must be a valid YouTube playlist link (e.g., youtube.com/playlist?list=...)",
      },
    )
    .optional()
    .or(z.literal("")),
});
