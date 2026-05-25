import { describe, expect, it } from "vitest";
import { resolveMediaUrl } from "./realContent";

describe("resolveMediaUrl", () => {
  it("converts relative real-content paths to public storage URLs", () => {
    expect(resolveMediaUrl("/real-content/Designs/students cafe/cover.webp")).toBe(
      "https://lnzxissivnzpjvvxulvc.supabase.co/storage/v1/object/public/real-content/Designs/u_c3R1ZGVudHMgY2FmZQ/cover.webp"
    );
  });

  it("normalizes full real-content storage URLs with raw path segments", () => {
    expect(
      resolveMediaUrl(
        "https://lnzxissivnzpjvvxulvc.supabase.co/storage/v1/object/public/real-content/Finishing%20videos/%D8%B4%D9%82%D8%A9%20%D9%85%D9%88%D8%AF%D8%B1%D9%86-thumb.webp"
      )
    ).toBe(
      "https://lnzxissivnzpjvvxulvc.supabase.co/storage/v1/object/public/real-content/u_RmluaXNoaW5nIHZpZGVvcw/u_2LTZgtipINmF2YjYr9ix2YYtdGh1bWIud2VicA"
    );
  });
});
