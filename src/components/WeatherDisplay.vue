<template>
  <div v-if="settingsStore.settings.weather.enabled" class="weather-display">
    <!-- 加载状态 -->
    <div v-if="weatherStore.isLoading" class="weather-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">获取天气中...</span>
    </div>

    <!-- 天气信息 -->
    <div v-else-if="weatherStore.hasData && weatherStore.weatherData" class="weather-info">
      <div class="weather-main">
        <span class="weather-icon">{{ weatherStore.weatherData.icon }}</span>
        <div class="weather-temp">
          <span class="temp-value">{{ weatherStore.weatherData.temperature }}</span>
          <span class="temp-unit">{{ temperatureUnit }}</span>
        </div>
      </div>

      <div class="weather-details">
        <div class="weather-location">{{ weatherStore.weatherData.location }}</div>
        <div class="weather-description">{{ weatherStore.weatherData.description }}</div>
        <div class="weather-extra">
          <span class="feels-like"
            >体感 {{ weatherStore.weatherData.feelsLike }}{{ temperatureUnit }}</span
          >
          <span class="humidity">湿度 {{ weatherStore.weatherData.humidity }}%</span>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="weatherStore.hasError" class="weather-error">
      <div class="error-icon">⚠️</div>
      <div class="error-message">
        <div class="error-title">天气获取失败</div>
        <div class="error-detail">
          {{ errorMessage }}
          <div v-if="needsApiKey" class="api-key-help">
            <a href="https://openweathermap.org/api" target="_blank" class="help-link">
              获取免费 API Key →
            </a>
          </div>
        </div>

        <!-- API Key 输入 -->
        <div v-if="needsApiKey && showApiKeyInput" class="api-key-input">
          <input
            v-model="tempApiKey"
            type="text"
            placeholder="输入您的 OpenWeatherMap API Key"
            class="api-key-field"
            @keyup.enter="saveApiKey"
          />
          <div class="api-key-actions">
            <button @click="saveApiKey" class="save-button">保存</button>
            <button @click="showApiKeyInput = false" class="cancel-button">取消</button>
          </div>
        </div>

        <div class="error-actions">
          <button
            v-if="needsApiKey && !showApiKeyInput"
            @click="showSettings = true"
            class="retry-button primary"
          >
            配置 API Key
          </button>
          <button v-else @click="handleRetry" class="retry-button">重试</button>
          <button @click="showSettings = true" class="settings-button">⚙️</button>
        </div>
      </div>
    </div>

    <!-- 权限请求 -->
    <div v-else class="weather-permission">
      <div class="permission-icon">📍</div>
      <div class="permission-message">
        <div class="permission-title">需要位置权限</div>
        <div class="permission-detail">允许获取位置以显示天气信息</div>
        <button class="permission-button" @click="handlePermissionRequest">允许位置访问</button>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <WeatherSettings v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, watch, ref } from 'vue'
  import { useWeatherStore } from '@/stores/weather'
  import { useSettingsStore } from '@/stores/settings'
  import { WeatherStatus } from '@/types/weather'
  import WeatherSettings from './WeatherSettings.vue'

  const weatherStore = useWeatherStore()
  const settingsStore = useSettingsStore()

  // 响应式变量
  const showApiKeyInput = ref(false)
  const tempApiKey = ref('')
  const showSettings = ref(false)

  // 计算属性
  const temperatureUnit = computed(() => {
    return settingsStore.settings.weather.temperatureUnit === 'celsius' ? '°C' : '°F'
  })

  const needsApiKey = computed(() => {
    return (
      weatherStore.status === WeatherStatus.API_ERROR &&
      weatherStore.error &&
      (weatherStore.error.message.includes('401') ||
        weatherStore.error.message.includes('API key') ||
        weatherStore.error.message.includes('demo_key'))
    )
  })

  const errorMessage = computed(() => {
    if (!weatherStore.error) return ''

    switch (weatherStore.status) {
      case WeatherStatus.PERMISSION_DENIED:
        return '需要位置权限才能显示天气'
      case WeatherStatus.LOCATION_UNAVAILABLE:
        return '无法获取位置，请检查网络或手动设置城市'
      case WeatherStatus.API_ERROR:
        if (needsApiKey.value) {
          return '需要配置有效的天气API密钥'
        }
        return '天气服务暂时不可用'
      default:
        return '获取天气信息失败'
    }
  })

  // 方法
  const handleRetry = async () => {
    await weatherStore.updateWeather(settingsStore.settings.weather)
  }

  const handlePermissionRequest = async () => {
    await weatherStore.updateWeather(settingsStore.settings.weather)
  }

  const saveApiKey = async () => {
    if (!tempApiKey.value.trim()) {
      alert('请输入有效的 API Key')
      return
    }

    // 更新设置中的 API Key
    await settingsStore.updateSetting('weather', {
      ...settingsStore.settings.weather,
      apiKey: tempApiKey.value.trim(),
    })

    // 隐藏输入框
    showApiKeyInput.value = false
    tempApiKey.value = ''

    // 重新尝试获取天气
    await weatherStore.updateWeather(settingsStore.settings.weather)
  }

  // 监听设置变化
  watch(
    () => settingsStore.settings.weather,
    async (newSettings) => {
      if (newSettings.enabled) {
        await weatherStore.updateWeather(newSettings)
      }
    },
    { deep: true }
  )

  // 组件挂载时初始化
  onMounted(async () => {
    // 加载缓存数据
    await weatherStore.loadCachedData()

    // 如果启用天气且需要刷新，则更新天气数据
    if (settingsStore.settings.weather.enabled && weatherStore.needsRefresh) {
      await weatherStore.updateWeather(settingsStore.settings.weather)
    }
  })
</script>

<style scoped>
  .weather-display {
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    animation: slideInRight 0.8s ease-out 0.6s both;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 加载状态 */
  .weather-loading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    opacity: 0.8;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: 0.9rem;
    font-weight: 400;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* 天气信息 */
  .weather-info {
    text-align: center;
    max-width: 200px;
  }

  .weather-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .weather-icon {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .weather-temp {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .temp-value {
    font-size: 2rem;
    font-weight: 300;
    line-height: 1;
  }

  .temp-unit {
    font-size: 1rem;
    opacity: 0.8;
  }

  .weather-details {
    font-size: 0.85rem;
    opacity: 0.9;
    line-height: 1.4;
  }

  .weather-location {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .weather-description {
    margin-bottom: 0.5rem;
    text-transform: capitalize;
  }

  .weather-extra {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  /* 错误状态 */
  .weather-error {
    text-align: center;
    max-width: 200px;
  }

  .error-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .error-title {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .error-detail {
    font-size: 0.75rem;
    opacity: 0.8;
    margin-bottom: 0.75rem;
    line-height: 1.3;
  }

  .retry-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .retry-button.primary {
    background: rgba(121, 180, 166, 0.8);
    border-color: rgba(121, 180, 166, 0.9);
  }

  .retry-button.primary:hover {
    background: rgba(121, 180, 166, 1);
    border-color: rgba(121, 180, 166, 1);
  }

  /* API Key 相关样式 */
  .api-key-help {
    margin-top: 0.5rem;
  }

  .help-link {
    color: rgba(121, 180, 166, 1);
    text-decoration: none;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .help-link:hover {
    text-decoration: underline;
  }

  .api-key-input {
    margin: 0.75rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .api-key-field {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.25rem;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .api-key-field::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .api-key-field:focus {
    outline: none;
    border-color: rgba(121, 180, 166, 0.8);
    background: rgba(255, 255, 255, 0.15);
  }

  .api-key-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .save-button,
  .cancel-button {
    padding: 0.375rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .save-button {
    background: rgba(121, 180, 166, 0.8);
    color: white;
  }

  .save-button:hover {
    background: rgba(121, 180, 166, 1);
  }

  .cancel-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .cancel-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 设置按钮样式 */
  .error-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
  }

  .settings-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.375rem;
    border-radius: 50%;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .settings-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  /* 权限请求 */
  .weather-permission {
    text-align: center;
    max-width: 200px;
  }

  .permission-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .permission-title {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .permission-detail {
    font-size: 0.75rem;
    opacity: 0.8;
    margin-bottom: 0.75rem;
    line-height: 1.3;
  }

  .permission-button {
    background: rgba(121, 180, 166, 0.8);
    border: 1px solid rgba(121, 180, 166, 0.9);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .permission-button:hover {
    background: rgba(121, 180, 166, 1);
    border-color: rgba(121, 180, 166, 1);
  }

  /* 动画 */
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .weather-display {
      min-height: 60px;
    }

    .weather-icon {
      font-size: 1.5rem;
    }

    .temp-value {
      font-size: 1.5rem;
    }

    .weather-details {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .weather-main {
      gap: 0.5rem;
    }

    .weather-icon {
      font-size: 1.25rem;
    }

    .temp-value {
      font-size: 1.25rem;
    }

    .weather-extra {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>
