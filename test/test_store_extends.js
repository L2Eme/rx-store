const rx = require('rxjs')
const op = require('rxjs/operators')
const { Store } = require('../src/Store')

// extends store

class BotStore extends Store {
  symbol = 'BTC'
  market = 'BTC-USD'
}

// Initial State
const initState = { name: 'initial' };

const logStorePlug = function(handler) {
  return (action) => {
    console.log('log store', this.symbol, this.market)
    handler(action)
  }
} 

function epic (action$, state$, store) {
  console.log('when epic run', store.symbol, store.market)
  return rx.of({
    type: "NAME_CHANGED", payload: 'epic'
  }) 
}

// Redux reducer
const reducer = (state, action) => {  
  return state
}

const store = new BotStore(
  initState, [logStorePlug], epic, reducer
)

// store.action$.subscribe(v => console.log('out  ', v))
// store.state$.subscribe(v => console.log('out  ', v))
store.start((action$, state$) => {
  action$.subscribe(v => console.log('start', v))
  state$.subscribe(v => console.log('start', v))
})

store.dispatch('empty action')