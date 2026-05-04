"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import {
  AI_RESUME_MAJOR_OPTIONS,
  getAiResumeMajorLabel,
  normalizeAiResumeMajor,
} from "@/modules/ai/taxonomy/majors";

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

const STAGE_OPTIONS = [
  { value: "no_resume", labelKey: "ai.stage.no_resume" },
  { value: "have_resume", labelKey: "ai.stage.have_resume" },
  { value: "apply_ready", labelKey: "ai.stage.apply_ready" },
];

function AIRResumePageInner() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [major, setMajor] = useState("");
  const [stage, setStage] = useState("");

  const canContinue = major && stage;

  const handleContinue = () => {
    if (!canContinue) return;
    const params = new URLSearchParams({
      major: normalizeAiResumeMajor(major),
      stage,
    });
    router.push(`/ai-resume/upload?${params}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/home" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            ← {t("nav.back")}
          </Link>
          <div className="text-sm font-medium text-slate-700">{t("ai.title")}</div>
          <div className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs whitespace-nowrap ${
                  i === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <span className="font-bold">{i + 1}</span>
                <span>{t(step.labelKey)}</span>
              </div>
              {i < STEPS.length - 1 && <div className="h-px w-4 flex-shrink-0 bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600">
            AI Resume
          </div>
          <h1 className="mb-3 text-3xl font-bold text-slate-900">{t("ai.title")}</h1>
          <p className="mx-auto max-w-lg text-base text-slate-500">{t("ai.description")}</p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-800">{t("ai.major_direction")}</h2>

          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-slate-700">{t("ai.application_type")}</label>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl border-2 border-indigo-600 bg-indigo-50 p-4">
                <div className="text-sm font-semibold text-indigo-700">{t("ai.uk_master")}</div>
                <div className="mt-0.5 text-xs text-indigo-500">{t("ai.uk_master_desc")}</div>
              </div>
              <div className="flex-1 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-60">
                <div className="text-sm font-medium text-slate-400">{t("ai.research_master")}</div>
                <div className="mt-0.5 text-xs text-slate-300">{t("ai.research_master_desc")}</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-slate-700">{t("ai.major_direction")}</label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {AI_RESUME_MAJOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMajor(option.value)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    major === option.value
                      ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-base">{option.icon}</div>
                  <div className={`mt-1 text-sm font-medium ${major === option.value ? "text-indigo-700" : "text-slate-700"}`}>
                    {getAiResumeMajorLabel(option.value, locale)}
                  </div>
                  <div className={`mt-0.5 text-xs ${major === option.value ? "text-indigo-500" : "text-slate-400"}`}>
                    {locale === "en" ? option.zh : option.en}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-slate-700">{t("ai.current_stage")}</label>
            <div className="space-y-2">
              {STAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStage(option.value)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    stage === option.value
                      ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`text-sm font-medium ${stage === option.value ? "text-indigo-700" : "text-slate-700"}`}>
                    {t(option.labelKey)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("ai.start")}
        </button>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: "📄", titleKey: "nav.home", descKey: "home.ai_resume" },
            { icon: "🎯", titleKey: "diagnose.target_fit", descKey: "diagnose.structure" },
            { icon: "✍️", titleKey: "ai.step.optimize", descKey: "review.description" },
          ].map((feature) => (
            <div key={feature.titleKey} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div className="mb-1 text-2xl">{feature.icon}</div>
              <div className="text-sm font-medium text-slate-800">{t(feature.titleKey)}</div>
              <div className="mt-0.5 text-xs text-slate-400">{t(feature.descKey)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIRResumePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AIRResumePageInner />
    </Suspense>
  );
}
