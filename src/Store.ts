import { Subject, Observable, queueScheduler, of } from 'rxjs'
import { merge, mergeMap, tap, startWith, scan, observeOn, share } from 'rxjs/operators'
import { StateObservable } from './StateObservable'
import { TReducer, TEpic, IStore, THandler, TPlug } from './interface'

/**
 * 外界监听state和action，通过epic，通过start回掉，通过主动subscribe
 */
export class Store implements IStore {

  private _handler: THandler

  // 仅接收dispatch的subject
  private _actionInputSubject$ = new Subject()

  // 汇集epic和dispatch的subject
  private _actionOutputSubject$ = new Subject()

  private _reduce$: Observable<any>

  // 通过StateObservable包装的state
  private _stateOutput$: StateObservable<any>

  /**
   * 仅输出state流, 作用与BehaviourSubject类似，拥有当前值
   * @memberof Store
   */
  get state$(): StateObservable<any> {
    return this._stateOutput$
  }

  /**
   * 仅输出action流
   * @memberof Store
   */
  get action$(): Observable<any> {
    return this._actionOutputSubject$
  }

  constructor(initState: any, plugs: TPlug<any>[], epic: TEpic, reducer: TReducer) {
    // combine plugs
    this._handler = plugs.reduce(
      (h, p) => p.bind(this)(h as any),
      (action: any) => this._actionInputSubject$.next(action)
    )
    // 包装一个BehaviourSubject, 区别为不会主动推送当前值，且不更新时不推送
    const stateInput$ = new Subject()
    this._stateOutput$ = new StateObservable(stateInput$, initState)
    const epic$ = of(0).pipe(
      // 延迟执行epic方法，在constructor调用之后
      // 扩展后的store，初始化属性时，会用到该特性
      mergeMap(() => epic(this.action$, this._stateOutput$, this))
    )

    this._reduce$ = this._actionInputSubject$.pipe(
      merge(epic$),
      // action listener only take the action after convert
      tap(a => this._actionOutputSubject$.next(a)),
      startWith(initState),
      // core function is action$.startWith(initState).scan(reducer)
      scan(reducer),
      observeOn(queueScheduler),
      tap(state => stateInput$.next(state)),
      share(),
    )
  }

  dispatch(action: any) {
    this._handler(action) 
  }

  start(cb?: (action$: Observable<any>, state$: StateObservable<any>) => void) {
    cb && cb(this.action$, this._stateOutput$)
    return this._reduce$.subscribe()
  }
}

/*
 * change log
 * 
 * v0.8.2 延迟执行epic方法，在constructor调用之后
 * v0.9.0 使用plug替换convert组件
 */