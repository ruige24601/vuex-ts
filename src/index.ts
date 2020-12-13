import { ref, Ref } from 'vue'

const isFunction = (val) => typeof val === 'function'
const isObject = (val) => val !== null && typeof val === 'object'
const isPromise = (val) => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

type Plugin<S, G, M> = (store: Store<S, G, M>) => void

interface Options<S, G, M> {
  state: S
  getters: G
  mutations: M
}

interface loadingRef {
  loading: Ref<boolean>
}
interface MtWithLoading<M> {
  mutations: { [key in keyof M]: M[key] & loadingRef }
}

export interface Store<S, G, M> extends MtWithLoading<M> {
  state: S
  getters: G
  // mutations: MtWithLoading<M>
  _subscribers: []
  subscribe: any
  [key: string]: any
}

let plugins: Plugin<any, any, any>[]

const Vuex = {
  install(pluginsOpt?: Plugin<any, any, any>[]){
    plugins = pluginsOpt
  },
  createStore
}
export default Vuex

export function createStore<S extends object, G extends object, M extends object>(opFn) {
  type Loadings = { [key in keyof M]: Ref<boolean> }

  const options: Options<S, G, M> = isFunction(opFn) ? opFn() : opFn

  let { state: rawState, getters, mutations: rawMutations } = options

  const state = toReadOnly(rawState)

  const mutations: MtWithLoading<M> = new Proxy<MtWithLoading<M>>(
    rawMutations as MtWithLoading<M>,
    {
      get(target, key, receiver) {
        let fn = Reflect.get(target, key, receiver)
        if (!fn) return fn
        let loading = fn.loading
        if (fn.loading === null || fn.loading === undefined) {
          loading = fn.loading = ref(false)
        }
        let fnPx = new Proxy(fn, {
          apply(target, thisBinding, args) {
            store._subscribers
              .slice()
              .filter((sub: any) => sub.before)
              .forEach((sub: any) => sub.before({ type: key, payload: args }, rawState))

            let res = Reflect.apply(target, thisBinding, args)
            if (isPromise(res)) {
              loading.value = true
              res
                .then((resp) => {
                  loading.value = false

                  store._subscribers
                    .slice()
                    .filter((sub: any) => sub.after)
                    .forEach((sub: any) => sub.after({ type: key, payload: args }, rawState))

                  return resp
                })
                .catch((err) => {
                  loading.value = false

                  store._subscribers
                    .slice()
                    .filter((sub: any) => sub.error)
                    .forEach((sub: any) => sub.error({ type: key, payload: args }, rawState))

                  return Promise.reject(err)
                })
            } else {
              loading.value = false
              store._subscribers
                .slice()
                .filter((sub: any) => sub.after)
                .forEach((sub: any) => sub.after({ type: key, payload: args }, rawState))
            }
            return res
          },
        })

        return fnPx
      },
    }
  )

  const subscribe = (fn, options) => {
    const subs = typeof fn === 'function' ? { before: fn } : fn
    return genericSubscribe(subs, store._subscribers, options)
  }

  const rawLoadings: Loadings = ({} as unknown) as Loadings
  rawMutations &&
    Object.keys(rawMutations).map((key) => {
      rawLoadings[key] = ref(false)
    })

  const loadings = toReadOnly<Loadings>(rawLoadings)

  const store: Store<S, G, M> = ({
    state,
    getters,
    mutations,
    loadings,
    _subscribers: [],
    subscribe,
  } as unknown) as Store<S, G, M>

  // apply plugins
  plugins && plugins.forEach((plugin) => plugin(store))

  const storePx: Store<S, G, M> & S & G & MtWithLoading<M>['mutations'] = (new Proxy(store, {
    get(target, key, receiver) {
      if (key in target.state) {
        return target.state[key]
      } else if (key in target.getters) {
        return target.getters[key]
      } else if (key in target.mutations) {
        return target.mutations[key]
      } else {
        return Reflect.get(target, key, receiver)
      }
    },
    has(target, key) {
      if (key in target.state) {
        return true
      } else if (key in target.getters) {
        return true
      } else if (key in target.mutations) {
        return true
      } else {
        return Reflect.has(target, key)
      }
    },
  }) as unknown) as Store<S, G, M> & S & G & MtWithLoading<M>['mutations']

  return storePx
}

function toReadOnly<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, key, receiver) {
      let res = Reflect.get(target, key, receiver)
      return isObject(res) ? toReadOnly(res) : res
    },
    set(target, key, value, receiver) {
      console.error('can not set value directly:', key, value)
      return true
    },
  })
}

function genericSubscribe(fn, subs, options) {
  if (subs.indexOf(fn) < 0) {
    options && options.prepend ? subs.unshift(fn) : subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}
