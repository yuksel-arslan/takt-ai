'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Sifreler eslesmedi')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Sifre en az 6 karakter olmalıdır')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          password: formData.password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw { response: { data } }
      }

      const { access_token } = data

      localStorage.setItem('token', access_token)
      toast.success('Kayıt basarılı! Hos geldiniz!')
      router.push('/dashboard')
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Kayıt basarısız'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sol Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-32 left-16 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-16 right-16 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">T</span>
            </div>
            <span className="text-4xl font-bold text-white">TAKT AI</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6">
            Projelerinizi<br />
            Optimize Edin
          </h2>

          <p className="text-purple-100 text-lg leading-relaxed mb-10">
            Ücretsiz kaydolun ve 3 kredi ile hemen baslayin.
            Genetik algoritma ile proje planlarinızı saniyeler içinde optimize edin.
          </p>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4">Ücretsiz Baslangiç Paketi</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-purple-100">
                <span className="w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center text-green-300 text-sm">&#10003;</span>
                <span>3 ücretsiz optimizasyon kredisi</span>
              </li>
              <li className="flex items-center space-x-3 text-purple-100">
                <span className="w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center text-green-300 text-sm">&#10003;</span>
                <span>Sınırsız proje olusturma</span>
              </li>
              <li className="flex items-center space-x-3 text-purple-100">
                <span className="w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center text-green-300 text-sm">&#10003;</span>
                <span>Detaylı optimizasyon raporları</span>
              </li>
              <li className="flex items-center space-x-3 text-purple-100">
                <span className="w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center text-green-300 text-sm">&#10003;</span>
                <span>3 farklı senaryo analizi</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sag Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobil Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TAKT AI
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kayıt Ol</h1>
            <p className="text-gray-600">Ücretsiz hesap olusturun ve hemen baslayin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Adınız Soyadınız"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="ornek@sirket.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sirket (Opsiyonel)
              </label>
              <div className="relative">
                <BuildingOfficeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Sirket adı"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sifre
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="En az 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sifre Tekrar
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Sifrenizi tekrar girin"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Kayıt yapılıyor...</span>
                </>
              ) : (
                <span>Kayıt Ol</span>
              )}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-8">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
              Giris Yap
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
