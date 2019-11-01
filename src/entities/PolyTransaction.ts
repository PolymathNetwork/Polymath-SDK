import { mapValues, isPlainObject, pickBy } from 'lodash';
import { EventEmitter } from 'events';
import v4 from 'uuid/v4';
import {
  TransactionReceiptWithDecodedLogs,
  PolyResponse,
} from '@polymathnetwork/contract-wrappers';
import { PostTransactionResolver, isPostTransactionResolver } from '../PostTransactionResolver';
import {
  TransactionSpec,
  ErrorCode,
  TransactionStatus,
  PolyTransactionTag,
  PostTransactionResolverArray,
} from '../types';
import { PolymathError } from '../PolymathError';
import { Entity } from './Entity';
import { TransactionQueue } from './TransactionQueue';
import { serialize } from '../utils';

enum Event {
  StatusChange = 'StatusChange',
}

// TODO @RafaelVidaurre: Cleanup code
const mapValuesDeep = (
  obj: { [key: string]: any },
  fn: (...args: any[]) => any
): { [key: string]: any } =>
  mapValues(obj, (val, key) => (isPlainObject(val) ? mapValuesDeep(val, fn) : fn(val, key, obj)));

// TODO @monitz87: Make properties private where appliccable
export class PolyTransaction<Args = any, R extends any[] = any[]> extends Entity<void> {
  public static generateId() {
    return serialize('transaction', {
      random: v4(),
    });
  }

  public uid: string;

  public status: TransactionStatus = TransactionStatus.Idle;

  public transactionQueue: TransactionQueue;

  public promise: Promise<any>;

  public error?: PolymathError;

  public receipt?: TransactionReceiptWithDecodedLogs;

  public tag: PolyTransactionTag;

  public txHash?: string;

  public args: TransactionSpec<Args, R>['args'];

  protected method: TransactionSpec<Args, R>['method'];

  private postResolvers: PostTransactionResolverArray<
    R
  > = ([] as unknown) as PostTransactionResolverArray<R>;

  private emitter: EventEmitter;

  constructor(transaction: TransactionSpec<Args, R>, transactionQueue: TransactionQueue<any, any>) {
    super();

    if (transaction.postTransactionResolvers) {
      this.postResolvers = transaction.postTransactionResolvers;
    }

    this.emitter = new EventEmitter();
    this.tag = transaction.tag || PolyTransactionTag.Any;
    this.method = transaction.method;
    this.args = transaction.args;
    this.transactionQueue = transactionQueue;
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
    this.uid = PolyTransaction.generateId();
  }

  public toPojo() {
    const { uid, status, tag, receipt, error, txHash, transactionQueue, args } = this;
    const transactionQueueUid = transactionQueue.uid;

    // do not expose arguments that haven't been resolved
    // TODO @monitz87: type this correctly
    const filteredArgs = pickBy(args, arg => !isPostTransactionResolver(arg));

    return {
      uid,
      transactionQueueUid,
      status,
      tag,
      txHash,
      receipt,
      error,
      /**
       * NOTE @monitz87: we intentionally expose the args as any for the end user
       * until we figure out how to type this properly
       */
      args: filteredArgs as any,
    };
  }

  public async run() {
    try {
      const receipt = await this.internalRun();
      this.receipt = receipt;

      this.updateStatus(TransactionStatus.Succeeded);
      this.resolve(receipt);
    } catch (err) {
      if (err.code === ErrorCode.TransactionRejectedByUser) {
        this.updateStatus(TransactionStatus.Rejected);
      } else {
        this.updateStatus(TransactionStatus.Failed);
      }
      this.reject(err);
    }

    await this.promise;
  }

  public onStatusChange = (listener: (transaction: this) => void) => {
    this.emitter.on(Event.StatusChange, listener);

    return () => {
      this.emitter.removeListener(Event.StatusChange, listener);
    };
  };

  protected resolve: (val?: any) => void = () => {};

  protected reject: (reason?: any) => void = () => {};

  private async internalRun() {
    this.updateStatus(TransactionStatus.Unapproved);

    const unwrappedArgs = this.unwrapArgs(this.args);

    const { method } = this;

    let polyResponse: PolyResponse;

    if (method instanceof Function) {
      polyResponse = await method(unwrappedArgs);
    } else {
      const returnedMethod = await method.futureMethod(method.futureValue.result);
      polyResponse = await returnedMethod(unwrappedArgs);
    }

    // Set the Transaction as Running once it is approved by the user
    this.txHash = polyResponse.txHash;
    this.updateStatus(TransactionStatus.Running);

    let result: TransactionReceiptWithDecodedLogs;

    try {
      result = await polyResponse.receiptAsync;
    } catch (err) {
      // Wrap with PolymathError
      if (err.message.indexOf('MetaMask Tx Signature') > -1) {
        this.error = new PolymathError({
          code: ErrorCode.TransactionRejectedByUser,
        });
      } else {
        this.error = new PolymathError({
          code: ErrorCode.FatalError,
          message: err.message,
        });
      }

      throw this.error;
    }

    await Promise.all(this.postResolvers.map(resolver => resolver.run(result)));

    return result;
  }

  private updateStatus = (status: TransactionStatus) => {
    this.status = status;

    /* eslint-disable default-case */
    switch (status) {
      case TransactionStatus.Unapproved: {
        this.emitter.emit(Event.StatusChange, this);
        return;
      }
      case TransactionStatus.Running: {
        this.emitter.emit(Event.StatusChange, this);
        return;
      }
      case TransactionStatus.Succeeded: {
        this.emitter.emit(Event.StatusChange, this);
        return;
      }
      case TransactionStatus.Failed: {
        this.emitter.emit(Event.StatusChange, this, this.error);
        return;
      }
      case TransactionStatus.Rejected: {
        this.emitter.emit(Event.StatusChange, this);
      }
    }
    /* eslint-enable default-case */
  };

  private unwrapArg<T>(arg: PostTransactionResolver<T> | T) {
    if (isPostTransactionResolver<T>(arg)) {
      return arg.result;
    }
    return arg;
  }

  /**
   * Picks all post-transaction resolvers and unwraps their values
   */
  private unwrapArgs<T>(args: TransactionSpec<T>['args']) {
    return mapValues(args, (arg: any) => {
      return isPlainObject(arg)
        ? mapValuesDeep(arg as { [key: string]: any }, (val: any) => {
            return this.unwrapArg(val);
          })
        : this.unwrapArg(arg);
    }) as T;
  }

  public _refresh(_params: Partial<void>) {}
}
