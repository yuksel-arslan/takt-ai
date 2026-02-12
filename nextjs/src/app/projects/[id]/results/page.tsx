'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import toast from 'react-hot-toast'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// --- Inlined EvolutionChart Component ---

interface EvolutionChartProps {
  evolutionHistory: {
    best_fitness: number[]
    avg_fitness: number[]
  }
}

function EvolutionChart({ evolutionHistory }: EvolutionChartProps) {
  if (!evolutionHistory?.best_fitness?.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-500 text-center">Evrim verisi bulunamadı</p>
      </div>
    )
  }

  const data = {
    labels: Array.from({ length: evolutionHistory.best_fitness.length }, (_, i) => i + 1),
    datasets: [
      {
        label: 'En İyi Fitness',
        data: evolutionHistory.best_fitness,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 3,
        pointRadius: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'Ortalama Fitness',
        data: evolutionHistory.avg_fitness,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 2,
        pointRadius: 1,
        tension: 0.3,
        borderDash: [5, 5]
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1.0,
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        grid: { display: false },
        title: { display: true, text: 'Jenerasyon' }
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Evrim Süreci</h2>
          <p className="text-sm text-gray-500">
            {evolutionHistory.best_fitness.length} jenerasyon boyunca fitness değişimi
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-xs text-gray-600">En İyi Plan</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span className="text-xs text-gray-600">Ortalama</span>
          </div>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  )
}

// --- Inlined TaktVisualization Component ---

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500',
  'bg-red-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-orange-500', 'bg-cyan-500'
]

interface Ekip {
  isim: string
  kisi_sayisi: number
}

interface Zon {
  id: string
  alan: number
}

interface TaktVisualizationProps {
  scenario: {
    ekipler?: Ekip[]
    zonlar?: Zon[]
    takt_suresi: number
    duration: number
  }
}

function TaktVisualization({ scenario }: TaktVisualizationProps) {
  if (!scenario?.ekipler?.length || !scenario?.zonlar?.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-500 text-center">Takt plan verisi bulunamadı</p>
      </div>
    )
  }

  const { ekipler, zonlar, takt_suresi, duration } = scenario
  const totalDays = duration || takt_suresi * zonlar.length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Takt Zaman Çizelgesi</h2>
          <p className="text-sm text-gray-500">
            {ekipler.length} ekip · {zonlar.length} zon · {takt_suresi} gün/takt
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
          <span className="text-sm font-medium text-gray-700">
            Toplam: {totalDays} gün
          </span>
        </div>
      </div>

      {/* Takt Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header - Zonlar */}
          <div className="flex mb-2">
            <div className="w-36 flex-shrink-0 pr-3">
              <span className="text-xs font-medium text-gray-500">Ekip / Zon</span>
            </div>
            <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${zonlar.length}, 1fr)` }}>
              {zonlar.map((zon, i) => (
                <div key={i} className="text-center">
                  <span className="text-xs font-medium text-gray-600">{zon.id || `Z${i + 1}`}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows - Ekipler */}
          {ekipler.map((ekip, ekipIndex) => (
            <motion.div
              key={ekipIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ekipIndex * 0.05 }}
              className="flex mb-1"
            >
              <div className="w-36 flex-shrink-0 pr-3 flex items-center">
                <div className={`w-3 h-3 ${COLORS[ekipIndex % COLORS.length]} rounded-sm mr-2`}></div>
                <span className="text-xs text-gray-700 truncate">{ekip.isim}</span>
              </div>
              <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${zonlar.length}, 1fr)` }}>
                {zonlar.map((_, zonIndex) => {
                  const startOffset = ekipIndex + zonIndex
                  return (
                    <motion.div
                      key={zonIndex}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: (ekipIndex + zonIndex) * 0.03 }}
                      className={`h-8 ${COLORS[ekipIndex % COLORS.length]} rounded opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                          <p className="font-medium">{ekip.isim}</p>
                          <p>Gün {startOffset * takt_suresi + 1} - {(startOffset + 1) * takt_suresi}</p>
                          <p>{ekip.kisi_sayisi} kişi</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}

          {/* Zaman ekseni */}
          <div className="flex mt-4 pt-3 border-t border-gray-100">
            <div className="w-36 flex-shrink-0 pr-3">
              <span className="text-xs text-gray-400">Gün</span>
            </div>
            <div className="flex-1 flex justify-between">
              <span className="text-xs text-gray-400">1</span>
              <span className="text-xs text-gray-400">{Math.round(totalDays / 2)}</span>
              <span className="text-xs text-gray-400">{totalDays}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Results Page ---

interface Scenario {
  name: string
  description: string
  duration: number
  cost: number
  takt_suresi: number
  ekipler?: Ekip[]
  zonlar?: Zon[]
  resource_balance?: number
  risk?: number
}

interface Results {
  project: { name: string }
  optimization_date: string
  best_plan: {
    duration: number
    cost: number
    takt_suresi: number
  }
  scenarios: Scenario[]
  evolution_history: {
    best_fitness: number[]
    avg_fitness: number[]
  }
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)

  useEffect(() => {
    fetchResults()
  }, [id])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/results/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch results')
      const data = await response.json()
      setResults(data)
      setSelectedScenario(data.scenarios[2]) // Dengeli plan varsayılan
    } catch (error) {
      toast.error('Sonuçlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Optimizasyon sonuçları yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sonuç Bulunamadı</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Dashboard&apos;a Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{results.project.name}</h1>
              <p className="text-gray-600 mt-1">
                Optimizasyon Sonuçları · {new Date(results.optimization_date).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>

          <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2">
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Rapor İndir</span>
          </button>
        </div>

        {/* Ana Metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {selectedScenario?.duration || results.best_plan.duration}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Proje Süresi</h3>
            <p className="text-xs text-gray-400 mt-1">gün</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {((selectedScenario?.cost ?? results.best_plan.cost) / 1000000).toFixed(1)}M
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Toplam Maliyet</h3>
            <p className="text-xs text-gray-400 mt-1">₺</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {selectedScenario?.takt_suresi || results.best_plan.takt_suresi}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Takt Süresi</h3>
            <p className="text-xs text-gray-400 mt-1">gün/zon</p>
          </motion.div>
        </div>

        {/* Senaryo Seçimi */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimizasyon Senaryoları</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.scenarios?.map((scenario, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedScenario(scenario)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedScenario === scenario
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl">{scenario.name.split(' ')[0]}</span>
                  {selectedScenario === scenario && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Seçili</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{scenario.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{scenario.duration} gün</span>
                  <span className="font-medium text-gray-900">{(scenario.cost / 1000000).toFixed(1)}M ₺</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Fitness Grafiği */}
        <div className="mb-8">
          <EvolutionChart evolutionHistory={results.evolution_history} />
        </div>

        {/* Takt Visualization */}
        {selectedScenario && (
          <div className="mb-8">
            <TaktVisualization scenario={selectedScenario} />
          </div>
        )}

        {/* Detaylı Plan */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Detaylı Takt Planı</h2>

          <div className="space-y-6">
            {/* Ekip Dağılımı */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Ekip Dağılımı</h3>
              <div className="space-y-3">
                {selectedScenario?.ekipler?.map((ekip, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{ekip.isim}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">{ekip.kisi_sayisi} kişi</span>
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                          style={{ width: `${(ekip.kisi_sayisi / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zon Bilgileri */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Zon Yapısı</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedScenario?.zonlar?.slice(0, 8).map((zon, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-900">{zon.id}</span>
                    <p className="text-xs text-gray-500 mt-1">{zon.alan} m²</p>
                  </div>
                ))}
              </div>
              {selectedScenario?.zonlar && selectedScenario.zonlar.length > 8 && (
                <p className="text-xs text-gray-400 mt-2">
                  +{selectedScenario.zonlar.length - 8} zon daha
                </p>
              )}
            </div>

            {/* Risk ve Denge */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Kaynak Dengesi</span>
                  <span className="text-sm font-medium text-gray-900">
                    {((selectedScenario?.resource_balance ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{ width: `${(selectedScenario?.resource_balance || 0) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Risk Skoru</span>
                  <span className="text-sm font-medium text-gray-900">
                    {((selectedScenario?.risk ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedScenario?.risk != null && selectedScenario.risk < 0.3
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : selectedScenario?.risk != null && selectedScenario.risk < 0.6
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${(selectedScenario?.risk || 0) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
