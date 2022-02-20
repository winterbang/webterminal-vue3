<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch, computed } from 'vue'
import { Terminal } from 'xterm'
// import { AttachAddon } from 'xterm-addon-attach'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import xtermTheme from "xterm-theme"
import 'xterm/css/xterm.css'

defineProps({
  socketURL: {
    type: String
  }
})

const socketURL = 'ws://localhost:3031/'
const socket = new WebSocket(socketURL)
socket.onopen = event => console.log("WebSocket is open now.")
socket.addEventListener('message', (event) => {
    let data = typeof event.data === 'string' ? event.data : new Uint8Array(event.data)
    socket.dispatchEvent(new CustomEvent('myselfevent', {detail: {data}}))
})
socket.addEventListener('error', (event) => console.log('WebSocket error: ', event))
socket.onclose = event => console.log("WebSocket is closed now.")

const terminals = reactive([])
const tabs = reactive([])
const themes = reactive(Object.keys(xtermTheme))
const curTheme = ref(localStorage.getItem('theme', ''))
let terminal = null
onMounted(() => {
  if (terminals.length == 0) {
    let tab = { name: "tab0", children: [] };
    createTerminal(tab);
  }
})

watch(curTheme, (value) => {
  terminal.setOption('theme', xtermTheme[value])
  localStorage.setItem("theme", value);
})

const headerStyle = computed(() => {
  return {
    color: xtermTheme[curTheme.value] ? xtermTheme[curTheme.value].foreground : '#fff',
    background: xtermTheme[curTheme.value] ? xtermTheme[curTheme.value].background : '#000'
  }
})

function createTerminal(tab) {
  terminal = new Terminal({ theme: xtermTheme[curTheme.value] || '',cursorBlink: true })
  const terminalName = `${tab.name}-terminal${tab.children.length}`
  tab.children.push({terminal, name: terminalName})
  tabs.push(tab)

  // socket.send('create', {name: terminalName})
  socket.addEventListener(`myselfevent`, (event) => {
    console.log('myselfevent =========', event.detail)
    terminal.write(event.detail.data)
  })

  const fitAddOn = new FitAddon()
  // const attachAddon = new AttachAddon(socket)
  const webLinksAddon = new WebLinksAddon()
  // terminal.loadAddon(attachAddon)
  terminal.loadAddon(fitAddOn)
  terminal.loadAddon(webLinksAddon)

  terminal.open(document.getElementById('terminal0'))
  terminal.focus()
  fitAddOn.fit()

  terminal.onData(data => socket.send(data))
  // terminal.onBinary(data => socket.sendBinary(data))

  terminal.onResize(size => {
    console.log(size, 'size====')
    // this.socket.emit(terminalname + "-resize", [size.cols, size.rows]);
  });


  window.addEventListener("resize", () => {
    fitAddOn.fit();
  });
}

onBeforeUnmount(() => {
  // terminal.dispose()
  console.log('=======')
})


</script>

<template>
  <header :style="headerStyle">
    <span>终端</span>
    <div>
      <select v-model="curTheme">
        <option :value="theme" v-for="theme in themes" :key="theme">{{theme}}</option>
      </select>
    </div>
  </header>
  <div class="terminal-page">

    <div class="terminals-wrap" id="terminal0">

    </div>
  </div>
</template>

<style>
body {
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  z-index: 2;
  line-height: 40px;
  padding: 0 10px;
  border-bottom: 1px solid #909399;
}
.terminal-page {
  height: calc(100% - 45px);
}
.terminals-wrap {
  height: 100%;
}

.xterm-viewport {
  width: 100% !important;
}
</style>
