import { useGet, usePost, useDelete } from '~/utils/request'
import type { Music, MusicListParams, PageData, ParseMusicParams } from '../../types'

/**
 * 解析并保存音乐
 */
export function parseMusic(data: ParseMusicParams) {
  return usePost<Music>('/music/parse', data)
}

/**
 * 获取音乐列表
 */
export function getMusicList(params: MusicListParams) {
  return useGet<PageData<Music>>('/music/list', params)
}

/**
 * 获取音乐详情
 */
export function getMusicDetail(musicId: number) {
  return useGet<Music>(`/music/${musicId}`)
}

/**
 * 获取播放信息
 */
export function getMusicPlayInfo(musicId: number) {
  return useGet<{ audioUrl: string }>(`/music/${musicId}/play`)
}

/**
 * 删除音乐
 */
export function deleteMusic(musicId: number) {
  return useDelete(`/music/${musicId}`)
}

/**
 * 批量删除音乐
 */
export function batchDeleteMusic(musicIds: number[]) {
  return useDelete('/music/batch', { musicIds })
}
