'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  UserCircleIcon,
  PlusIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  credits: number
}

interface Project {
  id: string
  name: string
  description?: string
  status: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedOptimizations: 0,
    totalSavings: 0,
    creditsRemaining: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
    fetchProjects()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch user')
      const data = await response.json()
      setUser(data)
    } catch (error) {
      localStorage.removeItem('token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data)
      calculateStats(data)
    } catch (error) {
      toast.error('Projeler yüklenemedi')
    }
  }

  const calculateStats = (projects: Project[]) => {
    const completed = projects.filter(p => p.status === 'completed').length
    setStats({
      totalProjects: projects.length,
      completedOptimizations: completed,
      totalSavings: completed * 450000,
      creditsRemaining: user?.credits || 0
    })
  }

  useEffect(() => {
    if (user) {
      setStats(prev => ({ ...prev, creditsRemaining: user.credits || 0 }))
    }
  }, [user])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">TAKT AI yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TAKT AI
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                v1.0
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {stats.creditsRemaining} Kredi
                </span>
              </div>

              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-6 h-6 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Ana İçerik */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hoşgeldin Mesajı */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Merhaba, {user?.name} 👋
          </h1>
          <p className="text-lg text-gray-600">
            Takt AI ile projelerinizi optimize edin, zamandan ve maliyetten tasarruf edin.
          </p>
        </motion.div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.totalProjects}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Toplam Proje</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.completedOptimizations}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Optimizasyon Tamamlandı</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {(stats.totalSavings / 1000000).toFixed(1)}M
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Tahmini Tasarruf (₺)</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">%98</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Optimizasyon Başarı Oranı</h3>
          </motion.div>
        </div>

        {/* Hızlı Aksiyon */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Hızlı Aksiyon</h2>
          </div>

          <Link href="/projects/new">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <PlusIcon className="w-12 h-12 mb-4 opacity-90" />
                  <h3 className="text-2xl font-bold mb-2">Yeni Proje Oluştur</h3>
                  <p className="text-blue-100">
                    Metraj verilerinizi yükleyin, AI ile optimum takt planınızı oluşturalım.
                  </p>
                </div>
                <div className="hidden md:block">
                  <span className="bg-white/20 backdrop-blur px-6 py-3 rounded-xl font-semibold">
                    1 Kredi
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Son Projeler */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Son Projeler</h2>
            <span className="text-sm text-gray-500">{projects.length} proje</span>
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz proje yok</h3>
                <p className="text-gray-500 mb-6">İlk projenizi oluşturarak başlayın.</p>
                <Link href="/projects/new">
                  <button className="btn-primary">
                    İlk Projeni Oluştur
                  </button>
                </Link>
              </div>
            ) : (
              projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
                        <DocumentTextIcon className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">{project.description || 'Açıklama yok'}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium
                            ${project.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {project.status === 'completed' ? '✓ Tamamlandı' : '⏳ Beklemede'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(project.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {project.status === 'completed' ? (
                      <Link href={`/projects/${project.id}/results`}>
                        <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                          Sonuçları Gör
                        </button>
                      </Link>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-5 h-5 text-yellow-500 animate-pulse" />
                        <span className="text-sm text-gray-500">Optimize ediliyor...</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
