import { useGet } from '~/utils/request'
import type { PageData, SearchParams, SearchResultItem } from '../../types'

/**
 * 搜索音乐
 */
export function searchMusic(params: SearchParams) {
  return useGet<PageData<SearchResultItem>>('/search', params)
}
