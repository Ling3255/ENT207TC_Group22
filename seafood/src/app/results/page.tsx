'use client'
import { useEffect, useState } from 'react'
import { EligibilityStatus } from '@prisma/client'

interface Result {
  program: {
    id: number
    universityName: string
    programName: string
    department: string
    duration: string
  }
  status: EligibilityStatus
  score: number
  missingRequirements: string[]
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('evaluationResults')
    if (saved) {
      setResults(JSON.parse(saved))
    }
  }, [])

  const getStatusBadge = (status: EligibilityStatus) => {
    switch (status) {
      case EligibilityStatus.ELIGIBLE:
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✅ 符合要求</span>
      case EligibilityStatus.BORDERLINE:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">⚠️ 可以冲刺</span>
      case EligibilityStatus.NOT_ELIGIBLE:
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">❌ 暂不符合</span>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">暂无评估结果，请先提交您的信息</p>
          <a href="/" className="text-blue-600 hover:underline">返回首页</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🎯 评估结果</h1>
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            重新评估
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {results.map((result, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {result.program.universityName} · {result.program.programName}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {result.program.department} · {result.program.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(result.score)}'>
                      {result.score}分
                    </div>
                    <div className="mt-1">{getStatusBadge(result.status)}</div>
                  </div>
                </div>

                {result.missingRequirements.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">需要注意的问题：</h3>
                    <ul className="space-y-1">
                      {result.missingRequirements.map((req, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">ℹ️ 说明</h3>
          <p className="text-sm text-blue-700">
            本评估结果仅供参考，具体录取结果以学校官方审核为准。borderline项目如果有优秀的软背景（科研、实习等）可以尝试申请。
          </p>
        </div>
      </div>
    </div>
  )
}
