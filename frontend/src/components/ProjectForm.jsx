import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon, 
  DocumentArrowUpIcon,
  CogIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

const ProjectForm = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_data: {
      katlar: [],
      is_kalemleri: []
    }
  })

  // Demo veri
  const demoProject = {
    name: 'Şehir Hastanesi Ek Bina',
    description: '5 katlı, 2250m² alan, 8 iş kalemi',
    project_data: {
      katlar: [
        { kat_no: 1, kat_adi: 'Zemin Kat', kot: 0 },
        { kat_no: 2, kat_adi: '1. Kat', kot: 4 },
        { kat_no: 3, kat_adi: '2. Kat', kot: 8 },
        { kat_no: 4, kat_adi: '3. Kat', kot: 12 },
        { kat_no: 5, kat_adi: '4. Kat', kot: 16 }
      ],
      is_kalemleri: [
        { id: 'E01', isim: 'Elektrik Tesisatı', birim: 'm²', miktar: 2250, ekip_verim: 15 },
        { id: 'S01', isim: 'Sıva', birim: 'm²', miktar: 2250, ekip_verim: 25 },
        { id: 'B01', isim: 'Boya', birim: 'm²', miktar: 2250, ekip_verim: 35 },
        { id: 'K01', isim: 'Seramik', birim: 'm²', miktar: 600, ekip_verim: 8 },
        { id: 'A01', isim: 'Asma Tavan', birim: 'm²', miktar: 1200, ekip_verim: 20 },
        { id: 'D01', isim: 'Duvar Sıvası', birim: 'm²', miktar: 1850, ekip_verim: 22 },
        { id: 'S02', isim: 'Şap', birim: 'm²', miktar: 1850, ekip_verim: 40 },
        { id: 'K02', isim: 'Betonarme Kalıbı', birim: 'm²', miktar: 950, ekip_verim: 12 }
      ]
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await axios.post('/projects', formData)
      toast.success('Proje oluşturuldu! Optimizasyon başlıyor...')
      
      // Otomatik optimize et
      const optimizeResponse = await axios.post(`/optimize/${response.data.id}`)
      
      toast.success('Optimizasyon tamamlandı!')
      navigate(`/projects/${response.data.id}/results`)
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error('Yetersiz kredi! Lütfen kredi yükleyin.')
      } else {
        toast.error('Proje oluşturulamadı')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = () => {
    setFormData(demoProject)
    setStep(2)
    toast.success('Demo proje yüklendi!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Proje Oluştur</h1>
            <p className="text-gray-600 mt-1">
              Metraj verilerinizi yükleyin, Takt AI optimum planı bulsun.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex-1 flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                1
              </div>
              <span className="ml-3 font-medium">Proje Bilgileri</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex-1 flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                2
              </div>
              <span className="ml-3 font-medium">Optimizasyon</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            {/* Demo Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BeakerIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Demo Proje ile Başla</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Hastane projesi örneği ile Takt AI'ı hemen test edin. 5 kat, 2250m² alan, 8 iş kalemi.
                  </p>
                  <button
                    onClick={loadDemoData}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                  >
                    Demo Projeyi Yükle
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proje Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Şehir Hastanesi Ek Bina"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Proje hakkında kısa bilgi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metraj Verisi
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                    <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      IFC, Excel veya JSON formatında metraj yükleyin
                    </p>
                    <p className="text-sm text-gray-400">
                      Yakında: Otomatik IFC metraj çıkarıcı
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={!formData.name}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Devam Et
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CogIcon className="w-10 h-10 text-white animate-spin-slow" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Optimizasyon Başlıyor
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Takt AI, 20,000'den fazla senaryoyu simüle ederek projeniz için en optimum planı bulacak.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary px-12"
              >
                {loading ? 'Optimize Ediliyor...' : 'Optimizasyonu Başlat'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ProjectForm