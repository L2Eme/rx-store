import * as rx from 'rxjs'
import * as op from 'rxjs/operators'
import { StateObservable } from './StateObservable'
import { TReducer, TEpic, TConvert, IStore } from './interface'

/**
 * 外界监听state和action，通过epic，通过start回掉，通过主动subscribe
 */
export class Store implements IStore {

  // 仅接收dispatch的subject
  private _actionInputSubject$ = new rx.Subject()

  // 汇集epic和dispatch的subject
  private _actionOutputSubject$ = new rx.Subject()

  private _reduce$: rx.Observable<any>

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
  get action$(): rx.Observable<any> {
    return this._actionOutputSubject$
  }

  constructor(initState: any, converter: TConvert, epic: TEpic, reducer: TReducer) {
    // 包装一个BehaviourSubject, 区别为不会主动推送当前值，且不更新时不推送
    const stateInput$ = new rx.Subject()
    this._stateOutput$ = new StateObservable(stateInput$, initState)
    const epic$ = epic(this.action$, this._stateOutput$, this)

    this._reduce$ = this._actionInputSubject$.pipe(
      op.merge(epic$),
      op.mergeMap(converter),
      // action listener only take the action after convert
      op.tap(a => this._actionOutputSubject$.next(a)),
      op.startWith(initState),
      // core function is action$.startWith(initState).scan(reducer)
      op.scan(reducer),
      op.observeOn(rx.queueScheduler),
      op.tap(state => stateInput$.next(state)),
      op.share(),
    )
  }

  dispatch(action: any) {
    this._actionInputSubject$.next(action)
  }

  start(cb?: (action$: rx.Observable<any>, state$: StateObservable<any>) => void) {
    cb && cb(this.action$, this._stateOutput$)
    return this._reduce$.subscribe()
  }
}