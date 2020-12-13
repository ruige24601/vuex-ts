export default function logPlugin(store) {
  console.log('-----plugin is running -----')
  store.subscribe({
    before: (mutation, state) => {
      console.log('--------logPlugin start------')
      console.log('mutation: ', mutation)
      console.log('state: ', state)
      console.log('--------logPlugin end------')
    },
    after: (mutation, state) => {
      console.log('--------logPlugin -after- start------')
      console.log('mutation: ', mutation)
      console.log('state: ', state)
      console.log('--------logPlugin -after- end------')
    }
  })
}
