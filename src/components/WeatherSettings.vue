<template>
  <div class="weather-settings">
    <div class="settings-header">
      <h3>天气设置</h3>
      <button @click="$emit('close')" class="close-button">×</button>
    </div>

    <div class="settings-content">
      <div class="setting-group">
        <label class="setting-label">OpenWeatherMap API Key</label>
        <div class="api-key-section">
          <input
            v-model="apiKey"
            type="text"
            placeholder="输入您的 API Key"
            class="api-key-input"
          />
          <div class="api-key-help">
            <p>获取免费 API Key：</p>
            <ol>
              <li>访问 <a href="https://openweathermap.org/api" target="_blank">OpenWeatherMap</a></li>
              <li>注册免费账户</li>
              <li>在 "My API keys" 页面复制 API Key</li>
              <li>免费版本每月 1000 次调用</li>
            </ol>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <label class="setting-label">
          <input
            v-model="autoLocation"
            type="checkbox"
            class="setting-checkbox"
          />
          自动获取位置
        </label>
      </div>

      <div v-if="!autoLocation" class="setting-group">
        <label class="setting-label">城市名称</label>
        <input
          v-model="city"
          type="text"
          placeholder="例如：Beijing, Shanghai"
          class="setting-input"
        />
      </div>

      <div class="setting-group">
        <label class="setting-label">温度单位</label>
        <div class="radio-group">
          <label class="radio-label">
            <input
              v-model="temperatureUnit"
              type="radio"
              value="celsius"
              class="radio-input"
            />
            摄氏度 (°C)
          </label>
          <label class="radio-label">
            <input
              v-model="temperatureUnit"
              type="radio"
              value="fahrenheit"
              class="radio-input"
            />
            华氏度 (°F)
          </label>
        </div>
      </div>
    </div>

    <div class="settings-footer">
      <button @click="saveSettings" class="save-button">保存设置</button>
      <button @click="testWeather" class="test-button" :disabled="!apiKey">测试天气</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useSettingsStore } from '@/stores/settings'
  import { useWeatherStore } from '@/stores/weather'

  const emit = defineEmits<{
    close: []
  }>()

  const settingsStore = useSettingsStore()
  const weatherStore = useWeatherStore()

  // 响应式变量
  const apiKey = ref('')
  const autoLocation = ref(true)
  const city = ref('')
  const temperatureUnit = ref<'celsius' | 'fahrenheit'>('celsius')

  // 加载当前设置
  onMounted(() => {
    const weather = settingsStore.settings.weather
    apiKey.value = weather.apiKey || ''
    autoLocation.value = weather.autoLocation
    city.value = weather.city
    temperatureUnit.value = weather.temperatureUnit
  })

  // 保存设置
  const saveSettings = async () => {
    await settingsStore.updateSetting('weather', {
      ...settingsStore.settings.weather,
      apiKey: apiKey.value.trim(),
      autoLocation: autoLocation.value,
      city: city.value.trim(),
      temperatureUnit: temperatureUnit.value,
    })

    // 重新获取天气
    if (apiKey.value.trim()) {
      await weatherStore.updateWeather(settingsStore.settings.weather)
    }

    emit('close')
  }

  // 测试天气
  const testWeather = async () => {
    if (!apiKey.value.trim()) {
      alert('请先输入 API Key')
      return
    }

    // 临时更新设置进行测试
    const tempSettings = {
      ...settingsStore.settings.weather,
      apiKey: apiKey.value.trim(),
      autoLocation: autoLocation.value,
      city: city.value.trim(),
      temperatureUnit: temperatureUnit.value,
    }

    try {
      await weatherStore.updateWeather(tempSettings)
      if (weatherStore.hasData) {
        alert('天气获取成功！')
      } else if (weatherStore.hasError) {
        alert(`天气获取失败：${weatherStore.error?.message || '未知错误'}`)
      }
    } catch (error) {
      alert(`测试失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
</script>

<style scoped>
  .weather-settings {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    max-width: 500px;
    width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 1000;
    color: white;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .settings-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
  }

  .close-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s ease;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .settings-content {
    margin-bottom: 1.5rem;
  }

  .setting-group {
    margin-bottom: 1.5rem;
  }

  .setting-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .api-key-input,
  .setting-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.9rem;
  }

  .api-key-input::placeholder,
  .setting-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .api-key-input:focus,
  .setting-input:focus {
    outline: none;
    border-color: rgba(121, 180, 166, 0.8);
    background: rgba(255, 255, 255, 0.15);
  }

  .api-key-help {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(121, 180, 166, 0.1);
    border-radius: 0.5rem;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .api-key-help p {
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }

  .api-key-help ol {
    margin: 0;
    padding-left: 1.25rem;
  }

  .api-key-help li {
    margin-bottom: 0.25rem;
  }

  .api-key-help a {
    color: rgba(121, 180, 166, 1);
    text-decoration: none;
  }

  .api-key-help a:hover {
    text-decoration: underline;
  }

  .setting-checkbox {
    margin-right: 0.5rem;
  }

  .radio-group {
    display: flex;
    gap: 1rem;
  }

  .radio-label {
    display: flex;
    align-items: center;
    font-weight: normal;
    margin-bottom: 0;
  }

  .radio-input {
    margin-right: 0.5rem;
  }

  .settings-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .save-button,
  .test-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-button {
    background: rgba(121, 180, 166, 0.8);
    color: white;
  }

  .save-button:hover {
    background: rgba(121, 180, 166, 1);
  }

  .test-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .test-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  .test-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
