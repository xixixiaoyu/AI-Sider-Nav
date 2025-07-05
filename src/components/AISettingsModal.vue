<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <!-- 模态框头部 -->
          <div class="modal-header">
            <h2>{{ $t('aiAssistantSettings') }}</h2>
            <button class="close-btn" @click="$emit('close')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <!-- 模态框内容 -->
          <div class="modal-content">
            <!-- API Key 设置 -->
            <div class="setting-section">
              <h3>{{ $t('apiKeySettings') }}</h3>
              <div class="setting-item">
                <label for="apiKey">DeepSeek API Key</label>
                <div class="input-group">
                  <input
                    id="apiKey"
                    v-model="localSettings.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    placeholder="sk-..."
                    class="input-field"
                  />
                  <button class="toggle-btn" @click="showApiKey = !showApiKey">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        v-if="showApiKey"
                        d="M17.94 17.94C16.2306 19.6494 13.8896 20.6328 11.4496 20.6328C9.00956 20.6328 6.66857 19.6494 4.95918 17.94C3.24979 16.2306 2.26636 13.8896 2.26636 11.4496C2.26636 9.00956 3.24979 6.66857 4.95918 4.95918C6.66857 3.24979 9.00956 2.26636 11.4496 2.26636C13.8896 2.26636 16.2306 3.24979 17.94 4.95918"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        v-else
                        d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <circle
                        v-if="!showApiKey"
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                  </button>
                </div>
                <p class="setting-description">
                  请在
                  <a href="https://platform.deepseek.com" target="_blank">DeepSeek 平台</a> 获取您的
                  API Key
                </p>
              </div>
            </div>

            <!-- 模型设置 -->
            <div class="setting-section">
              <h3>{{ $t('modelSettings') }}</h3>
              <div class="setting-item">
                <label for="model">模型</label>
                <select id="model" v-model="localSettings.model" class="select-field">
                  <option value="deepseek-chat">DeepSeek Chat</option>
                  <option value="deepseek-coder">DeepSeek Coder</option>
                </select>
              </div>

              <div class="setting-item">
                <label for="temperature">{{ $t('temperatureSettings') }}</label>
                <div class="slider-group">
                  <input
                    id="temperature"
                    v-model.number="localSettings.temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    class="slider"
                  />
                  <span class="slider-value">{{ localSettings.temperature }}</span>
                </div>
                <p class="setting-description">控制回复的创造性，0 表示更准确，1 表示更有创意</p>
              </div>
            </div>

            <!-- 行为设置 -->
            <div class="setting-section">
              <h3>行为设置</h3>
              <div class="setting-item">
                <label class="checkbox-label">
                  <input v-model="localSettings.showThinking" type="checkbox" class="checkbox" />
                  <span class="checkbox-text">显示 AI 思考过程</span>
                </label>
              </div>

              <div class="setting-item">
                <label class="checkbox-label">
                  <input v-model="localSettings.autoFocus" type="checkbox" class="checkbox" />
                  <span class="checkbox-text">打开侧边栏时自动聚焦输入框</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 模态框底部 -->
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleCancel">
              {{ $t('cancel') }}
            </button>
            <button class="btn btn-primary" @click="handleSave">
              {{ $t('save') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useAIAssistantStore } from '@/stores'
  import { setApiKey, removeApiKey, validateApiKey } from '@/services/configService'
  import { i18n } from '@/i18n'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'close'): void
    (e: 'update:visible', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const aiStore = useAIAssistantStore()

  // 本地状态
  const isVisible = ref(props.visible)
  const showApiKey = ref(false)
  const localSettings = ref({
    apiKey: aiStore.settings.apiKey,
    model: aiStore.settings.model,
    temperature: aiStore.settings.temperature,
    showThinking: aiStore.settings.showThinking,
    autoFocus: aiStore.settings.autoFocus,
  })

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 监听 visible 变化
  watch(
    () => props.visible,
    (newValue) => {
      isVisible.value = newValue
      if (newValue) {
        // 重置本地设置
        localSettings.value = {
          apiKey: aiStore.settings.apiKey,
          model: aiStore.settings.model,
          temperature: aiStore.settings.temperature,
          showThinking: aiStore.settings.showThinking,
          autoFocus: aiStore.settings.autoFocus,
        }
      }
    }
  )

  // 处理遮罩层点击
  const handleOverlayClick = () => {
    emit('close')
  }

  // 处理取消
  const handleCancel = () => {
    emit('close')
  }

  // 处理保存
  const handleSave = async () => {
    try {
      // 处理 API Key 的变化
      const currentApiKey = aiStore.settings.apiKey
      const newApiKey = localSettings.value.apiKey?.trim() || ''

      if (newApiKey !== currentApiKey) {
        if (newApiKey) {
          // 验证新的 API Key
          const isValid = await validateApiKey(newApiKey)
          if (!isValid) {
            alert('API Key 无效，请检查后重试')
            return
          }
          await setApiKey(newApiKey)
        } else {
          // 如果新的 API Key 为空，删除存储的 API Key
          await removeApiKey()
        }
      }

      // 更新设置
      await aiStore.updateSettings(localSettings.value)

      emit('close')
    } catch (error) {
      console.error('保存设置失败:', error)
      alert('保存设置失败，请重试')
    }
  }
</script>

<style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .close-btn {
    padding: 4px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .setting-section {
    margin-bottom: 32px;
  }

  .setting-section:last-child {
    margin-bottom: 0;
  }

  .setting-section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .setting-item {
    margin-bottom: 20px;
  }

  .setting-item:last-child {
    margin-bottom: 0;
  }

  .setting-item label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-field,
  .select-field {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    color: #374151;
    transition: border-color 0.2s ease;
  }

  .input-field:focus,
  .select-field:focus {
    outline: none;
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  .toggle-btn {
    padding: 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: #f9fafb;
    color: #374151;
  }

  .slider-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .slider {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #e5e7eb;
    outline: none;
    cursor: pointer;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #14b8a6;
    cursor: pointer;
  }

  .slider-value {
    font-weight: 500;
    color: #374151;
    min-width: 24px;
    text-align: center;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox {
    width: 16px;
    height: 16px;
    accent-color: #14b8a6;
  }

  .checkbox-text {
    color: #374151;
  }

  .setting-description {
    margin: 8px 0 0 0;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
  }

  .setting-description a {
    color: #14b8a6;
    text-decoration: none;
  }

  .setting-description a:hover {
    text-decoration: underline;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-primary {
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    color: white;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  }

  /* 动画 */
  .modal-enter-active,
  .modal-leave-active {
    transition: all 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .modal-container {
      max-width: 100%;
      margin: 0;
      border-radius: 0;
      height: 100vh;
      max-height: 100vh;
    }
  }
</style>
