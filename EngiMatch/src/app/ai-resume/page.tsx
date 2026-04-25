"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

const MAJOR_OPTIONS = [
  { value: "mechanical", label: "机械工程 / Mechanical", icon: "⚙️" },
  { value: "electrical", label: "电气工程 / Electrical", icon: "⚡" },
  { value: "electronic", label: "电子信息 / Electronic", icon: "📡" },
  { value: "control", label: "控制科学与工程 / Control", icon: "🎛️" },
  { value: "energy", label: "能源与动力 / Energy", icon: "🔥" },
  { value: "materials", label: "材料工程 / Materials", icon: "🔩" },
  { value: "civil", label: "土木工程 / Civil", icon: "🏗️" },
  { value: "computer", label: "计算机 / AI / Computer", icon: "💻" },
  { value: "automotive", label: "车辆工程 / Automotive", icon: "🚗" },
  { value: "aerospace", label: "航空航天 / Aerospace", icon: "✈️" },
  { value: "chemical", label: "化学工程 / Chemical", icon: "🧪" },
  { value: "other", label: "其他 / Other", icon: "🔧" },
];

const STAGE_OPTIONS = [
  { value: "no_resume", labelKey: "ai.stage.no_resume" },
  { value: "have_resume", labelKey: "ai.stage.have_resume" },
  { value: "apply_ready", labelKey: "ai.stage.apply_ready" },
];

export default function AIRResumePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [major, setMajor] = useState("");
  const [stage, setStage] = useState("");

  const canContinue = major && stage;

  const handleContinue = () => {
    if (!canContinue) return;
    const params = new URLSearchParams({ major, stage });
    router.push(`/ai-resume/upload?${params}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
            ← {t("nav.back")}
          </Link>
          <div className="text-sm font-medium text-slate-700">{t("ai.title")}</div>
          <div className="w-16" />
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs whitespace-nowrap ${i === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                <span className="font-bold">{i + 1}</span>
                <span>{t(step.labelKey)}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-200 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium mb-4">
            ✦ {t("ai.subtitle")}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">{t("ai.title")}</h1>
          <p className="text-slate-500 text-base max-w-lg mx-auto">
            {t("ai.description")}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">{t("ai.major_direction")}</h2>

          {/* Application type - fixed */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">{t("ai.application_type")}</label>
            <div className="flex gap-3">
              <div className="flex-1 p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50">
                <div className="text-sm font-semibold text-indigo-700">{t("ai.uk_master")}</div>
                <div className="text-xs text-indigo-500 mt-0.5">{t("ai.uk_master_desc")}</div>
              </div>
              <div className="flex-1 p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed">
                <div className="text-sm font-medium text-slate-400">{t("ai.research_master")}</div>
                <div className="text-xs text-slate-300 mt-0.5">{t("ai.research_master_desc")}</div>
              </div>
            </div>
          </div>

          {/* Major direction */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">{t("ai.major_direction")}</label>
            <div className="grid grid-cols-3 gap-2">
              {MAJOR_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setMajor(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    major === opt.value
                      ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-base">{opt.icon}</div>
                  <div className={`text-sm font-medium mt-1 ${major === opt.value ? "text-indigo-700" : "text-slate-700"}`}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stage */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">{t("ai.current_stage")}</label>
            <div className="space-y-2">
              {STAGE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setStage(opt.value)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    stage === opt.value
                      ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`text-sm font-medium ${stage === opt.value ? "text-indigo-700" : "text-slate-700"}`}>{t(opt.labelKey)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full py-4 rounded-xl font-semibold text-white text-base transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("ai.start")}
        </button>

        {/* Features preview */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: "📄", titleKey: "nav.home", descKey: "home.ai_resume" },
            { icon: "🔍", titleKey: "diagnose.target_fit", descKey: "diagnose.structure" },
            { icon: "✏️", titleKey: "ai.step.optimize", descKey: "review.description" },
          ].map((f) => (
            <div key={f.titleKey} className="text-center p-4 bg-white rounded-xl border border-slate-200">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-sm font-medium text-slate-800">{t(f.titleKey)}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t(f.descKey)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
