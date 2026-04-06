'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EnglishType } from '@prisma/client'

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    gpa: '',
    major: '',
    university: '',
    englishType: EnglishType.IELTS,
    englishScores: {
      overall: '',
      listening: '',
      reading: '',
      writing: '',
      speaking: ''
    },
    modules: [{ name: '', score: '', credit: '' }]
  })
  const [loading, setLoading] = useState(false)

  const addModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, { name: '', score: '', credit: '' }]
    })
  }

  const removeModule = (index: number) => {
    setFormData({
      ...formData,
      modules: formData.modules.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        gpa: parseFloat(formData.gpa),
        englishScores: {
          overall: parseFloat(formData.englishScores.overall),
          listening: parseFloat(formData.englishScores.listening),
          reading: parseFloat(formData.englishScores.reading),
          writing: parseFloat(formData.englishScores.writing),
          speaking: parseFloat(formData.englishScores.speaking)
        },
        modules: formData.modules.map(m => ({
          name: m.name,
          score: parseFloat(m.score),
          credit: parseFloat(m.credit)
        }))
      }

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        localStorage.setItem('evaluationResults', JSON.stringify(data.results))
        router.push('/results')
      } else {
        alert('提交失败，请检查填写信息')
      }
    } catch (error) {
      alert('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
          🇬🇧 英国工程硕士申请评估
        </h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">基本信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">百分制GPA</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.gpa}
                  onChange={e => setFormData({...formData, gpa: e.target.value})}
                  placeholder="比如 85.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">本科专业</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.major}
                  onChange={e => setFormData({...formData, major: e.target.value})}
                  placeholder="比如 机械工程"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">本科院校</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.university}
                  onChange={e => setFormData({...formData, university: e.target.value})}
                  placeholder="比如 上海交通大学"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">英语考试类型</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.englishType}
                  onChange={e => setFormData({...formData, englishType: e.target.value as EnglishType})}
                >
                  <option value={EnglishType.IELTS}>雅思</option>
                  <option value={EnglishType.TOEFL}>托福</option>
                  <option value={EnglishType.PTE}>PTE</option>
                </select>
              </div>
            </div>
          </div>

          {/* 英语成绩 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">英语成绩</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总分</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.englishScores.overall}
                  onChange={e => setFormData({
                    ...formData,
                    englishScores: {...formData.englishScores, overall: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">听力</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.englishScores.listening}
                  onChange={e => setFormData({
                    ...formData,
                    englishScores: {...formData.englishScores, listening: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">阅读</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.englishScores.reading}
                  onChange={e => setFormData({
                    ...formData,
                    englishScores: {...formData.englishScores, reading: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">写作</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.englishScores.writing}
                  onChange={e => setFormData({
                    ...formData,
                    englishScores: {...formData.englishScores, writing: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">口语</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.englishScores.speaking}
                  onChange={e => setFormData({
                    ...formData,
                    englishScores: {...formData.englishScores, speaking: e.target.value}
                  })}
                />
              </div>
            </div>
          </div>

          {/* 已修课程 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">已修核心课程</h2>
              <button
                type="button"
                onClick={addModule}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                + 添加课程
              </button>
            </div>
            {formData.modules.map((module, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={module.name}
                    onChange={e => {
                      const newModules = [...formData.modules]
                      newModules[index].name = e.target.value
                      setFormData({...formData, modules: newModules})
                    }}
                    placeholder="比如 高等数学"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分数</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={module.score}
                    onChange={e => {
                      const newModules = [...formData.modules]
                      newModules[index].score = e.target.value
                      setFormData({...formData, modules: newModules})
                    }}
                    placeholder="85"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">学分</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={module.credit}
                      onChange={e => {
                        const newModules = [...formData.modules]
                        newModules[index].credit = e.target.value
                        setFormData({...formData, modules: newModules})
                      }}
                      placeholder="4"
                    />
                  </div>
                  {formData.modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg h-[42px] hover:bg-red-700"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '评估中...' : '开始评估'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <a href="/admin" className="text-blue-600 hover:underline">管理员入口</a>
        </div>
      </div>
    </div>
  )
}
