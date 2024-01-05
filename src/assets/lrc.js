// 通过当前时间和歌词数据，获取当前歌词和歌词进度
export const getCurLrc = (time, lrc) => {
  const list = formatLrcList(lrc)
  let text = ''
  // 判断当前展示哪一行歌词
  // 判断逻辑为，如果当前时间小于下一个，那么聚焦上一行
  let i = 0;
  while (i < list.length) {
    if (time > list[i].starTime) {
      i++
    } else {
      break
    }
  }
  const curItem = list[i - 1];
  let keyStyle = ''
  if (curItem) {
    text = `${curItem?.text}`
  // 这里知道是哪一行了，需要计算当前行应该展示哪一个字，同时展示当前字的百分比
    let j = 0
    const children = curItem.children;
    while (j < children.length) {
      if (time < children[j].starTime) {
        break
      } else {
        j++
      }
    }
    // 聚焦到小于开始时间的前一个字
    j = j - 1
    // 计算当前字应该走到的百分比
    const precent = j / children.length
    // 计算时间差值在当前字的持续时间占比，求出字的百分比
    const wordPrecent = ((time) - children[j].starTime) / (children[j].endTime - children[j].starTime) * (1 / children.length)
    keyStyle = `-webkit-linear-gradient(left, rgb(230, 141, 25) ${precent * 100 + wordPrecent * 100}%, rgb(0,0,0) 0%)`
  }
  return {
    style: keyStyle,
    text,
  }
}


const formatLrcList = (lrc) => {
  // 第一步我们先把数据拆分为数组
  let lrcList = lrc.split('\n');
  // 然后我们把时间和数字进行拆分
  lrcList = lrcList.map(item => {
    const lrcItme = {}
    const times = item.match(/\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/g) ?? null
    const text = item.match(/(?<=\])\S\s?(?=\[)/g) ?? null
    if (!text) {
      return {
        text: null
      };
    }
    lrcItme.starTime = formtTime(times[0])
    lrcItme.endTime = formtTime(times[times.length - 1])
    lrcItme.text = text.join('')
    lrcItme.source = item
    lrcItme.children = text.map((key, index) => {
      return {
        text: key,
        starTime: formtTime(times[index]),
        endTime: formtTime(times[index + 1]),
      }
    })
    return lrcItme
  })
  lrcList = lrcList.filter(item => item.text)
  return lrcList
}

const formtTime = (str) => {
  let mSec = 2;
  let time = 0;
  // 第一位是分，第二位是秒，第三位是毫秒
   const timeArr = /\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/.exec(str)?.map((item, index) => {
   // 因为毫秒分为两位数和三位数，所以这里当匹配到第四位，也就是真正的毫秒需要判断当前文件的毫秒是那种情况
   if (index === 4) {
      mSec = item?.length ?? mSec;
    }
     return Number(item)
   });
   time = timeArr[1] * 60 + timeArr[2] + (timeArr[4] / (mSec.length === 2 ? 100 : 1000) ?? 0)
   return Number(time.toFixed(3))
}


