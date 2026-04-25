export interface TimelinePreferenceValues {
  timeline_graduation_year: number | null;
  timeline_study_year: number | null;
}

export const TIMELINE_STUDY_YEAR_OPTIONS = [1, 2, 3, 4, 5] as const;

export function getStudyYearLabel(year: number, locale: "zh" | "en") {
  if (locale === "en") {
    if (year >= 5) return "Year 5+";
    return `Year ${year}`;
  }

  if (year >= 5) return "大五及以上";
  return `大${year}`;
}

export function getGraduationYearOptions(baseYear = new Date().getFullYear()) {
  return Array.from({ length: 8 }, (_, index) => baseYear - 1 + index);
}

export function buildTimelineRecommendation(
  preferences: TimelinePreferenceValues,
  locale: "zh" | "en",
  now = new Date()
) {
  const currentYear = now.getFullYear();
  const graduationYear = preferences.timeline_graduation_year;
  const studyYear = preferences.timeline_study_year;

  if (studyYear === null) {
    return {
      phase: "setup",
      title:
        locale === "en"
          ? "Choose your current year first"
          : "请先选择你的当前年级",
      description:
        locale === "en"
          ? "The timeline will be shown after your year is saved to your profile, so it does not assume you are already in Year 3 or Year 4."
          : "年级会保存到个人信息中，时间线会在保存后显示，避免默认把你当作大三或大四同学。",
    };
  }

  const yearsUntilGraduation =
    graduationYear === null ? null : graduationYear - currentYear;
  const targetIntakeYear =
    graduationYear === null ? null : graduationYear + 1;

  if (studyYear !== null && studyYear >= 4) {
    return {
      phase: "application",
      title:
        locale === "en"
          ? "You are close to application season"
          : "你已经接近正式申请阶段",
      description:
        locale === "en"
          ? `Focus on applications, language tests, and offer-related milestones for the ${targetIntakeYear ?? currentYear + 1} intake.`
          : `建议重点关注申请递交、语言成绩和 offer 后续事项，按 ${targetIntakeYear ?? currentYear + 1} 年入学节奏准备。`,
    };
  }

  if (yearsUntilGraduation !== null && yearsUntilGraduation <= 0) {
    return {
      phase: "application",
      title:
        locale === "en"
          ? "Graduation is near or already reached"
          : "你已毕业或即将毕业",
      description:
        locale === "en"
          ? `It is a good time to work through application and visa milestones for the ${targetIntakeYear ?? currentYear + 1} intake.`
          : `现在适合按 ${targetIntakeYear ?? currentYear + 1} 年入学目标推进申请与签证节点。`,
    };
  }

  if (
    studyYear === 3 ||
    (yearsUntilGraduation !== null && yearsUntilGraduation === 1)
  ) {
    return {
      phase: "preparation",
      title:
        locale === "en"
          ? "This is a strong preparation year"
          : "这一年很适合集中准备申请",
      description:
        locale === "en"
          ? "Prioritize IELTS, background polishing, recommendation planning, and early shortlist research."
          : "建议优先准备雅思、背景提升、推荐信安排和项目调研，为下一轮正式申请做准备。",
    };
  }

  return {
    phase: "preparation",
    title:
      locale === "en"
        ? "You are still in the early preparation stage"
        : "你现在更适合做前期准备",
    description:
      locale === "en"
        ? "Use the timeline to build language scores, internships, and application materials ahead of time."
        : "可以把这段时间线当作长期准备清单，提前积累语言成绩、实习经历和申请材料。",
  };
}
