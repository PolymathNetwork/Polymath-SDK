/* eslint-disable import/no-duplicates */
import { ImportMock, MockManager } from 'ts-mock-imports';
import sinon, { restore, stub } from 'sinon';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import * as contextModule from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as tokenFactoryModule from '../../testUtils/MockedTokenFactoryModule';
import * as dividendFactoryModule from '../../entities/factories/DividendDistributionFactory';
import * as pullDividendPaymentModule from '../../procedures/PullDividendPayment';
import { PullDividendPayment } from '../../procedures/PullDividendPayment';
import { Procedure } from '../../procedures/Procedure';
import { ProcedureType, ErrorCode, PolyTransactionTag } from '../../types';
import { PolymathError } from '../../PolymathError';
import { mockFactories } from '../../testUtils/mockFactories';
import { Factories } from '../../Context';
import { Wallet } from '../../Wallet';
import { SecurityToken, DividendDistribution } from '../../entities';

const params = {
  symbol: 'TEST',
  dividendIndex: 0,
};

const addresses = ['0x01', '0x02', '0x03', '0x04'];

describe('PullDividendPayment', () => {
  let target: PullDividendPayment;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let tokenFactoryMock: MockManager<tokenFactoryModule.MockedTokenFactoryModule>;
  let securityTokenMock: MockManager<contractWrappersModule.SecurityToken_3_0_0>;
  let erc20DividendsMock: MockManager<contractWrappersModule.ERC20DividendCheckpoint_3_0_0>;
  let dividendFactoryMock: MockManager<dividendFactoryModule.DividendDistributionFactory>;
  let factoriesMockedSetup: Factories;

  beforeEach(() => {
    // Mock the context, wrappers, tokenFactory and securityToken to test PullDividendPayment
    contextMock = ImportMock.mockClass(contextModule, 'Context');
    wrappersMock = ImportMock.mockClass(wrappersModule, 'PolymathBase');
    tokenFactoryMock = ImportMock.mockClass(tokenFactoryModule, 'MockedTokenFactoryModule');
    securityTokenMock = ImportMock.mockClass(contractWrappersModule, 'SecurityToken_3_0_0');
    erc20DividendsMock = ImportMock.mockClass(
      contractWrappersModule,
      'ERC20DividendCheckpoint_3_0_0'
    );
    tokenFactoryMock.mock(
      'getSecurityTokenInstanceFromTicker',
      securityTokenMock.getMockInstance()
    );
    contextMock.set('contractWrappers', wrappersMock.getMockInstance());
    wrappersMock.set('tokenFactory', tokenFactoryMock.getMockInstance());
    dividendFactoryMock = ImportMock.mockClass(
      dividendFactoryModule,
      'DividendDistributionFactory'
    );
    factoriesMockedSetup = mockFactories();
    factoriesMockedSetup.dividendDistributionFactory = dividendFactoryMock.getMockInstance();
    contextMock.set('factories', factoriesMockedSetup);
    contextMock.set('currentWallet', new Wallet({ address: () => Promise.resolve(addresses[0]) }));
    target = new PullDividendPayment(params, contextMock.getMockInstance());
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have PullDividendPayment type', async () => {
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.PullDividendPayment);
    });
  });

  describe('PullDividendPayment', () => {
    test('should throw if there is no valid security token being provided', async () => {
      tokenFactoryMock
        .mock('getSecurityTokenInstanceFromTicker')
        .withArgs(params.symbol)
        .throws();

      await expect(target.prepareTransactions()).rejects.toThrow(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `There is no Security Token with symbol ${params.symbol}`,
        })
      );
    });

    test('should throw if an Erc20 dividend module is not attached', async () => {
      wrappersMock.mock('getAttachedModules', Promise.resolve([]));

      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: "The Dividends Feature hasn't been enabled",
        })
      );
    });

    test('should throw if the owner address is not a tokenholder', async () => {
      contextMock.set(
        'currentWallet',
        new Wallet({ address: () => Promise.resolve(addresses[3]) })
      );

      wrappersMock.mock(
        'getAttachedModules',
        Promise.resolve([erc20DividendsMock.getMockInstance()])
      );

      wrappersMock.mock(
        'getDividend',
        Promise.resolve({
          tokenholders: [{ address: addresses[0], paymentReceived: false, excluded: false }],
        })
      );

      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `Current wallet ${
            addresses[3]
          } cannot receive dividend payments. Reason: not a tokenholder`,
        })
      );
    });

    test('should throw if a tokenholder already received payment', async () => {
      wrappersMock.mock(
        'getAttachedModules',
        Promise.resolve([erc20DividendsMock.getMockInstance()])
      );

      wrappersMock.mock(
        'getDividend',
        Promise.resolve({
          tokenholders: [{ address: addresses[0], paymentReceived: true, excluded: false }],
        })
      );

      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `Current wallet ${
            addresses[0]
          } cannot receive dividend payments. Reason: already received payment`,
        })
      );
    });

    test('should throw if a tokenholder is in the exclusion list', async () => {
      wrappersMock.mock(
        'getAttachedModules',
        Promise.resolve([erc20DividendsMock.getMockInstance()])
      );

      wrappersMock.mock(
        'getDividend',
        Promise.resolve({
          tokenholders: [{ address: addresses[0], paymentReceived: false, excluded: true }],
        })
      );

      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `Current wallet ${
            addresses[0]
          } cannot receive dividend payments. Reason: address belongs to exclusion list`,
        })
      );
    });

    test('should add a transaction to pull dividend payments', async () => {
      wrappersMock.mock(
        'getAttachedModules',
        Promise.resolve([erc20DividendsMock.getMockInstance()])
      );

      wrappersMock.mock(
        'getDividend',
        Promise.resolve({
          tokenholders: [
            { address: addresses[0], paymentReceived: false, excluded: false },
            { address: addresses[1], paymentReceived: false, excluded: false },
            { address: addresses[2], paymentReceived: true, excluded: false },
          ],
        })
      );

      const pullDividendPaymentArgsSpy = sinon.spy();
      const addTransactionStub = stub(target, 'addTransaction');
      erc20DividendsMock.mock('pullDividendPayment', Promise.resolve('PullDividendPayment'));
      const { pullDividendPayment } = erc20DividendsMock.getMockInstance();
      addTransactionStub.withArgs(pullDividendPayment).returns(pullDividendPaymentArgsSpy);

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(pullDividendPaymentArgsSpy.getCall(0).args[0]).toEqual({
        dividendIndex: params.dividendIndex,
      });
      expect(pullDividendPaymentArgsSpy.callCount).toEqual(1);
      expect(
        addTransactionStub
          .getCall(0)
          .calledWith(erc20DividendsMock.getMockInstance().pullDividendPayment)
      ).toEqual(true);
      expect(addTransactionStub.getCall(0).lastArg.tag).toEqual(
        PolyTransactionTag.PullDividendPayment
      );
      expect(addTransactionStub.callCount).toEqual(1);
    });

    test('should refresh the dividend distribution for which payments were pulled', async () => {
      const refreshStub = dividendFactoryMock.mock('refresh', Promise.resolve(undefined));

      const resolverValue = await pullDividendPaymentModule.createPullDividendPaymentResolver(
        factoriesMockedSetup,
        params.symbol,
        0
      )();

      expect(
        refreshStub.getCall(0).calledWithExactly(
          DividendDistribution.generateId({
            securityTokenId: SecurityToken.generateId({
              symbol: params.symbol,
            }),
            index: 0,
          })
        )
      ).toEqual(true);
      expect(resolverValue).toEqual(undefined);
      expect(refreshStub.callCount).toEqual(1);
    });
  });
});
