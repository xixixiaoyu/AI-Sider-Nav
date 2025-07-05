export interface Holiday {
  name: string
  date: string // MM-DD格式
  type: 'national' | 'traditional' | 'international'
  color?: string
}

// 中国节日数据
export const holidays: Holiday[] = [
  // 法定节假日
  { name: '元旦', date: '01-01', type: 'national', color: '#ff6b6b' },
  { name: '劳动节', date: '05-01', type: 'national', color: '#ff6b6b' },
  { name: '国庆节', date: '10-01', type: 'national', color: '#ff6b6b' },
  { name: '国庆节', date: '10-02', type: 'national', color: '#ff6b6b' },
  { name: '国庆节', date: '10-03', type: 'national', color: '#ff6b6b' },

  // 传统节日和国际节日
  { name: '情人节', date: '02-14', type: 'international', color: '#ff69b4' },
  { name: '妇女节', date: '03-08', type: 'international', color: '#ff69b4' },
  { name: '植树节', date: '03-12', type: 'traditional', color: '#4ecdc4' },
  { name: '愚人节', date: '04-01', type: 'international', color: '#ffa726' },
  { name: '青年节', date: '05-04', type: 'traditional', color: '#42a5f5' },
  { name: '护士节', date: '05-12', type: 'international', color: '#ab47bc' },
  { name: '儿童节', date: '06-01', type: 'traditional', color: '#ffca28' },
  { name: '建党节', date: '07-01', type: 'national', color: '#ff6b6b' },
  { name: '建军节', date: '08-01', type: 'national', color: '#ff6b6b' },
  { name: '教师节', date: '09-10', type: 'traditional', color: '#66bb6a' },
  { name: '万圣节', date: '10-31', type: 'international', color: '#ff9800' },
  { name: '光棍节', date: '11-11', type: 'traditional', color: '#9c27b0' },
  { name: '圣诞节', date: '12-25', type: 'international', color: '#4caf50' },

  // 2025年特定节日（农历节日需要每年更新）
  { name: '春节', date: '01-29', type: 'traditional', color: '#f44336' },
  { name: '元宵节', date: '02-12', type: 'traditional', color: '#f44336' },
  { name: '龙抬头', date: '03-02', type: 'traditional', color: '#4caf50' },
  { name: '清明节', date: '04-05', type: 'traditional', color: '#4caf50' },
  { name: '端午节', date: '05-31', type: 'traditional', color: '#4caf50' },
  { name: '七夕节', date: '08-29', type: 'traditional', color: '#e91e63' },
  { name: '中秋节', date: '10-06', type: 'traditional', color: '#ff9800' },
  { name: '重阳节', date: '11-02', type: 'traditional', color: '#9c27b0' },
]

// 获取指定日期的节日
export function getHolidaysForDate(month: number, day: number): Holiday[] {
  const dateStr = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return holidays.filter((holiday) => holiday.date === dateStr)
}

// 检查是否为节日
export function isHoliday(month: number, day: number): boolean {
  return getHolidaysForDate(month, day).length > 0
}

// 获取节日颜色
export function getHolidayColor(month: number, day: number): string | undefined {
  const holidaysForDate = getHolidaysForDate(month, day)
  return holidaysForDate.length > 0 ? holidaysForDate[0].color : undefined
}
