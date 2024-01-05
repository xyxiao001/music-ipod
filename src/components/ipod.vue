<script setup>
import { ref, watch } from 'vue'
  
const props = defineProps({
  list: {
    type: Array,
    default: [],
  },
  musicInfo: {
    type: Object,
    default: () => {},
  },
  loading: Boolean,
})

const emit = defineEmits(['play', 'toogle'])

const selected = ref('')

const musicListRef = ref(null)
watch(() => props.musicInfo, (val) => {
  if (val && musicListRef.value) {
    const listChild = musicListRef.value.children;
    const index = [...props.list].findIndex(item => val.id === `${item?.id}${item.music?.id}`)
    listChild[index]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }
}, {
  deep: true,
  immediate: true,
})

</script>

<template>
  <div class="container">
    <div class="ipod small">
      <div class="screen">
  			<div class="title-bar">
  				<div class="play-icon"></div>
  				<div class="title">iPod</div>
  				<div class="battery small"></div>	
  			</div>
        <div v-if="!loading" class="menu-options" ref="musicListRef">
          <section 
             v-for="(item, index) in list"
             class="option"
             :id="`${item?.id}${item.music?.id}`"
             :class="{
               'selected': musicInfo?.id === `${item?.id}${item.music?.id}`,
               'actived': musicInfo?.id === `${item?.id}${item.music?.id}`,
             }"
             @click="$emit('play', item)"
            >
             {{ index + 1 }} {{ item.name }}
           </section>
  			</div>
        <div v-else class="menu-options">
          <section class="option">加载音乐中...</section>
  			</div>
  		</div>	
      <div class="outer-ring">
        <svg viewBox="-150 5 350 350">
  				<path id="curve" d="m0,30 c16,-4 32,-4 48,0" />
  				<text>
  					<textPath xlink:href="#curve">menu</textPath>
  				</text>
  			</svg>
        <div class="skip forward"></div>
  			<div class="skip back"></div>
        <div class="play-pause"></div>
  			<div class="touch-wheel">
  				<div class="center-button" @click="$emit('toogle')"></div>
  			</div>				
  		</div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100vw;
  margin-bottom: -250px;
  align-items: center;
  justify-content: center;
}
.ipod {
  width: 415px;
  height: 692px;
  border: 1px solid transparent;
  border-radius: 38px;
  background: linear-gradient(45deg, #e3e4e5, #ffffff);
  box-shadow: inset 5px -5px 15px 0px grey;
}
.ipod.small {
  transform: scale(0.48, 0.48) translate3d(-5%, -54%, 0);
}
.screen {
  position: relative;
  margin: 30px auto 0px auto;
  width: 284px;
  height: 230px;
  background: linear-gradient(135deg, #a5a59b, #d6d5d0);
  border-radius: 10px;
  box-shadow: inset 0px 0px 10px 2px #4d4d4d;
  font-family: "ChicagoFont", "Arial";
  font-size: 130%;
  color: #484647;
}
.title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.title-bar {
  position: absolute;
  left: 5px;
  right: 5px;
  height: 16%;
  border-bottom: 2px solid #484647;
  text-align: center;
}
.play-icon {
  position: absolute;
  display: inline-block;
  top: 50%;
  left: 10px;
  transform: translate(0, -50%);
  border-left: 18px solid #484647;
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
  height: 0;
  width: 0;
}
.battery {
  position: absolute;
  right: 5px;
  height: 50px;
  width: 100px;
  background-color: #c1c1ba;
  border: 5px solid #484647;
}
.battery:before {
  content: "";
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translate(0, -50%);
  height: 33%;
  width: 7px;
  background-color: #c1c1ba;
  border-right: 5px solid #484647;
  border-top: 5px solid #484647;
  border-bottom: 5px solid #484647;
}
.battery:after {
  content: "";
  position: absolute;
  top: 5px;
  bottom: 5px;
  left: 5px;
  width: 70px;
  background: repeating-linear-gradient(to right, #484647, #484647 20px, #c1c1ba 20px, #c1c1ba 25px, #484647 25px, #484647 45px, #c1c1ba 45px, #c1c1ba 50px, #484647 50px, #484647 70px);
}
.battery.small {
  transform: scale(0.3, 0.3);
  transform-origin: 100% 25%;
}
.menu-options {
  display: flex;
  flex-direction: column;
  position: relative;
  top: 17%;
  height: 81%;
  overflow: auto;
}
.option {
  padding-left: 12px;
  padding-top: 2px;
  padding-bottom: 2px;
}
.option:after {
  content: "";
  position: absolute;
  right: 18px;
  border-bottom: 3px solid #484647;
  border-right: 3px solid #484647;
  width: 8px;
  height: 8px;
  transform: rotate(-45deg) skew(7deg, 7deg);
  transform-origin: 180%;
}
.option.selected {
  background-color: #484647;
  border-bottom: 2px solid #484647;
  color: #c1c1ba;
}
.option.selected:after {
  border-bottom: 3px solid #c1c1ba;
  border-right: 3px solid #c1c1ba;
}

.option.actived {
  color: #e6a23c;
}
.outer-ring {
  position: relative;
  margin: 0 auto;
  top: 30px;
  height: 350px;
  width: 350px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: inset 5px -5px 30px -7px #595959;
}
.outer-ring:before,
.outer-ring:after {
  content: "";
  position: absolute;
  width: 0;
  height: 99%;
  border: 1px solid #4d4d4d;
}
.outer-ring:before {
  left: 50%;
  transform: rotate(45deg);
}
.outer-ring:after {
  top: 0;
  left: 50%;
  transform: rotate(135deg);
}
.touch-wheel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 276px;
  width: 276px;
  border: 2px solid #4d4d4d;
  border-radius: 50%;
  background: radial-gradient(farthest-side at 90% -70%, #999999, #f2f2f2);
  box-shadow: 5px -5px 30px -7px #595959;
  z-index: 1;
}
.center-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 100px;
  width: 100px;
  border: 2px solid #babdc1;
  border-radius: 50%;
  background-color: #cbccce;
  background: radial-gradient(farthest-side at -90% 80%, #999999, #f2f2f2);
  user-select: none;
}

.center-button:active {
  background: #e5e5e5;
  -webkit-box-shadow: inset 0px 0px 5px #c1c1c1;
     -moz-box-shadow: inset 0px 0px 5px #c1c1c1;
          box-shadow: inset 0px 0px 5px #c1c1c1;
   outline: none;
}

  
text {
  font-family: "Arial";
  font-size: 110%;
  font-weight: bold;
  fill: #babdc1;
}
path {
  fill: transparent;
}
.skip {
  position: absolute;
  top: 50%;
  transform: translate(0, -50%);
  background-color: #babdc1;
  height: 12px;
  width: 4px;
}
.skip:before,
.skip:after {
  content: "";
  position: absolute;
  border-left: 9px solid #babdc1;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}
.skip:before {
  left: -9px;
}
.skip:after {
  left: -18px;
}
.skip.forward {
  right: 7px;
}
.skip.back {
  left: 7px;
  transform: rotate(180deg) translate(0, 50%);
}
.play-pause {
  position: absolute;
  bottom: 12px;
  left: 50%;
  height: 0;
  width: 0;
  transform: translate(-13px, 0);
  border-left: 12px solid #babdc1;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}
.play-pause:before {
  content: "";
  position: absolute;
  bottom: -6px;
  left: 4px;
  height: 12px;
  width: 10px;
  background: repeating-linear-gradient(to right, #babdc1, #babdc1 4px, transparent 4px, transparent 6px, #babdc1 6px, #babdc1 10px);
}
_:-ms-lang(x),
.ipod {
  box-shadow: inset 5px -5px 25px 3px #999999;
}
_:-ms-lang(x),
.screen {
  box-shadow: inset 0px 0px 20px 1px #595959;
}
_:-ms-lang(x),
.outer-ring {
  box-shadow: inset 5px -5px 50px -7px #999999;
}
_:-ms-lang(x),
.touch-wheel {
  box-shadow: 5px -5px 50px -7px #999999;
}

</style>