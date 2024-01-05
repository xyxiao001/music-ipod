import localforage from 'localforage'
import * as mm from 'music-metadata-browser';
import { get } from 'lodash-es'

/**
 * 所有对数据操作的集合，包括存储数据， 查询数据
 * 缓存设计表
 *   歌曲的储存方式
 *   MusicList  不缓存，读飞书文档数据
 *   music -> 储存歌曲媒体信息和歌曲远程地址，媒体信息第一次需要远程读取，然后储存
 *   --- muisc id  =  music.name + music.id
 *   lrc ->   歌词, 读取远程 lrc 文件时，储存在本地
 *   -- lrc id = lrc.name + lrc.id
 */

/** 
* 缓存音乐表
* 字段设计
* id -> 歌曲主键
* mediaInfo -> 歌曲媒体相关信息
* lrc -> 歌词相关信息
* url -> 歌曲远程播放地址
* bufferId -> 歌曲如果缓存到本地对应本地储存的 buffer 流地址
*/
const MusicCacheList = 'MUSIC_CACHE_LIST'

const getMusicCacheList = async () => {
  return await localforage.getItem(MusicCacheList) ?? []
}

const findMusic = (info, list) => {
  const obj = list.find(item => {
    return item.id === `${info.id}${info.music?.id}`
  })
  return obj ?? null;
}

const getMusicUrl = async (table, info) => {
  const field = await table.getField(
    info.music.id
  )
  const value = await field.getAttachmentUrls(info.id) ?? [];
  // 这里是获取了歌曲的 url 信息
  const url = value[0] ?? ''
  return url
}

const getMusicDataFromTable = async (table, info) => {
  console.log('从远程获取', info.name)
  const url = await getMusicUrl(table, info)
  // 然后需要远程读取媒体端信息
  let metadata = null;
  try {
    metadata = await mm.fetchFromUrl(url);
  } catch (error) {
    console.log('媒体端信息获取失败', error)
  }
  return {
    name: info.name,
    id: `${info.id}${info.music?.id}`,
    mediaInfo: transformMusicInfo(metadata),
    bufferId: '',
    url,
  }
}

const getMusicLrcFromTable = async (table, info) => {
  try {
    const field = await table.getField(
      info.lrc.id
    )
    const value = await field.getAttachmentUrls(info.id);
    const url = value[0]
    // 通过文件流获取歌词
    const reponse = await fetch(url, {
      methods: 'get',
      responseType: 'arraybuffer'
    }).then(response => response.text())
    return reponse
  } catch (err) {
    console.log(err, '歌词获取失败')
  }
  return ''
}


/**
* 获取音乐文件数据
*/
export const getMusicData = async (table, { ...info }) => {
  // 歌曲数据 通过 data.id + music.id 作为主键储存
  let music = null
  try {
    const list = await getMusicCacheList()
    music = findMusic(info, list) ?? null
    if (!music) {
      // 表示当前数据都需要重新获取
      music = await getMusicDataFromTable(table, info)
      music.lrc = await getMusicLrcFromTable(table, info)
    } else {
      console.log('从缓存获取', info.name)
      // 这里也需要去更新 url，因为飞书的 url 很快会过期
      music.url = await getMusicUrl(table, info);
    }
    await addMusicCache(music)
  } catch (error) {
    console.log(error)
  }
  console.log('正在播放', music)
  return music
}

export const addMusicCache = async (music) => {
  console.log('add cache')
  try {
    const list = await getMusicCacheList()
    if (music) {
      const index = list.findIndex(item => {
        return item.id === music.id;
      })
      if (index === -1) {
        list.push(music)
      } else {
        list[index] = music
      }
      localforage.setItem(MusicCacheList, list)
    }
  } catch (error) {
    console.log(error, 'add-error')
  }
}

export const uint8arrayToBase64 = (u8Arr) => {
  let CHUNK_SIZE = 0x8000; //arbitrary number
  let index = 0;
  let length = u8Arr.length;
  let result = '';
  let slice;
  while (index < length) {
    slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
    result += String.fromCharCode.apply(null, slice);
    index += CHUNK_SIZE;
  }
  return btoa(result);
}


// 格式化歌曲信息保存
export const transformMusicInfo = (obj) => {
  const result = {
    // 歌曲名
    name: get(obj, 'common.title', ''),
    // 专辑名
    album: get(obj, 'common.album', ''),
    // 专辑主导艺人
    albumartist: get(obj, 'common.albumartist', ''),
    // 专辑艺人
    artist: get(obj, 'common.artist', ''),
    // 专辑艺人列表
    artists: get(obj, 'common.artists', []),
    // 专辑备注: 
    comment: get(obj, 'common.comment', []),
    // 歌曲时间
    date: get(obj, 'common.date', 0),
    // 歌曲图片
    picture: get(obj, 'common.picture', []).map((item) => {
      return `data:${item.format};base64,${uint8arrayToBase64(item.data)}`
    }),
    // 编码方式
    codec: get(obj, 'format.codec', ''),
    // 歌曲时长
    duration: get(obj, 'format.duration', 0),
    // 歌曲采样率
    sampleRate: get(obj, 'format.sampleRate', ''),
  }
  return result
}