import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
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

const OptimizationResults = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState(null)

  useEffect(() => {
    fetchResults()
  }, [id])

  const fetchResults = async () => {
    try {
      const response = await axios.get(`/results/${id}`)
      setResults(response.data)
      setSelectedScenario(response.data.scenarios[2]) // Dengeli plan varsayılan
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
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    )
  }

  const evolutionChartData = {
    labels: Array.from({ length: results.evolution_history.best_fitness.length }, (_, i) => i + 1),
    datasets: [
      {
        label: 'En İyi Fitness',
        data: results.evolution_history.best_fitness,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 3,
        pointRadius: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'Ortalama Fitness',
        data: results.evolution_history.avg_fitness,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 2,
        pointRadius: 1,
        tension: 0.3,
        borderDash: [5, 5]
      }
    ]
  }

  const evolutionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { mode: 'index', intersect: false }
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/dashboard')}
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
                {(selectedScenario?.cost / 1000000 || results.best_plan.cost / 1000000).toFixed(1)}M
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Evrim Süreci</h2>
              <p className="text-sm text-gray-500">100 jenerasyon boyunca fitness değişimi</p>
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
            <Line data={evolutionChartData} options={evolutionOptions} />
          </div>
        </div>

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
              {selectedScenario?.zonlar?.length > 8 && (
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
                    {(selectedScenario?.resource_balance * 100 || 0).toFixed(0)}%
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
                    {(selectedScenario?.risk * 100 || 0).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      selectedScenario?.risk < 0.3 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : selectedScenario?.risk < 0.6
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

export default OptimizationResults