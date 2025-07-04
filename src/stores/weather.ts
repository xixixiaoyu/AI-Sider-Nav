import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  WeatherData,
  LocationData,
  WeatherApiResponse,
  WeatherError,
  TemperatureConverter,
} from '@/types/weather'
import { WEATHER_ICONS, WeatherStatus } from '@/types/weather'

// 默认的 OpenWeatherMap API Key（免费版本，有限制）
// 注意：这是一个示例密钥，实际使用时请申请自己的API密钥
const DEFAULT_API_KEY = 'demo_key_please_replace_with_your_own'

export const useWeatherStore = defineStore('weather', () => {
  // 响应式状态
  const weatherData = ref<WeatherData | null>(null)
  const locationData = ref<LocationData | null>(null)
  const status = ref<WeatherStatus>(WeatherStatus.LOADING)
  const error = ref<WeatherError | null>(null)
  const lastFetchTime = ref<number>(0)

  // 缓存时间（30分钟）
  const CACHE_DURATION = 30 * 60 * 1000

  // 计算属性
  const isLoading = computed(() => status.value === WeatherStatus.LOADING)
  const hasError = computed(
    () =>
      status.value === WeatherStatus.ERROR ||
      status.value === WeatherStatus.API_ERROR ||
      status.value === WeatherStatus.PERMISSION_DENIED ||
      status.value === WeatherStatus.LOCATION_UNAVAILABLE
  )
  const hasData = computed(() => weatherData.value !== null)
  const needsRefresh = computed(() => {
    return Date.now() - lastFetchTime.value > CACHE_DURATION
  })

  // 温度转换函数
  const convertTemperature: TemperatureConverter = (temp, from, to) => {
    if (from === to) return temp
    if (from === 'celsius' && to === 'fahrenheit') {
      return (temp * 9) / 5 + 32
    }
    if (from === 'fahrenheit' && to === 'celsius') {
      return ((temp - 32) * 5) / 9
    }
    return temp
  }

  // 获取用户地理位置
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            lastUpdated: Date.now(),
          }
          resolve(location)
        },
        (error) => {
          let errorMessage = 'Unknown location error'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10分钟缓存
        }
      )
    })
  }

  // 根据城市名称获取坐标
  const getLocationByCity = async (cityName: string, apiKey: string): Promise<LocationData> => {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data || data.length === 0) {
        throw new Error('City not found')
      }

      const location: LocationData = {
        latitude: data[0].lat,
        longitude: data[0].lon,
        city: data[0].name,
        country: data[0].country,
        lastUpdated: Date.now(),
      }

      return location
    } catch (error) {
      throw new Error(
        `Failed to get location for city: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // 获取天气数据
  const fetchWeatherData = async (
    lat: number,
    lon: number,
    apiKey: string,
    unit: 'celsius' | 'fahrenheit' = 'celsius'
  ): Promise<WeatherData> => {
    // 检查 API key 是否有效
    if (!apiKey || apiKey === 'demo_key_please_replace_with_your_own') {
      throw new Error('Invalid API key: demo_key_please_replace_with_your_own')
    }

    const units = unit === 'celsius' ? 'metric' : 'imperial'
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}&lang=zh_cn`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: WeatherApiResponse = await response.json()

      const weather: WeatherData = {
        location: data.name,
        temperature: Math.round(data.main.temp),
        temperatureUnit: unit,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: WEATHER_ICONS[data.weather[0].icon] || '🌤️',
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 10) / 10,
        feelsLike: Math.round(data.main.feels_like),
        lastUpdated: Date.now(),
      }

      return weather
    } catch (error) {
      throw new Error(
        `Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // 从存储加载缓存数据
  const loadCachedData = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          'weatherData',
          'locationData',
          'lastFetchTime',
        ])
        if (result.weatherData) weatherData.value = result.weatherData
        if (result.locationData) locationData.value = result.locationData
        if (result.lastFetchTime) lastFetchTime.value = result.lastFetchTime
      } else {
        // 开发环境使用 localStorage
        const cached = localStorage.getItem('weatherCache')
        if (cached) {
          const data = JSON.parse(cached)
          weatherData.value = data.weatherData
          locationData.value = data.locationData
          lastFetchTime.value = data.lastFetchTime
        }
      }
    } catch (error) {
      console.error('Failed to load cached weather data:', error)
    }
  }

  // 保存数据到存储
  const saveCachedData = async () => {
    try {
      const cacheData = {
        weatherData: weatherData.value,
        locationData: locationData.value,
        lastFetchTime: lastFetchTime.value,
      }

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set(cacheData)
      } else {
        // 开发环境使用 localStorage
        localStorage.setItem('weatherCache', JSON.stringify(cacheData))
      }
    } catch (error) {
      console.error('Failed to save weather data:', error)
    }
  }

  // 更新天气数据
  const updateWeather = async (settings: {
    enabled: boolean
    autoLocation: boolean
    city: string
    temperatureUnit: 'celsius' | 'fahrenheit'
    apiKey?: string
  }) => {
    if (!settings.enabled) {
      status.value = WeatherStatus.SUCCESS
      return
    }

    status.value = WeatherStatus.LOADING
    error.value = null

    try {
      const apiKey = settings.apiKey || DEFAULT_API_KEY
      let location = locationData.value

      // 如果需要获取新的位置信息
      if (!location || needsRefresh.value) {
        if (settings.autoLocation) {
          location = await getCurrentLocation()
        } else if (settings.city) {
          location = await getLocationByCity(settings.city, apiKey)
        } else {
          throw new Error('No location method available')
        }
        locationData.value = location
      }

      // 获取天气数据
      const weather = await fetchWeatherData(
        location.latitude,
        location.longitude,
        apiKey,
        settings.temperatureUnit
      )

      weatherData.value = weather
      lastFetchTime.value = Date.now()
      status.value = WeatherStatus.SUCCESS

      // 保存到缓存
      await saveCachedData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = {
        code: 'FETCH_ERROR',
        message: errorMessage,
        timestamp: Date.now(),
      }

      if (errorMessage.includes('denied')) {
        status.value = WeatherStatus.PERMISSION_DENIED
      } else if (errorMessage.includes('unavailable')) {
        status.value = WeatherStatus.LOCATION_UNAVAILABLE
      } else {
        status.value = WeatherStatus.API_ERROR
      }
    }
  }

  // 清除天气数据
  const clearWeatherData = () => {
    weatherData.value = null
    locationData.value = null
    error.value = null
    status.value = WeatherStatus.LOADING
    lastFetchTime.value = 0
  }

  return {
    // 状态
    weatherData,
    locationData,
    status,
    error,
    lastFetchTime,

    // 计算属性
    isLoading,
    hasError,
    hasData,
    needsRefresh,

    // 方法
    updateWeather,
    clearWeatherData,
    loadCachedData,
    convertTemperature,
  }
})
