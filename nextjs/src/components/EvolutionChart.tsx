'use client'

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

interface EvolutionChartProps {
  evolutionHistory: {
    best_fitness: number[]
    avg_fitness: number[]
  }
}

const EvolutionChart = ({ evolutionHistory }: EvolutionChartProps) => {
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

export default EvolutionChart
