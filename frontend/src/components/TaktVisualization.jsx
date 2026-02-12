import React from 'react'
import { motion } from 'framer-motion'

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500',
  'bg-red-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-orange-500', 'bg-cyan-500'
]

const TaktVisualization = ({ scenario }) => {
  if (!scenario?.ekipler?.length || !scenario?.zonlar?.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-500 text-center">Takt plan verisi bulunamadi</p>
      </div>
    )
  }

  const { ekipler, zonlar, takt_suresi, duration } = scenario
  const totalDays = duration || takt_suresi * zonlar.length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Takt Zaman Cizelgesi</h2>
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
                          <p>{ekip.kisi_sayisi} kisi</p>
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

export default TaktVisualization
