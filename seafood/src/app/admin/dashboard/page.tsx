'use client'
import { useEffect, useState } from 'react'
import { Program, Requirement } from '@prisma/client'

export default function AdminDashboardPage() {
  const [programs, setPrograms] = useState<(Program & { requirements: Requirement[] })[]>([])
  const [editingProgram, setEditingProgram] = useState<(Program & { requirements: Requirement[] }) | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      window.location.href = '/admin'
      return
    }
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/admin/programs')
      const data = await res.json()
      if (data.success) {
        setPrograms(data.programs)
      }
    } catch (error) {
      alert('获取项目列表失败')
    }
  }

  const saveProgram = async () => {
    if (!editingProgram) return
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProgram)
      })
      const data = await res.json()
      if (data.success) {
        alert('保存成功')
        setEditingProgram(null)
        fetchPrograms()
      } else {
        alert('保存失败')
      }
    } catch (error) {
      alert('网络错误')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">管理员控制台</h1>
          <div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mr-2"
            >
              返回首页
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken')
                window.location.href = '/admin'
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 编辑弹窗 */}
        {editingProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">编辑项目</h2>
                <button
                  onClick={() => setEditingProgram(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">大学名称</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={editingProgram.universityName}
                      onChange={e => setEditingProgram({...editingProgram, universityName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={editingProgram.programName}
                      onChange={e => setEditingProgram({...editingProgram, programName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学院</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={editingProgram.department}
                      onChange={e => setEditingProgram({...editingProgram, department: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学制</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={editingProgram.duration}
                      onChange={e => setEditingProgram({...editingProgram, duration: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">原始爬取文本</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    value={editingProgram.originalSource}
                    onChange={e => setEditingProgram({...editingProgram, originalSource: e.target.value})}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">录取要求</label>
                    <button
                      onClick={() => setEditingProgram({
                        ...editingProgram,
                        requirements: [...editingProgram.requirements, {
                          id: Date.now(),
                          type: 'OTHER',
                          description: '',
                          isMandatory: true,
                          requiredSubjects: []
                        } as Requirement]
                      })}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      + 添加要求
                    </button>
                  </div>

                  {editingProgram.requirements.map((req, index) => (
                    <div key={req.id || index} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">要求类型</label>
                          <select
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={req.type}
                            onChange={e => {
                              const newReqs = [...editingProgram.requirements]
                              newReqs[index].type = e.target.value as any
                              setEditingProgram({...editingProgram, requirements: newReqs})
                            }}
                          >
                            <option value="GPA">GPA要求</option>
                            <option value="IELTS">雅思要求</option>
                            <option value="TOEFL">托福要求</option>
                            <option value="PTE">PTE要求</option>
                            <option value="PREREQUISITE_MODULE">先修课程</option>
                            <option value="OTHER">其他要求</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">是否必填</label>
                          <select
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={req.isMandatory ? 'true' : 'false'}
                            onChange={e => {
                              const newReqs = [...editingProgram.requirements]
                              newReqs[index].isMandatory = e.target.value === 'true'
                              setEditingProgram({...editingProgram, requirements: newReqs})
                            }}
                          >
                            <option value="true">是</option>
                            <option value="false">否</option>
                          </select>
                        </div>
                      </div>

                      {req.type === 'GPA' && (
                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1">最低GPA要求（百分制，211/985标准）</label>
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={req.minimumValue || ''}
                            onChange={e => {
                              const newReqs = [...editingProgram.requirements]
                              newReqs[index].minimumValue = parseFloat(e.target.value)
                              setEditingProgram({...editingProgram, requirements: newReqs})
                            }}
                          />
                        </div>
                      )}

                      {['IELTS', 'TOEFL', 'PTE'].includes(req.type) && (
                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1">最低分数要求（JSON格式，比如 {"{\"overall\":6.5,\"listening\":6}"}）</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                            value={JSON.stringify(req.englishMinimum || {})}
                            onChange={e => {
                              const newReqs = [...editingProgram.requirements]
                              newReqs[index].englishMinimum = JSON.parse(e.target.value)
                              setEditingProgram({...editingProgram, requirements: newReqs})
                            }}
                          />
                        </div>
                      )}

                      {req.type === 'PREREQUISITE_MODULE' && (
                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1">要求课程名称（逗号分隔）</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={req.requiredSubjects.join(',')}
                            onChange={e => {
                              const newReqs = [...editingProgram.requirements]
                              newReqs[index].requiredSubjects = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              setEditingProgram({...editingProgram, requirements: newReqs})
                            }}
                          />
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="block text-xs text-gray-600 mb-1">要求描述</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={req.description}
                          onChange={e => {
                            const newReqs = [...editingProgram.requirements]
                            newReqs[index].description = e.target.value
                            setEditingProgram({...editingProgram, requirements: newReqs})
                          }}
                        />
                      </div>

                      <button
                        onClick={() => {
                          const newReqs = editingProgram.requirements.filter((_, i) => i !== index)
                          setEditingProgram({...editingProgram, requirements: newReqs})
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        删除此要求
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveProgram}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存修改
                  </button>
                  <button
                    onClick={() => setEditingProgram(null)}
                    className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 项目列表 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大学</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学院</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.map((program) => (
                <tr key={program.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{program.universityName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{program.programName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{program.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setEditingProgram(program)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
