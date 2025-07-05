<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="calendar-modal-overlay" @click="handleOverlayClick">
        <div class="calendar-modal" @click.stop>
          <!-- 日历头部 -->
          <div class="calendar-header">
            <button class="nav-button" @click="previousMonth">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <div class="month-year">
              <h3 class="month-name">{{ currentMonthName }}</h3>
              <span class="year">{{ currentYear }}</span>
            </div>

            <button class="nav-button" @click="nextMonth">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <button class="close-button" @click="closeModal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <!-- 星期标题 -->
          <div class="weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday">
              {{ day }}
            </div>
          </div>

          <!-- 日历网格 -->
          <div class="calendar-grid">
            <div
              v-for="date in calendarDates"
              :key="`${date.year}-${date.month}-${date.day}`"
              class="calendar-date"
              :class="{
                'other-month': date.isOtherMonth,
                today: date.isToday,
                selected: date.isSelected,
                'has-holiday': date.holidays.length > 0,
              }"
              @click="selectDate(date)"
            >
              <div class="date-number">{{ date.day }}</div>
              <div v-if="date.holidays.length > 0" class="holiday-info">
                <div
                  v-for="holiday in date.holidays.slice(0, 2)"
                  :key="holiday.name"
                  class="holiday-name"
                  :style="{ color: holiday.color }"
                >
                  {{ holiday.name }}
                </div>
              </div>
            </div>
          </div>

          <!-- 今日信息 -->
          <div class="today-info">
            <div class="today-date">
              <span class="today-label">今天</span>
              <span class="today-full-date">{{ todayFullDate }}</span>
            </div>
            <button class="today-button" @click="goToToday">回到今天</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useSettingsStore } from '@/stores/settings'
  import { getHolidaysForDate, type Holiday } from '@/data/holidays'

  interface CalendarDate {
    day: number
    month: number
    year: number
    isToday: boolean
    isOtherMonth: boolean
    isSelected: boolean
    date: Date
    holidays: Holiday[]
  }

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'date-selected', date: Date): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const settingsStore = useSettingsStore()

  // 响应式状态
  const currentDate = ref(new Date())
  const selectedDate = ref(new Date())
  const today = new Date()

  // 计算属性
  const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
  })

  const currentYear = computed(() => currentDate.value.getFullYear())
  const currentMonth = computed(() => currentDate.value.getMonth())

  const currentMonthName = computed(() => {
    const months = [
      '一月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ]
    return months[currentMonth.value]
  })

  const weekdays = computed(() => {
    const weekStartsOnMonday = settingsStore.settings.calendar.weekStartsOn === 'monday'
    return weekStartsOnMonday
      ? ['一', '二', '三', '四', '五', '六', '日']
      : ['日', '一', '二', '三', '四', '五', '六']
  })

  const todayFullDate = computed(() => {
    return today.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  })

  const calendarDates = computed(() => {
    const dates: CalendarDate[] = []
    const year = currentYear.value
    const month = currentMonth.value

    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // 获取第一周的开始日期
    const weekStartsOnMonday = settingsStore.settings.calendar.weekStartsOn === 'monday'
    let startDate = new Date(firstDay)
    const firstDayOfWeek = firstDay.getDay()

    if (weekStartsOnMonday) {
      // 周一开始
      const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
      startDate.setDate(firstDay.getDate() - daysToSubtract)
    } else {
      // 周日开始
      startDate.setDate(firstDay.getDate() - firstDayOfWeek)
    }

    // 生成6周的日期（42天）
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const isToday = date.toDateString() === today.toDateString()
      const isOtherMonth = date.getMonth() !== month
      const isSelected = date.toDateString() === selectedDate.value.toDateString()
      const holidays = getHolidaysForDate(date.getMonth(), date.getDate())

      dates.push({
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isToday,
        isOtherMonth,
        isSelected,
        date: new Date(date),
        holidays,
      })
    }

    return dates
  })

  // 方法
  const closeModal = () => {
    isVisible.value = false
  }

  const handleOverlayClick = () => {
    closeModal()
  }

  const previousMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
  }

  const nextMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
  }

  const selectDate = (date: CalendarDate) => {
    selectedDate.value = new Date(date.date)
    emit('date-selected', new Date(date.date))

    // 如果选择的是其他月份的日期，跳转到那个月
    if (date.isOtherMonth) {
      currentDate.value = new Date(date.year, date.month, 1)
    }
  }

  const goToToday = () => {
    const now = new Date()
    currentDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
    selectedDate.value = new Date(now)
    emit('date-selected', new Date(now))
  }

  // 监听可见性变化，重置到当前月份
  watch(isVisible, (visible) => {
    if (visible) {
      const now = new Date()
      currentDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
      selectedDate.value = new Date(now)
    }
  })
</script>

<style scoped>
  .calendar-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .calendar-modal {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 520px;
    overflow: hidden;
    animation: modalSlideIn 0.3s ease-out;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    background: linear-gradient(135deg, #79b4a6 0%, #6ba394 100%);
    color: white;
    position: relative;
  }

  .nav-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .nav-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .month-year {
    text-align: center;
    flex: 1;
  }

  .month-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
  }

  .year {
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .close-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease;
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }

  .weekday {
    padding: 0.75rem 0.5rem;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 600;
    color: #6c757d;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: white;
  }

  .calendar-date {
    min-height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    color: #333;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    position: relative;
    padding: 4px 2px;
  }

  .calendar-date:hover {
    background: #f8f9fa;
  }

  .calendar-date.other-month {
    color: #adb5bd;
  }

  .calendar-date.today {
    background: #79b4a6;
    color: white;
    font-weight: 600;
  }

  .calendar-date.today:hover {
    background: #6ba394;
  }

  .calendar-date.selected {
    background: #e3f2fd;
    color: #1976d2;
    border-color: #1976d2;
  }

  .date-number {
    font-weight: 600;
    margin-bottom: 2px;
  }

  .holiday-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    width: 100%;
  }

  .holiday-name {
    font-size: 0.65rem;
    font-weight: 600;
    text-align: center;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    padding: 1px 2px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.8);
  }

  .calendar-date.has-holiday {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
  }

  .calendar-date.has-holiday:hover {
    background: linear-gradient(
      135deg,
      rgba(248, 249, 250, 0.95) 0%,
      rgba(233, 236, 239, 0.95) 100%
    );
  }

  .calendar-date.today.has-holiday {
    background: linear-gradient(135deg, #79b4a6 0%, #6ba394 100%);
  }

  .calendar-date.today.has-holiday .holiday-name {
    background: rgba(255, 255, 255, 0.9);
    color: #333;
  }

  .today-info {
    padding: 1rem 1.5rem;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #e9ecef;
  }

  .today-date {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .today-label {
    font-size: 0.75rem;
    color: #6c757d;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .today-full-date {
    font-size: 0.875rem;
    color: #333;
    font-weight: 500;
  }

  .today-button {
    background: #79b4a6;
    border: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .today-button:hover {
    background: #6ba394;
  }

  /* 动画 */
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-enter-active,
  .modal-leave-active {
    transition: all 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-from .calendar-modal,
  .modal-leave-to .calendar-modal {
    transform: scale(0.9) translateY(-20px);
  }

  /* 响应式设计 */
  @media (max-width: 480px) {
    .calendar-modal {
      max-width: 350px;
      margin: 0 1rem;
    }

    .calendar-header {
      padding: 1rem 1rem 0.75rem;
    }

    .month-name {
      font-size: 1.125rem;
    }

    .calendar-date {
      font-size: 0.85rem;
    }

    .today-info {
      padding: 0.75rem 1rem;
    }
  }
</style>
