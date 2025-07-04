// 天气相关的类型定义

export interface WeatherCondition {
  id: number
  main: string
  description: string
  icon: string
}

export interface WeatherMain {
  temp: number
  feels_like: number
  temp_min: number
  temp_max: number
  pressure: number
  humidity: number
}

export interface WeatherWind {
  speed: number
  deg: number
  gust?: number
}

export interface WeatherClouds {
  all: number
}

export interface WeatherSys {
  type: number
  id: number
  country: string
  sunrise: number
  sunset: number
}

export interface WeatherCoord {
  lon: number
  lat: number
}

// OpenWeatherMap API 响应接口
export interface WeatherApiResponse {
  coord: WeatherCoord
  weather: WeatherCondition[]
  base: string
  main: WeatherMain
  visibility: number
  wind: WeatherWind
  clouds: WeatherClouds
  dt: number
  sys: WeatherSys
  timezone: number
  id: number
  name: string
  cod: number
}

// 简化的天气数据接口（用于应用内部）
export interface WeatherData {
  location: string
  temperature: number
  temperatureUnit: 'celsius' | 'fahrenheit'
  condition: string
  description: string
  icon: string
  humidity: number
  windSpeed: number
  feelsLike: number
  lastUpdated: number
}

// 地理位置接口
export interface LocationData {
  latitude: number
  longitude: number
  city?: string
  country?: string
  lastUpdated: number
}

// 天气错误类型
export interface WeatherError {
  code: string
  message: string
  timestamp: number
}

// 天气状态枚举
export enum WeatherStatus {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  PERMISSION_DENIED = 'permission_denied',
  LOCATION_UNAVAILABLE = 'location_unavailable',
  API_ERROR = 'api_error'
}

// 天气图标映射
export const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️', // clear sky day
  '01n': '🌙', // clear sky night
  '02d': '⛅', // few clouds day
  '02n': '☁️', // few clouds night
  '03d': '☁️', // scattered clouds
  '03n': '☁️', // scattered clouds
  '04d': '☁️', // broken clouds
  '04n': '☁️', // broken clouds
  '09d': '🌧️', // shower rain
  '09n': '🌧️', // shower rain
  '10d': '🌦️', // rain day
  '10n': '🌧️', // rain night
  '11d': '⛈️', // thunderstorm
  '11n': '⛈️', // thunderstorm
  '13d': '❄️', // snow
  '13n': '❄️', // snow
  '50d': '🌫️', // mist
  '50n': '🌫️', // mist
}

// 温度转换工具函数类型
export type TemperatureConverter = (temp: number, from: 'celsius' | 'fahrenheit', to: 'celsius' | 'fahrenheit') => number
