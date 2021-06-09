const rx = require('rxjs')
const op = require('rxjs/operators')
const { Store } = require('../src/Store')
const { combineEpics } = require('../src/combineEpics')

// 测试store的基础应用

// Initial State
const initState = { name: 'initial', pong: 1 };

// 转换thunk，或者处理action类型
const pingPlug = function (handler) {
  return (action) => {
    if (action === 'ping') {
      setTimeout(() => {
        handler({ type: 'pong', n: this.state$.value['pong'] })
      }, 2000);
      return handler({ type: 'ping' })
    }
    return handler(action)
  }
}

const thunkPlug = function (handler) {
  return (action) => {
    if (typeof action === 'function') {
      return action(this)
    }
    return handler(action)
  }
}

function epic1 (action$, state$) {
  return rx.of({
    type: "NAME_CHANGED", payload: 'epic'
  }) 
}

function epic2 (action$, state$) {
  return rx.interval(3000).pipe(
    op.map(n => ({ type: 'execute', payload: n }))
  )
}

function epic3 (action$, state$, store) {
  return rx.timer(5000).pipe(
    op.map(v => {
      store.dispatch('ping');
      return { type: 'invoke dispatch' }
    })
  )
}

const epic = combineEpics(epic1, epic2, epic3)

// Redux reducer
const reducer = (state, action) => {  
  switch(action.type) {
    case 'NAME_CHANGED': {
      if (state.name === action.payload) {
        return state;
      }
      return {
        ...state,
        name: action.payload
      };
    }
    case 'pong': {
      return {
        ...state,
        pong: state.pong + 1
      }
    }
    default:
      return state;
  }
}

const store = new Store(
  initState, [pingPlug, thunkPlug], epic, reducer
)

// Example action function
const changeName = function (payload) {
  return {
    type: 'NAME_CHANGED',
    payload
  }
}


// store.action$.subscribe(v => console.log('out  ', v))
// store.state$.subscribe(v => console.log('out  ', v))
store.start((action$, state$) => {
  action$.subscribe(v => console.log('act', v))
  state$.subscribe(v => console.log('state', v))
})
store.dispatch({ type: "after_start" })
store.dispatch(changeName('action'))
store.dispatch(changeName('action'))
store.dispatch('ping')

store.dispatch((s) => {
  return new Promise(resolve => {
    setTimeout(() => {
      s.dispatch('ping')
      resolve('promise yes')
    }, 1000);
  }) 
})
.then(ret => {
  console.log('store.dispatch.then', ret)
})
