<script setup>
  import { bitable } from '@lark-base-open/js-sdk';
  import { onMounted, ref, watchEffect, computed } from 'vue'
  import { getCurLrc } from './assets/lrc'
  import { getMusicData } from './assets/local'
  import ipod from './components/ipod.vue'

  const base = bitable.base
  const formData = ref({ table: '' });
  const tableMetaList = ref([]);
  let tableInstance = null;

  const getTabelInstacne = () => {
      return tableInstance;
  }
  
  
async function getTable () {
    const [tableList, selection] = await Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()]);
    formData.value.table = selection.tableId;
    tableMetaList.value = tableList;
    const tableId = formData.value.table;
    if (tableId) {
      const table = await base.getTableById(tableId);
      return table
    }
    return null
  }

  const Theme = {
    normal: 0,
    ipod: 1,
  }
  const themeList = computed(() => {
    return Object.keys(Theme).map(item => {
      return {
        value: Theme[item],
        label: item,
      }
    })
  });
  // 关于主题
  const theme = ref(Theme.ipod)

  // 初始化获取当前表格的列表
  const list = ref([])
  const listLoading = ref(false)
  const playLoading = ref(false)

  const getMusicList = async() => {
    listLoading.value = true
    tableInstance = await getTable()
    const table = tableInstance
    const { records } = await table.getRecords({
      pageSize: 500,
    })
    // 这里处理获取的数据, text 为 name
    const musicList = []
    records.forEach((record, _index) => {
      const field = record.fields
      musicList.push({})
      Object.keys(field).forEach((item, index) => {
        // 这里处理读取到的每列数据拼接到一起
        const obj = musicList[_index] ?? {}
        const cur = field[item]?.[0] ?? {}
        if (!cur) return
        // 歌曲名称
        obj.id = record.recordId;
        cur.id = item;
        if (cur.type === 'text') {
          obj.name = cur.text
        }
        // 歌曲流
        if (cur.type?.includes('audio')) {
          obj.music = cur
        }
        // 歌词流
        if (cur.name?.includes('.lrc')) {
          obj.lrc = cur
        }
        musicList[_index] = obj;
      });
    })
    list.value = musicList.filter(item => item.name || item.music)
    listLoading.value = false
  }

  const musicInfo = ref(null)
  const lrcInfo = ref(null)

  const playMusic = async(info) => {
    const table = tableInstance
    musicInfo.value = null
    lrcInfo.value = null
    if (!info) {
      ElMessage('播放错误', info)
      return
    }
    if (!info.music) {
      ElMessage('请上传歌曲')
      return
    }
    if (playLoading.value) {
      ElMessage('上一首还在加载中.. 请稍后')
      return
    }
    playLoading.value = true
    try {
      const music = await getMusicData(table, info)
      musicInfo.value = music
    } catch (error) {
      console.log(error)
    }
    playLoading.value = false
  }

  const audio = ref()
  watchEffect((efftct) => {
    const lrc = musicInfo.value?.lrc ?? ''
    const instance = audio.value
    const navigator = window.navigator
    const MediaMetadata = window.MediaMetadata
    const mediaInfo = musicInfo.value?.mediaInfo ?? {}
    const baseUrl = 'https://p3-addone-sign.byteimg.com/tos-cn-i-hhc0kcolqq/939d114438f34b539213d9302b1753bd.jpg~tplv-hhc0kcolqq-image.image?x-expires=2011156978&x-signature=9WMjKgpWzZxCFOoXIpKp54nmMMA%3D'
      navigator.mediaSession.metadata = new MediaMetadata({
        title: mediaInfo.name ?? musicInfo.value?.name,
        artist: mediaInfo.artist,
        album: mediaInfo.album,
        artwork: [{
          src: mediaInfo.picture?.[0] ?? baseUrl,
          type: 'image/jpeg',
          sizes: '512x512'
        }]
      });
    if (instance) {
      instance.addEventListener('ended', playNext);
      instance.addEventListener('play', updateLrc);
      
    }
    efftct(() => {
      instance?.removeEventListener('ended', playNext)
      instance?.removeEventListener('play', updateLrc);
    })
  })

  const updateLrc = () => {
    const instance = audio.value
    const loop = () => {
     const lrc = musicInfo.value?.lrc ?? ''
     try {
       const info = getCurLrc(instance?.currentTime ?? 0, lrc)
        lrcInfo.value = info
        if (!instance?.paused) {
          requestAnimationFrame(loop)
        }
     } catch (err) {
       console.log(err)
     }
   }
   requestAnimationFrame(loop)
}

  // 注册播放事件
  const initNaviagator = () => {
    const navigator = window.navigator
    if (navigator.mediaSession) {
      navigator.mediaSession.setActionHandler('play', () => {
        audio.value?.play()
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        audio.value?.pause()
      })
      navigator.mediaSession.setActionHandler('stop', () => {
        audio.value?.stop()
      })
      navigator.mediaSession.setActionHandler('seekto', (evt) => {
        const currentTime = Number(evt.seekTime)
        audio.value?.seek(currentTime)
      })
      navigator.mediaSession.setActionHandler('seekbackward', (evt) => {
        const currentTime = Number(audio.value?.seek()) - 10
        audio.value?.seek(currentTime)
      });
      navigator.mediaSession.setActionHandler('seekforward', (evt) => {
        const currentTime = Number(audio.value?.seek()) + 10
        audio.value?.seek(currentTime)
      });
      navigator.mediaSession.setActionHandler('previoustrack', playNext);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
  }

  const playNext = () => {
    // 自动随机播放下一首
    const len = Math.floor(Math.random() * list.value.length - 1)
    console.log('随机播放', len, list.value[len])
    playMusic(list.value[len])
  }

  const handleToogle = () => {
    if (audio.value) {
      if (audio.value.paused) {
        audio.value.play()
      } else {
        audio.value.pause()
      }
    } else {
      playNext()
    }
  }
 
  onMounted(() => {
    getTable()
    getMusicList()
    initNaviagator()
  })
</script>

<template>
  <el-select class="theme-list" v-model="theme" placeholder="主题">
    <el-option
      v-for="item in themeList"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
  <el-button class="control-button" @click="getMusicList" type="primary">更新歌曲</el-button>
 <section v-if="theme === Theme.ipod" class="ipod-theme">
    <p 
      class="cur-lrc" :style="{'backgroundImage': lrcInfo?.style}">
      {{ lrcInfo?.text }}
    </p>
   <ipod
    :list="list"
    :loading="listLoading"
    :music-info="musicInfo"
    @play="info => playMusic(info)"
    @toogle="handleToogle"
   ></ipod>
 </section>
  <section v-if="theme === Theme.normal" class="normal-theme">
    <section class="music-list">
     <section 
       v-for="item in list"
       class="music-item"
       :id="`${item?.id}${item.music?.id}`"
       :class="{'active': musicInfo?.id === `${item?.id}${item.music?.id}`}"
       @click="playMusic(item)"
      >
       {{ item.name }}
     </section>
    </section>
  </section>

  <section v-if="musicInfo" v-show="theme === Theme.normal" class="music-info">
    <audio ref="audio" controls autoplay id="audio">
      <source :src="musicInfo.url" type="audio/mpeg">
      您的浏览器不支持 audio 元素。
    </audio>
    <p 
      v-if="lrcInfo" 
      class="cur-lrc" :style="{'backgroundImage': lrcInfo.style}">
      {{ lrcInfo?.text }}
    </p>
  </section>
</template>

<style scoped>
.control-button {
  margin: 8px;
}

.music-list {
  padding: 8px;
  height: 200px;
  overflow: auto;
}


.music-item {
  cursor: pointer;
  margin-bottom: 15px;
}

.lrc-item.active {
  color: red;
}

audio {
  margin: 15px;
}

.cur-lrc {
  display: inline-block;
  margin: 15px;
  background-clip: text;
  line-height: 20px;
  margin: 0;
  height: 20px;
  -webkit-background-clip: text;
  -moz-text-fill-color: transparent;
  -webkit-text-fill-color: transparent;
  background-image: -webkit-linear-gradient(left, rgb(230, 141, 25) 0%, rgb(0,0,0) 0%);
}

.active {
  color: red;
}
</style>
