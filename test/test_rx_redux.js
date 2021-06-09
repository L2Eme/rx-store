const rx = require('rxjs')
const op = require('rxjs/operators')
const { Store } = require('../src/Store')
const { combineEpics } = require('../src/combineEpics')

// 测试store的基础应用

// Initial State
const initState = { name: 'initial' };

// // 转换thunk，或者处理action类型
// const converter = (action) => {
//   if (action === 'ping') {
//     return rx.merge(
//       rx.of({ type: 'ping' }),
//       rx.timer(1000).pipe(op.mapTo({type: 'pong'})),
//     )
//   }
//   else {
//     return rx.of(action)
//   }
// }

// 转换thunk，或者处理action类型
const pingPlug = (handler) =>
  (action, store) => {
    if (action === 'ping') {
      handler({ type: 'ping' }, store)
      setTimeout(() => {
        handler({ type: 'pong' }, store)
      }, 2000);
    }
    else {
      handler(action, store)
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
    op.map(v => { store.dispatch('ping'); return { type: 'invoke dispatch' } })
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
    default:
      return state;
  }
}

const store = new Store(
  initState, [pingPlug], epic, reducer
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
  action$.subscribe(v => console.log('start', v))
  state$.subscribe(v => console.log('start', v))
})
store.dispatch({ type: "after_start" })
store.dispatch(changeName('action'))
store.dispatch(changeName('action'))
store.dispatch('ping')
