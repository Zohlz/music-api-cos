import dayjs from 'dayjs'

/**
 * 格式化时长（秒 -> mm:ss）
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateStr: string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!dateStr) return '-'
  return dayjs(dateStr).format(format)
}

/**
 * 格式化日期
 */
export function formatDate(dateStr: string, format = 'YYYY-MM-DD'): string {
  if (!dateStr) return '-'
  return dayjs(dateStr).format(format)
}

/**
 * 格式化播放次数
 */
export function formatPlayCount(count: number): string {
  if (!count || count <= 0) return '0'
  if (count >= 100000000) {
    return `${(count / 100000000).toFixed(1)}亿`
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}
