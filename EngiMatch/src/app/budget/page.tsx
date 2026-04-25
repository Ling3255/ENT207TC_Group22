"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

type Region = "london" | "outside";
type Accommodation = "halls" | "private" | "custom";

interface UniversityOption {
  id: string;
  name: string;
  slug: string;
  official_domain: string;
  rank: number | null;
}

interface ProgrammeOption {
  id: string;
  programme_name: string;
  tuition_fee_overseas_gbp: number | string | null;
  university: {
    name: string;
    slug: string;
    official_domain: string;
    rank: number | null;
  };
}

const REGION_LABELS = {
  london: { zh: "伦敦", en: "London" },
  outside: { zh: "非伦敦地区", en: "Outside London" },
};

const ACCOMMODATION_LABELS = {
  halls: { zh: "学校宿舍", en: "Student halls" },
  private: { zh: "私人租房", en: "Private room" },
  custom: { zh: "自定义住宿", en: "Custom rent" },
};

const VISA_MAINTENANCE = {
  london: 1529,
  outside: 1171,
};

const LIVING_DEFAULTS = {
  london: {
    halls: 848,
    private: 750,
    bills: 140,
    groceries: 155,
    eatingOut: 110,
    social: 40,
    transport: 103,
    phone: 18,
    gym: 20,
    toiletries: 22,
    laundry: 18,
    study: 25,
    clothing: 35,
    medical: 15,
    subscriptions: 18,
  },
  outside: {
    halls: 664,
    private: 554,
    bills: 80,
    groceries: 116,
    eatingOut: 60,
    social: 20,
    transport: 54,
    phone: 18,
    gym: 15,
    toiletries: 18,
    laundry: 12,
    study: 20,
    clothing: 25,
    medical: 10,
    subscriptions: 15,
  },
};

const STORAGE_KEY = "engimatch_budget_inputs";

const LONDON_UNIVERSITY_MATCHERS = [
  "imperial college london",
  "university college london",
  "ucl",
  "king's college london",
  "kings college london",
  "queen mary university of london",
  "london school of economics",
  "city, university of london",
  "city st george",
  "brunel university london",
  "goldsmiths, university of london",
  "royal holloway, university of london",
  "birkbeck, university of london",
  "soas university of london",
  "university of east london",
  "university of west london",
  "university of greenwich",
  "university of roehampton",
  "kingston university",
  "middlesex university",
  "london south bank university",
  "university of the arts london",
  "westminster",
  "london metropolitan",
];

function currency(value: number, prefix = "£") {
  return `${prefix}${Math.round(value).toLocaleString()}`;
}

function numberOrZero(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferRegionFromUniversity(name: string): Region {
  const normalized = name.toLowerCase();
  return LONDON_UNIVERSITY_MATCHERS.some((matcher) => normalized.includes(matcher))
    ? "london"
    : "outside";
}

function programmeLabel(programme: ProgrammeOption) {
  const fee = programme.tuition_fee_overseas_gbp;
  const feeLabel = fee === null ? "fee unknown" : currency(Number(fee));
  return `${programme.university.name} - ${programme.programme_name} (${feeLabel})`;
}

export default function BudgetPage() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const [region, setRegion] = useState<Region>("outside");
  const [accommodation, setAccommodation] = useState<Accommodation>("halls");
  const [courseMonths, setCourseMonths] = useState("12");
  const [tuition, setTuition] = useState("30000");
  const [tuitionPaid, setTuitionPaid] = useState("0");
  const [scholarship, setScholarship] = useState("0");
  const [applicationFees, setApplicationFees] = useState("300");
  const [visaFee, setVisaFee] = useState("524");
  const [ihsPerYear, setIhsPerYear] = useState("776");
  const [ihsYears, setIhsYears] = useState("1");
  const [flight, setFlight] = useState("800");
  const [deposit, setDeposit] = useState("1000");
  const [emergencyFund, setEmergencyFund] = useState("1500");
  const [exchangeRate, setExchangeRate] = useState("9.2");
  const [availableFunds, setAvailableFunds] = useState("0");
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [universityLoading, setUniversityLoading] = useState(true);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [programmeLoading, setProgrammeLoading] = useState(false);

  const defaults = LIVING_DEFAULTS[region];
  const [rent, setRent] = useState(String(defaults.halls));
  const [bills, setBills] = useState("0");
  const [groceries, setGroceries] = useState(String(defaults.groceries));
  const [eatingOut, setEatingOut] = useState(String(defaults.eatingOut));
  const [social, setSocial] = useState(String(defaults.social));
  const [transport, setTransport] = useState(String(defaults.transport));
  const [phone, setPhone] = useState(String(defaults.phone));
  const [gym, setGym] = useState(String(defaults.gym));
  const [toiletries, setToiletries] = useState(String(defaults.toiletries));
  const [laundry, setLaundry] = useState(String(defaults.laundry));
  const [study, setStudy] = useState(String(defaults.study));
  const [clothing, setClothing] = useState(String(defaults.clothing));
  const [medical, setMedical] = useState(String(defaults.medical));
  const [subscriptions, setSubscriptions] = useState(String(defaults.subscriptions));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, string>;
      if (saved.region === "london" || saved.region === "outside") setRegion(saved.region);
      if (saved.accommodation === "halls" || saved.accommodation === "private" || saved.accommodation === "custom") {
        setAccommodation(saved.accommodation);
      }
      if (saved.courseMonths) setCourseMonths(saved.courseMonths);
      if (saved.tuition) setTuition(saved.tuition);
      if (saved.tuitionPaid) setTuitionPaid(saved.tuitionPaid);
      if (saved.scholarship) setScholarship(saved.scholarship);
      if (saved.applicationFees) setApplicationFees(saved.applicationFees);
      if (saved.visaFee) setVisaFee(saved.visaFee);
      if (saved.ihsPerYear) setIhsPerYear(saved.ihsPerYear);
      if (saved.ihsYears) setIhsYears(saved.ihsYears);
      if (saved.flight) setFlight(saved.flight);
      if (saved.deposit) setDeposit(saved.deposit);
      if (saved.emergencyFund) setEmergencyFund(saved.emergencyFund);
      if (saved.exchangeRate) setExchangeRate(saved.exchangeRate);
      if (saved.availableFunds) setAvailableFunds(saved.availableFunds);
      if (saved.selectedUniversityId) setSelectedUniversityId(saved.selectedUniversityId);
      if (saved.selectedProgrammeId) setSelectedProgrammeId(saved.selectedProgrammeId);
      if (saved.rent) setRent(saved.rent);
      if (saved.bills) setBills(saved.bills);
      if (saved.groceries) setGroceries(saved.groceries);
      if (saved.eatingOut) setEatingOut(saved.eatingOut);
      if (saved.social) setSocial(saved.social);
      if (saved.transport) setTransport(saved.transport);
      if (saved.phone) setPhone(saved.phone);
      if (saved.gym) setGym(saved.gym);
      if (saved.toiletries) setToiletries(saved.toiletries);
      if (saved.laundry) setLaundry(saved.laundry);
      if (saved.study) setStudy(saved.study);
      if (saved.clothing) setClothing(saved.clothing);
      if (saved.medical) setMedical(saved.medical);
      if (saved.subscriptions) setSubscriptions(saved.subscriptions);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUniversities() {
      setUniversityLoading(true);
      try {
        const response = await fetch("/api/universities");
        const payload = await response.json().catch(() => null);
        if (!cancelled) {
          setUniversities(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch {
        if (!cancelled) setUniversities([]);
      } finally {
        if (!cancelled) setUniversityLoading(false);
      }
    }

    loadUniversities();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProgrammes() {
      if (!selectedUniversityId) {
        if (!cancelled) {
          setProgrammes([]);
          setProgrammeLoading(false);
        }
        return;
      }
      setProgrammeLoading(true);
      try {
        const response = await fetch(
          `/api/programmes?universityId=${encodeURIComponent(selectedUniversityId)}`
        );
        const payload = await response.json().catch(() => null);
        if (!cancelled) {
          setProgrammes(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch {
        if (!cancelled) setProgrammes([]);
      } finally {
        if (!cancelled) setProgrammeLoading(false);
      }
    }

    loadProgrammes();
    return () => {
      cancelled = true;
    };
  }, [selectedUniversityId]);

  useEffect(() => {
    if (accommodation === "custom") return;
    setRent(String(accommodation === "halls" ? defaults.halls : defaults.private));
    setBills(String(accommodation === "halls" ? 0 : defaults.bills));
    setGroceries(String(defaults.groceries));
    setEatingOut(String(defaults.eatingOut));
    setSocial(String(defaults.social));
    setTransport(String(defaults.transport));
    setPhone(String(defaults.phone));
    setGym(String(defaults.gym));
    setToiletries(String(defaults.toiletries));
    setLaundry(String(defaults.laundry));
    setStudy(String(defaults.study));
    setClothing(String(defaults.clothing));
    setMedical(String(defaults.medical));
    setSubscriptions(String(defaults.subscriptions));
  }, [accommodation, defaults]);

  useEffect(() => {
    const values = {
      region,
      accommodation,
      courseMonths,
      tuition,
      tuitionPaid,
      scholarship,
      applicationFees,
      visaFee,
      ihsPerYear,
      ihsYears,
      flight,
      deposit,
      emergencyFund,
      exchangeRate,
      availableFunds,
      selectedUniversityId,
      selectedProgrammeId,
      rent,
      bills,
      groceries,
      eatingOut,
      social,
      transport,
      phone,
      gym,
      toiletries,
      laundry,
      study,
      clothing,
      medical,
      subscriptions,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [
    region,
    accommodation,
    courseMonths,
    tuition,
    tuitionPaid,
    scholarship,
    applicationFees,
    visaFee,
    ihsPerYear,
    ihsYears,
    flight,
    deposit,
    emergencyFund,
    exchangeRate,
    availableFunds,
    rent,
    selectedUniversityId,
    selectedProgrammeId,
    bills,
    groceries,
    eatingOut,
    social,
    transport,
    phone,
    gym,
    toiletries,
    laundry,
    study,
    clothing,
    medical,
    subscriptions,
  ]);

  const selectedProgramme = useMemo(
    () => programmes.find((programme) => programme.id === selectedProgrammeId) ?? null,
    [programmes, selectedProgrammeId]
  );

  function handleUniversityChange(universityId: string) {
    setSelectedUniversityId(universityId);
    setSelectedProgrammeId("");
    setProgrammes([]);
  }

  function handleProgrammeChange(programmeId: string) {
    setSelectedProgrammeId(programmeId);
    const programme = programmes.find((item) => item.id === programmeId);
    if (!programme) return;

    const overseasFee = programme.tuition_fee_overseas_gbp;
    if (overseasFee !== null && overseasFee !== undefined) {
      setTuition(String(Math.round(Number(overseasFee))));
    }

    setRegion(inferRegionFromUniversity(programme.university.name));
  }

  const result = useMemo(() => {
    const months = Math.max(1, numberOrZero(courseMonths));
    const visaMonths = Math.min(9, months);
    const monthlyLiving =
      numberOrZero(rent) +
      numberOrZero(bills) +
      numberOrZero(groceries) +
      numberOrZero(eatingOut) +
      numberOrZero(social) +
      numberOrZero(transport) +
      numberOrZero(phone) +
      numberOrZero(gym) +
      numberOrZero(toiletries) +
      numberOrZero(laundry) +
      numberOrZero(study) +
      numberOrZero(clothing) +
      numberOrZero(medical) +
      numberOrZero(subscriptions);
    const tuitionAfterAid = Math.max(
      0,
      numberOrZero(tuition) - numberOrZero(scholarship)
    );
    const outstandingTuition = Math.max(
      0,
      tuitionAfterAid - numberOrZero(tuitionPaid)
    );
    const visaMaintenance = VISA_MAINTENANCE[region] * visaMonths;
    const visaProof = outstandingTuition + visaMaintenance;
    const ihsTotal = numberOrZero(ihsPerYear) * Math.max(0, numberOrZero(ihsYears));
    const livingTotal = monthlyLiving * months;
    const oneOffTotal =
      numberOrZero(applicationFees) +
      numberOrZero(visaFee) +
      ihsTotal +
      numberOrZero(flight) +
      numberOrZero(deposit) +
      numberOrZero(emergencyFund);
    const grandTotal = tuitionAfterAid + livingTotal + oneOffTotal;
    const fundsGap = Math.max(0, grandTotal - numberOrZero(availableFunds));
    const rate = Math.max(0, numberOrZero(exchangeRate));

    return {
      months,
      visaMonths,
      monthlyLiving,
      tuitionAfterAid,
      outstandingTuition,
      visaMaintenance,
      visaProof,
      ihsTotal,
      livingTotal,
      oneOffTotal,
      grandTotal,
      fundsGap,
      rate,
      cnyTotal: grandTotal * rate,
      cnyVisaProof: visaProof * rate,
    };
  }, [
    availableFunds,
    applicationFees,
    bills,
    courseMonths,
    deposit,
    emergencyFund,
    exchangeRate,
    flight,
    groceries,
    gym,
    ihsPerYear,
    ihsYears,
      phone,
      region,
      rent,
      scholarship,
      eatingOut,
      social,
      transport,
      tuition,
      tuitionPaid,
      toiletries,
      laundry,
      study,
      clothing,
      medical,
      subscriptions,
      visaFee,
  ]);

  const savingsPlan = useMemo(() => {
    const sixMonths = Math.ceil(result.grandTotal / 6);
    const twelveMonths = Math.ceil(result.grandTotal / 12);
    const eighteenMonths = Math.ceil(result.grandTotal / 18);
    const gapSixMonths = Math.ceil(result.fundsGap / 6);
    const gapTwelveMonths = Math.ceil(result.fundsGap / 12);

    return {
      sixMonths,
      twelveMonths,
      eighteenMonths,
      gapSixMonths,
      gapTwelveMonths,
      cnySixMonths: Math.ceil(sixMonths * result.rate),
      cnyTwelveMonths: Math.ceil(twelveMonths * result.rate),
      cnyGapSixMonths: Math.ceil(gapSixMonths * result.rate),
      cnyGapTwelveMonths: Math.ceil(gapTwelveMonths * result.rate),
    };
  }, [result.fundsGap, result.grandTotal, result.rate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/home" className="text-sm text-slate-500 hover:text-slate-800">
            {isEnglish ? "Back to Home" : "返回首页"}
          </Link>
          <div className="text-sm font-medium text-slate-700">
            {isEnglish ? "Budget Planner" : "费用预算器"}
          </div>
          <div className="w-20" />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            {isEnglish ? "UK Study Budget Planner" : "英国留学费用预算器"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {isEnglish
              ? "Estimate both your visa financial proof and your real study budget. All defaults are editable, because university fees, accommodation and exchange rates vary."
              : "同时估算签证资金证明和真实留学总预算。所有默认值都可以修改，因为学费、住宿和汇率都会因学校与个人情况变化。"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-5">
            <Panel title={isEnglish ? "Study Basics" : "学习与地区"}>
              <div className="mb-4 space-y-4">
                <SelectInput
                  label={isEnglish ? "Choose university" : "选择学校"}
                  value={selectedUniversityId}
                  onChange={handleUniversityChange}
                  options={[
                    {
                      value: "",
                      label: universityLoading
                        ? isEnglish
                          ? "Loading universities..."
                          : "正在加载学校..."
                        : isEnglish
                          ? "Manual entry / not decided yet"
                          : "手动填写 / 暂未确定",
                    },
                    ...universities.map((u) => ({
                      value: u.id,
                      label: u.rank ? `${u.name} (Rank ${u.rank})` : u.name,
                    })),
                  ]}
                />
                {selectedUniversityId && (
                  <SelectInput
                    label={isEnglish ? "Choose programme" : "选择专业"}
                    value={selectedProgrammeId}
                    onChange={handleProgrammeChange}
                    options={[
                      {
                        value: "",
                        label: programmeLoading
                          ? isEnglish
                            ? "Loading programmes..."
                            : "正在加载专业..."
                          : isEnglish
                            ? "Please select a programme"
                            : "请选择专业",
                      },
                      ...programmes.map((programme) => ({
                        value: programme.id,
                        label: programmeLabel(programme),
                      })),
                    ]}
                  />
                )}
                {selectedProgramme && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {isEnglish
                      ? `Selected ${selectedProgramme.university.name}. Tuition and study location have been matched automatically; you can still edit them below.`
                      : `已选择 ${selectedProgramme.university.name}，系统已自动匹配学费和伦敦/非伦敦地区，下方仍可手动修改。`}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SelectInput
                  label={isEnglish ? "Study location" : "学习地区"}
                  value={region}
                  onChange={(value) => setRegion(value as Region)}
                  options={Object.entries(REGION_LABELS).map(([value, label]) => ({
                    value,
                    label: isEnglish ? label.en : label.zh,
                  }))}
                />
                <SelectInput
                  label={isEnglish ? "Accommodation" : "住宿类型"}
                  value={accommodation}
                  onChange={(value) => setAccommodation(value as Accommodation)}
                  options={Object.entries(ACCOMMODATION_LABELS).map(([value, label]) => ({
                    value,
                    label: isEnglish ? label.en : label.zh,
                  }))}
                />
                <MoneyInput
                  label={isEnglish ? "Course months" : "课程月数"}
                  value={courseMonths}
                  onChange={setCourseMonths}
                  prefix=""
                />
              </div>
            </Panel>

            <Panel title={isEnglish ? "Tuition & One-Off Costs" : "学费与一次性费用"}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MoneyInput label={isEnglish ? "Tuition fee" : "学费"} value={tuition} onChange={setTuition} />
                <MoneyInput label={isEnglish ? "Scholarship" : "奖学金减免"} value={scholarship} onChange={setScholarship} />
                <MoneyInput label={isEnglish ? "Tuition already paid" : "已支付学费/押金"} value={tuitionPaid} onChange={setTuitionPaid} />
                <MoneyInput label={isEnglish ? "Application fees" : "申请费合计"} value={applicationFees} onChange={setApplicationFees} />
                <MoneyInput label={isEnglish ? "Visa fee" : "学生签证费"} value={visaFee} onChange={setVisaFee} />
                <MoneyInput label={isEnglish ? "IHS per year" : "IHS 每年"} value={ihsPerYear} onChange={setIhsPerYear} />
                <MoneyInput label={isEnglish ? "IHS years" : "IHS 年数"} value={ihsYears} onChange={setIhsYears} prefix="" />
                <MoneyInput label={isEnglish ? "Flight" : "机票"} value={flight} onChange={setFlight} />
                <MoneyInput label={isEnglish ? "Accommodation deposit" : "住宿押金"} value={deposit} onChange={setDeposit} />
              </div>
            </Panel>

            <Panel title={isEnglish ? "Monthly Living Costs" : "每月生活费"}>
              <div className="mb-4 rounded-lg bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                {isEnglish
                  ? "Split your monthly spending as finely as possible. This will make the budget more useful for real family planning or for students saving up by themselves."
                  : "尽量把每月开销拆细，这样预算更适合家长做资金安排，也更适合同学自己做攒钱计划。"}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <MoneyInput label={isEnglish ? "Rent" : "住宿"} value={rent} onChange={setRent} />
                <MoneyInput label={isEnglish ? "Bills" : "水电网等账单"} value={bills} onChange={setBills} />
                <MoneyInput label={isEnglish ? "Groceries" : "自己做饭买菜"} value={groceries} onChange={setGroceries} />
                <MoneyInput label={isEnglish ? "Eating out / takeaway" : "外食 / 外卖"} value={eatingOut} onChange={setEatingOut} />
                <MoneyInput label={isEnglish ? "Social / entertainment" : "社交娱乐"} value={social} onChange={setSocial} />
                <MoneyInput label={isEnglish ? "Transport" : "交通"} value={transport} onChange={setTransport} />
                <MoneyInput label={isEnglish ? "Phone" : "手机"} value={phone} onChange={setPhone} />
                <MoneyInput label={isEnglish ? "Gym" : "健身/运动"} value={gym} onChange={setGym} />
                <MoneyInput label={isEnglish ? "Toiletries" : "洗护日用品"} value={toiletries} onChange={setToiletries} />
                <MoneyInput label={isEnglish ? "Laundry" : "洗衣"} value={laundry} onChange={setLaundry} />
                <MoneyInput label={isEnglish ? "Study materials" : "学习材料"} value={study} onChange={setStudy} />
                <MoneyInput label={isEnglish ? "Clothing" : "服饰保暖"} value={clothing} onChange={setClothing} />
                <MoneyInput label={isEnglish ? "Medical / pharmacy" : "常备药 / 医疗零支出"} value={medical} onChange={setMedical} />
                <MoneyInput label={isEnglish ? "Subscriptions" : "软件订阅 / 流媒体"} value={subscriptions} onChange={setSubscriptions} />
              </div>
            </Panel>

            <Panel title={isEnglish ? "Emergency & Buffer" : "应急与缓冲资金"}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MoneyInput label={isEnglish ? "Emergency fund" : "应急金"} value={emergencyFund} onChange={setEmergencyFund} />
                <MoneyInput label={isEnglish ? "Available funds" : "当前可用资金"} value={availableFunds} onChange={setAvailableFunds} />
              </div>
            </Panel>

            <Panel title={isEnglish ? "Funding Check" : "资金缺口检查"}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                <MoneyInput label={isEnglish ? "GBP to CNY rate" : "英镑兑人民币估算汇率"} value={exchangeRate} onChange={setExchangeRate} prefix="" step="0.01" />
              </div>
            </Panel>
          </section>

          <aside className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                {isEnglish ? "Estimated total budget" : "预计总预算"}
              </div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {currency(result.grandTotal)}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                ≈ ¥{Math.round(result.cnyTotal).toLocaleString()}
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <BreakdownRow label={isEnglish ? "Tuition after aid" : "奖学金后学费"} value={result.tuitionAfterAid} rate={result.rate} />
                <BreakdownRow label={isEnglish ? "Living costs" : "生活费合计"} value={result.livingTotal} rate={result.rate} />
                <BreakdownRow label={isEnglish ? "One-off costs" : "一次性费用"} value={result.oneOffTotal} rate={result.rate} />
                <BreakdownRow label={isEnglish ? "Monthly living" : "每月生活费"} value={result.monthlyLiving} rate={result.rate} />
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="text-sm font-semibold text-emerald-950">
                {isEnglish ? "Monthly living cost" : "每月生活费"}
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-950">
                {currency(result.monthlyLiving)}
              </div>
              <div className="mt-1 text-sm text-emerald-800">
                ≈ {currency(result.monthlyLiving * result.rate, "¥")}
              </div>
              <p className="mt-3 text-xs leading-5 text-emerald-900">
                {isEnglish
                  ? "This is your estimated monthly spending in the UK, based on rent, bills, groceries, transport and daily lifestyle costs."
                  : "这是你在英国每个月的大致开销，按住宿、账单、饮食、交通和日常生活费用估算。"}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <BreakdownRow label={isEnglish ? "Housing + bills" : "住宿与账单"} value={numberOrZero(rent) + numberOrZero(bills)} rate={result.rate} />
                <BreakdownRow label={isEnglish ? "Food" : "饮食"} value={numberOrZero(groceries) + numberOrZero(eatingOut)} rate={result.rate} />
                <BreakdownRow label={isEnglish ? "Daily life" : "日常生活"} value={numberOrZero(phone) + numberOrZero(toiletries) + numberOrZero(laundry) + numberOrZero(subscriptions)} rate={result.rate} />
                <BreakdownRow label={isEnglish ? "Study + clothing + health" : "学习、衣物与健康"} value={numberOrZero(study) + numberOrZero(clothing) + numberOrZero(medical)} rate={result.rate} />
              </div>
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
              <div className="text-sm font-semibold text-indigo-900">
                {isEnglish ? "Visa financial proof estimate" : "签证资金证明估算"}
              </div>
              <div className="mt-2 text-2xl font-bold text-indigo-950">
                {currency(result.visaProof)}
              </div>
              <div className="mt-1 text-sm text-indigo-700">
                ≈ ¥{Math.round(result.cnyVisaProof).toLocaleString()}
              </div>
              <div className="mt-4 space-y-2 text-sm text-indigo-900">
                <BreakdownRow label={isEnglish ? "Outstanding tuition" : "未支付学费"} value={result.outstandingTuition} rate={result.rate} />
                <BreakdownRow label={`${isEnglish ? "Maintenance" : "生活费证明"} (${result.visaMonths} ${isEnglish ? "months" : "个月"})`} value={result.visaMaintenance} rate={result.rate} />
              </div>
              <p className="mt-4 text-xs leading-5 text-indigo-700">
                {isEnglish
                  ? "Visa proof rules use outstanding tuition plus official maintenance for up to 9 months. Keep funds for 28 consecutive days before applying."
                  : "签证资金证明通常按未支付学费 + 官方生活费标准计算，最多按 9 个月生活费。递签前需连续存满 28 天。"}
              </p>
              <div className="mt-4 rounded-lg bg-white/70 p-3 text-xs leading-5 text-indigo-950">
                {isEnglish
                  ? "What it means: this is the minimum amount of money the UK government usually wants you to show in your bank account when applying for a student visa. It is for visa review, not the same thing as your full real-life budget."
                  : "这是什么意思：它通常是英国政府要求你在申请学生签证时，银行账户里需要证明拥有的最低资金。它是递签审核用的金额，不等于你真实留学全过程会花掉的总预算。"}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-900">
                {isEnglish ? "Funding gap" : "资金缺口"}
              </div>
              <div className={`mt-2 text-2xl font-bold ${result.fundsGap > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {result.fundsGap > 0
                  ? currency(result.fundsGap)
                  : isEnglish
                    ? "Covered"
                    : "资金已覆盖"}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {isEnglish
                  ? "This compares your available funds with the real total budget, not only visa proof."
                  : "这里比较的是当前可用资金与真实总预算，不只是签证资金证明。"}
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <div className="text-sm font-semibold text-amber-950">
                {isEnglish ? "RMB estimate" : "人民币估算"}
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <BreakdownRow label={isEnglish ? "Total budget in CNY" : "总预算折合人民币"} value={result.cnyTotal} prefix="¥" />
                <BreakdownRow label={isEnglish ? "Visa proof in CNY" : "签证资金证明折合人民币"} value={result.cnyVisaProof} prefix="¥" />
              </div>
              <p className="mt-3 text-xs leading-5 text-amber-800">
                {isEnglish
                  ? `Calculated with exchange rate ${result.rate.toFixed(2)} CNY per GBP.`
                  : `按 1 英镑 = ${result.rate.toFixed(2)} 人民币估算。`}
              </p>
            </div>

            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
              <div className="text-sm font-semibold text-rose-950">
                {isEnglish ? "Saving advice" : "资金准备建议"}
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <BreakdownRow label={isEnglish ? "Save per month for 6 months" : "6个月准备，每月需存"} value={savingsPlan.sixMonths} rate={result.rate} />
                <BreakdownRow label={isEnglish ? "Save per month for 12 months" : "12个月准备，每月需存"} value={savingsPlan.twelveMonths} rate={result.rate} />
                <BreakdownRow label={isEnglish ? "Save per month for 18 months" : "18个月准备，每月需存"} value={savingsPlan.eighteenMonths} rate={result.rate} />
              </div>
              <div className="mt-4 rounded-lg bg-white/70 p-3 text-xs leading-6 text-rose-950">
                {result.fundsGap > 0
                  ? isEnglish
                    ? `Current funding gap: ${currency(result.fundsGap)}. If family will support you, it is usually easier to split preparation into tuition, visa-proof funds, and landing buffer separately. If you are saving by yourself, target about ${currency(savingsPlan.gapTwelveMonths)} per month for the missing part over 12 months.`
                    : `当前资金缺口为 ${currency(result.fundsGap)}。如果主要由家长支持，通常更适合把资金拆成“学费”“签证资金证明”“落地缓冲金”三部分分别准备；如果主要靠自己攒钱，按 12 个月准备的话，建议把缺口部分拆成每月约 ${currency(savingsPlan.gapTwelveMonths)} 的存款目标。`
                  : isEnglish
                    ? "Your current funds already cover the estimated budget. A practical approach is to keep tuition, visa-proof funds, and daily spending in separate buckets so the money is easier to manage."
                    : "当前可用资金已经覆盖估算总预算。更稳妥的做法是把学费、签证资金证明、以及日常生活费分开管理，这样更方便家长安排打款，也更不容易把生活费提前花掉。"}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 text-xs leading-5 text-slate-500">
              <div className="mb-2 font-semibold text-slate-800">
                {isEnglish ? "Default data sources" : "默认数据来源"}
              </div>
              <a className="block text-indigo-600 hover:underline" href="https://www.gov.uk/student-visa/money" target="_blank" rel="noreferrer">
                GOV.UK Student visa money requirement
              </a>
              <a className="mt-1 block text-indigo-600 hover:underline" href="https://study-uk.britishcouncil.org/moving-uk/cost-studying" target="_blank" rel="noreferrer">
                British Council Study UK cost guide
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
  prefix = "£",
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-indigo-500">
        {prefix && (
          <span className="flex items-center border-r border-slate-200 px-3 text-sm text-slate-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none"
        />
      </div>
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BreakdownRow({
  label,
  value,
  rate,
  prefix = "£",
}: {
  label: string;
  value: number;
  rate?: number;
  prefix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <div className="text-right">
        <div className="font-semibold text-slate-900">{currency(value, prefix)}</div>
        {rate !== undefined && prefix === "£" && (
          <div className="text-xs text-slate-400">{currency(value * rate, "¥")}</div>
        )}
      </div>
    </div>
  );
}
