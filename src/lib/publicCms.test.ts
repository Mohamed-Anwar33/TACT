import { describe, expect, it } from "vitest";
import {
  countProjectsByRange,
  formatAreaValue,
  getAreaRangeForValue,
  getDefaultAreaForRange,
  getProjectPreviewMedia,
  type CmsAreaRange,
} from "./publicCms";

const ranges: CmsAreaRange[] = [
  { id: "small", titleAr: "أقل من 150 م²", titleEn: "Less than 150 m²", min: 0, max: 149 },
  { id: "medium", titleAr: "من 150 إلى 200 م²", titleEn: "150 to 200 m²", min: 150, max: 200 },
  { id: "large", titleAr: "أكبر من 300 م²", titleEn: "More than 300 m²", min: 301, max: null },
];

describe("portfolio area ranges", () => {
  it("classifies boundary values into the expected configured ranges", () => {
    expect(getAreaRangeForValue("149 m²", ranges)?.id).toBe("small");
    expect(getAreaRangeForValue("150 m²", ranges)?.id).toBe("medium");
    expect(getAreaRangeForValue("301 m²", ranges)?.id).toBe("large");
  });

  it("recalculates counts from changed range limits without project changes", () => {
    const projects = [
      { area: "149 m²", project_kind: "design" },
      { area: "150 m²", project_kind: "design" },
      { area: "301 m²", project_kind: "design" },
      { area: "180 m²", project_kind: "execution", video_url: "video.mp4" },
    ];

    expect(countProjectsByRange(projects, ranges)).toMatchObject({
      small: 1,
      medium: 1,
      large: 1,
    });

    expect(
      countProjectsByRange(projects, [
        { id: "compact", titleAr: "حتى 150 م²", titleEn: "Up to 150 m²", min: 0, max: 150 },
        { id: "large", titleAr: "أكبر من 300 م²", titleEn: "More than 300 m²", min: 301, max: null },
      ])
    ).toMatchObject({
      compact: 2,
      large: 1,
    });
  });

  it("formats and defaults new project area values from the chosen range", () => {
    expect(formatAreaValue("150")).toBe("150 م²");
    expect(getDefaultAreaForRange(ranges[1])).toBe("150 م²");
    expect(getDefaultAreaForRange(ranges[2])).toBe("301 م²");
  });
});

describe("project preview media", () => {
  it("uses gallery images or videos when a project has no cover", () => {
    expect(
      getProjectPreviewMedia({
        mediaItems: [{ media_type: "image", role: "gallery", url: "/real-content/projects/gallery.webp" }],
      })
    ).toMatchObject({ type: "image", url: expect.stringContaining("gallery.webp") });

    expect(
      getProjectPreviewMedia({
        video_url: "/real-content/projects/walkthrough.mp4",
      })
    ).toMatchObject({ type: "video", url: expect.stringContaining("walkthrough.mp4") });
  });
});
