import * as rx from 'rxjs'
import { StateObservable } from './StateObservable'

export interface IStore {
  dispatch(action: any): void;
}

// 可以处理不同类型的action，比如thunk类型
// 把thunk promise变成流
// 用作输入action的截流，转换，检查
export type TConvert = (action: any) => rx.Observable<any>

// 处理副作用，执行逻辑的模块
// 可以监听事件的产生，监听状态的变化，
// 可以通过直接调用store上的方法，例如dispatch，dispatch出来的action会重新经过convert
// epic产生的action不会经过convert
export type TEpic = (action$: rx.Observable<any>, state$: StateObservable<any>, store: any) => rx.Observable<any>

// 更新状态
export type TReducer = (state: any, action: any) => any
