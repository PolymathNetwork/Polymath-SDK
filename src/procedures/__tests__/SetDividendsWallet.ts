import { ImportMock, MockManager } from 'ts-mock-imports';
import { spy, restore } from 'sinon';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import * as contextModule from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as tokenFactoryModule from '../../testUtils/MockedTokenFactoryObject';
import { SetDividendsWallet } from '../../procedures/SetDividendsWallet';
import { Procedure } from '~/procedures/Procedure';
import { ProcedureType, DividendType, ErrorCode } from '~/types';
import { PolymathError } from '~/PolymathError';

const params = {
  symbol: 'TEST1',
  address: '0x3333333333333333333333333333333333333333',
};

describe('SetDividendsWallet', () => {
  let target: SetDividendsWallet;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let tokenFactoryMock: MockManager<
    tokenFactoryModule.MockedTokenFactoryObject
  >;
  let securityTokenMock: MockManager<
    contractWrappersModule.SecurityToken_3_0_0
  >;
  let erc20DividendMock: MockManager<
    contractWrappersModule.ERC20DividendCheckpointContract_3_0_0
  >;

  beforeEach(() => {
    // Mock the context, wrappers, tokenFactory and securityToken to test SetDividendsWallet
    contextMock = ImportMock.mockClass(contextModule, 'Context');
    wrappersMock = ImportMock.mockClass(wrappersModule, 'PolymathBase');
    tokenFactoryMock = ImportMock.mockClass(
      tokenFactoryModule,
      'MockedTokenFactoryObject'
    );
    securityTokenMock = ImportMock.mockClass(
      contractWrappersModule,
      'SecurityToken_3_0_0'
    );

    erc20DividendMock = ImportMock.mockClass(
      contractWrappersModule,
      'ERC20DividendCheckpointContract_3_0_0'
    );

    tokenFactoryMock.mock(
      'getSecurityTokenInstanceFromTicker',
      securityTokenMock.getMockInstance()
    );

    contextMock.set('contractWrappers', wrappersMock.getMockInstance());
    wrappersMock.set('tokenFactory', tokenFactoryMock.getMockInstance());
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have SetDividendsWallet type', async () => {
      target = new SetDividendsWallet(
        { ...params, dividendType: DividendType.Erc20 },
        contextMock.getMockInstance()
      );
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.SetDividendsWallet);
    });
  });

  describe('SetDividendsWallet', () => {
    test('should throw if there is no valid dividend type being provided', async () => {
      // Instantiate SetDividendsWallet with incorrect dividend type
      target = new SetDividendsWallet(
        {
          symbol: params.symbol,
          dividendType: 'wrong' as DividendType,
          address: params.address,
        },
        contextMock.getMockInstance()
      );

      expect(target.prepareTransactions()).rejects.toThrow(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: "Dividends of the specified type haven't been enabled",
        })
      );
    });

    test('should throw if an Erc20 dividend module is not attached', async () => {
      target = new SetDividendsWallet(
        { ...params, dividendType: DividendType.Erc20 },
        contextMock.getMockInstance()
      );

      wrappersMock.mock('getAttachedModules', Promise.resolve([]));

      // Real call
      expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: "Dividends of the specified type haven't been enabled",
        })
      );
    });

    test('should throw if an Eth dividend module is not attached', async () => {
      target = new SetDividendsWallet(
        { ...params, dividendType: DividendType.Eth },
        contextMock.getMockInstance()
      );

      wrappersMock.mock('getAttachedModules', Promise.resolve([]));

      // Real call
      expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: "Dividends of the specified type haven't been enabled",
        })
      );
    });

    test('should add transactions to the queue for change wallet with a new Erc20 dividend module', async () => {
      target = new SetDividendsWallet(
        { ...params, dividendType: DividendType.Erc20 },
        contextMock.getMockInstance()
      );

      wrappersMock.mock(
        'getAttachedModules',
        Promise.resolve([erc20DividendMock.getMockInstance()])
      );

      const addTransactionSpy = spy(target, 'addTransaction');

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(
        addTransactionSpy
          .getCall(0)
          .calledWith(erc20DividendMock.getMockInstance().changeWallet)
      ).toEqual(true);
      expect(addTransactionSpy.callCount).toEqual(1);
    });
  });
});
