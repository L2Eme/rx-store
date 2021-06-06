const rx = require('rxjs')
const op = require('rxjs/operators')
const { Store } = require('../src/Store')
const { combineEpics } = require('../src/combineEpics')

// 测试store作为可请求对象

// Initial State
const initState = { data: 'empty' };

const converter = (action) => {
  return rx.of(action)
}

function handleRequest({method, params, id}, state$) {
  if (method === 'set') {
    return rx.of(
      { type: 'set', payload: params },
      { type: 'response', id, ret: 'ok' },
    )
  }
  else if (method === 'get') {
    return rx.of(
      { type: 'response', id, ret: state$.value.data }
    )
  }
  return rx.empty();
}

// 主要使用epic流程处理请求
function epic1 (action$, state$) {
  return action$.pipe(
    op.filter(a => a.type === 'request'),
    op.mergeMap(a => handleRequest(a, state$)),
  )
}

const epic = combineEpics(epic1)

// Redux reducer
const reducer = (state, action) => {  
  if (action.type === 'set') {
    return {
      ...state,
      data: action.payload,
    }
  }
  return state 
}

const store = new Store(
  initState, converter, epic, reducer
)

store.action$.pipe(
  op.filter(a => a.type === 'response' && a.id === 2),
  op.tap(() => console.log('get the action 2 response, while the data is ', store.state$.value.data)),
).subscribe()

store.start((action$, state$) => {
  action$.subscribe(v => console.log('act', v))
  state$.subscribe(v => console.log('state', v))
})

store.dispatch({ type: 'request', method: 'get', id: 1 })
store.dispatch({ type: 'request', method: 'set', params: 'new data', id: 2 })