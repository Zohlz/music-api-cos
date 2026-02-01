// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 分页数据格式
export interface PageData<T = any> {
  total: number
  rows: T[]
}

// 分页参数
export interface PageParams {
  pageNum: number
  pageSize: number
}

// 音乐数据模型
export interface Music {
  musicId: number
  songId: string
  songName: string
  artist: string
  album: string
  duration: number
  coverUrl: string
  audioUrl: string
  lyricUrl: string
  source: string
  playCount: number
  status: 0 | 1
  createTime: string
  updateTime: string
}

// 搜索结果项
export interface SearchResultItem {
  songId: string
  songName: string
  artist: string
  album: string
  duration: number
  coverUrl: string
  playCount: number
}

// 音乐解析请求参数
export interface ParseMusicParams {
  songId: string
  songName: string
  artist: string
  album: string
  duration: number
  coverUrl: string
}

// 音乐列表查询参数
export interface MusicListParams extends PageParams {
  songName?: string
  artist?: string
}

// 搜索参数
export interface SearchParams extends PageParams {
  keyword: string
}
