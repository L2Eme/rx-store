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

// 转换thunk，或者处理action类型
const converter = (action) => {
  return rx.of(action)
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
  initState, converter, epic, reducer
)

// store.action$.subscribe(v => console.log('out  ', v))
// store.state$.subscribe(v => console.log('out  ', v))
store.start((action$, state$) => {
  action$.subscribe(v => console.log('start', v))
  state$.subscribe(v => console.log('start', v))
})