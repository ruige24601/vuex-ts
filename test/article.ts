import { computed, reactive, Ref, watchEffect } from 'vue'
import Vuex from '../src'
import logPlugin from './logPlugin'
// import devtool from './devtool'
// 状态的类型
interface State {
  id: number | string
  title: string
  content: string
}
// 计算属性的类型
interface Getters {
  double: Ref<string>
}
// 方法的类型
interface Mutations {
  SET_TITLE?: (name: string) => void
}
// 1. 安装插件(可选)
Vuex.install([logPlugin])
// 2. 创建store 。 可以多次调用 createStore 方法创建多个 store
const articleStore = Vuex.createStore<State, Getters, Mutations>(() => {
  const state: State = reactive({
    id: '1',
    title: 'Flowers title! ',
    content: 'beautiful flower',
  })

  const getters: Getters = {
    double: computed(() => state.title + state.title),
  }

  // 2.1 支持 同步和异步两种写法
  const mutations: Mutations = {
    SET_TITLE(title) {
      return Promise.resolve().then(() => {
        state.title = title
      })
    },
  }

  return {
    state,
    getters,
    mutations,
  }
})

/**********  测试  *********/
watchEffect(() => {
  console.log(articleStore.title)
  // 或者 console.log(articleStore.state.title)
  console.log(articleStore.double.value)
  // 或者 console.log(articleStore.getters.double.value)
  console.log(articleStore.SET_TITLE.loading.value)
  // 或者 console.log(articleStore.SET_TITLE.loading.value)
})

articleStore.SET_TITLE('tree')
// 或者 articleStore.mutations.SET_TITLE('tree')

