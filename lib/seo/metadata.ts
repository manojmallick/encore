import type { Metadata } from "next";

export function baseMetadata(
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
): Metadata {
  return {
    title: "Encore — From practice to published",
    description:
      "Plan difficult song sections, track recording readiness, and publish the story behind your cover.",
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "Encore — From practice to published",
      description:
        "Plan difficult song sections, track recording readiness, and publish the story behind your cover.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}
