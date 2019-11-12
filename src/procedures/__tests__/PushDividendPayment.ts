import { ImportMock, MockManager } from 'ts-mock-imports';
import { spy, restore } from 'sinon';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import * as contextModule from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as tokenFactoryModule from '../../testUtils/MockedTokenFactoryObject';
import * as dividendFactoryModule from '~/entities/factories/DividendDistributionFactory';
import * as pushDividendPaymentModule from '../../procedures/PushDividendPayment';
import { PushDividendPayment } from '../../procedures/PushDividendPayment';
import { Procedure } from '~/procedures/Procedure';
import { ProcedureType, DividendType, ErrorCode } from '~/types';
import { PolymathError } from '~/PolymathError';
import { mockFactories } from '~/testUtils/mockFactories';
import { Factories } from '../../Context';
import { SecurityToken, DividendDistribution } from '~/entities';

const params = {
  symbol: 'TEST1',
  dividendIndex: 0,
  shareholderAddresses: ['0x01'],
  dividendType: DividendType.Eth,
};

describe('PushDividendPayment', () => {
  let target: PushDividendPayment;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let tokenFactoryMock: MockManager<
    tokenFactoryModule.MockedTokenFactoryObject
  >;
  let securityTokenMock: MockManager<
    contractWrappersModule.SecurityToken_3_0_0
  >;
  let erc20DividendsMock: MockManager<
    contractWrappersModule.ERC20DividendCheckpoint_3_0_0
  >;
  let ethDividendsMock: MockManager<
    contractWrappersModule.EtherDividendCheckpoint_3_0_0
  >;
  let dividendFactoryMock: MockManager<
    dividendFactoryModule.DividendDistributionFactory
  >;
  let factoriesMockedSetup: Factories;

  beforeEach(() => {
    // Mock the context, wrappers, tokenFactory and securityToken to test PushDividendPayment
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
    erc20DividendsMock = ImportMock.mockClass(
      contractWrappersModule,
      'ERC20DividendCheckpoint_3_0_0'
    );
    ethDividendsMock = ImportMock.mockClass(
      contractWrappersModule,
      'EtherDividendCheckpoint_3_0_0'
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
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have PushDividendPayment type', async () => {
      target = new PushDividendPayment(params, contextMock.getMockInstance());
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.PushDividendPayment);
    });
  });

  describe('PushDividendPayment', () => {
    test('should throw if there is no valid security token being provided', async () => {
      // Instantiate PushDividendPayment with incorrect security symbol
      target = new PushDividendPayment(params, contextMock.getMockInstance());

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

    test('should throw if there is no valid dividend type being provided', async () => {
      // Instantiate PushDividendPayment with incorrect dividend type
      target = new PushDividendPayment(
        { ...params, dividendType: 'wrong' as DividendType },
        contextMock.getMockInstance()
      );

      await expect(target.prepareTransactions()).rejects.toThrow(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: "Dividends of the specified type haven't been enabled",
        })
      );
    });

    test('should throw if an Erc20 dividend module is not attached', async () => {
      target = new PushDividendPayment(
        { ...params, dividendType: DividendType.Erc20 },
        contextMock.getMockInstance()
      );

      wrappersMock.mock('getAttachedModules', Promise.resolve([]));

      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: "Dividends of the specified type haven't been enabled",
        })
      );
    });

    test('should throw if an Eth dividend module is not attached', async () => {
      target = new PushDividendPayment(
        { ...params, dividendType: DividendType.Eth },
        contextMock.getMockInstance()
      );

      wrappersMock.mock('getAttachedModules', Promise.resolve([]));

      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: "Dividends of the specified type haven't been enabled",
        })
      );
    });

    test('should add a transaction to push a dividend payment of an attached ERC20 dividends module', async () => {
      // Instantiate PushDividendPayment
      target = new PushDividendPayment(
        { ...params, dividendType: DividendType.Erc20 },
        contextMock.getMockInstance()
      );

      wrappersMock.mock(
        'getDividend',
        Promise.resolve({
          shareholders: [
            { address: '0x01', paymentReceived: true },
            { address: '0x02', paymentReceived: true },
            { address: '0x03', paymentReceived: false },
          ],
        })
      );

      wrappersMock.mock(
        'getAttachedModules',
        Promise.resolve([erc20DividendsMock.getMockInstance()])
      );

      const addTransactionSpy = spy(target, 'addTransaction');

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(
        addTransactionSpy
          .getCall(0)
          .calledWith(
            erc20DividendsMock.getMockInstance().pushDividendPaymentToAddresses
          )
      ).toEqual(true);
      expect(addTransactionSpy.callCount).toEqual(1);
    });

    test('should add a transaction to push a dividend payment of an attached Eth dividends module', async () => {
      // Instantiate PushDividendPayment
      target = new PushDividendPayment(
        { ...params, dividendType: DividendType.Eth },
        contextMock.getMockInstance()
      );

      wrappersMock.mock(
        'getDividend',
        Promise.resolve({
          shareholders: [
            { address: '0x01', paymentReceived: true },
            { address: '0x02', paymentReceived: true },
            { address: '0x03', paymentReceived: false },
          ],
        })
      );

      wrappersMock.mock(
        'getAttachedModules',
        Promise.resolve([ethDividendsMock.getMockInstance()])
      );

      const addTransactionSpy = spy(target, 'addTransaction');

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(
        addTransactionSpy
          .getCall(0)
          .calledWith(
            ethDividendsMock.getMockInstance().pushDividendPaymentToAddresses
          )
      ).toEqual(true);
      expect(addTransactionSpy.callCount).toEqual(1);
    });

    test('should successfully refresh ERC20 dividends distribution factory', async () => {
      const refreshStub = dividendFactoryMock.mock(
        'refresh',
        Promise.resolve(undefined)
      );

      const resolverValue = await pushDividendPaymentModule.createPushDividendPaymentResolver(
        factoriesMockedSetup,
        params.symbol,
        DividendType.Erc20,
        0
      )();

      expect(
        refreshStub.getCall(0).calledWithExactly(
          DividendDistribution.generateId({
            securityTokenId: SecurityToken.generateId({
              symbol: params.symbol,
            }),
            dividendType: DividendType.Erc20,
            index: 0,
          })
        )
      ).toEqual(true);
      expect(await resolverValue).toEqual(undefined);
      expect(refreshStub.callCount).toEqual(1);
    });

    test('should successfully refresh Eth dividends distribution factory', async () => {
      const refreshStub = dividendFactoryMock.mock(
        'refresh',
        Promise.resolve(undefined)
      );

      const resolverValue = await pushDividendPaymentModule.createPushDividendPaymentResolver(
        factoriesMockedSetup,
        params.symbol,
        DividendType.Eth,
        1
      )();

      expect(
        refreshStub.getCall(0).calledWithExactly(
          DividendDistribution.generateId({
            securityTokenId: SecurityToken.generateId({
              symbol: params.symbol,
            }),
            dividendType: DividendType.Eth,
            index: 1,
          })
        )
      ).toEqual(true);
      expect(await resolverValue).toEqual(undefined);
      expect(refreshStub.callCount).toEqual(1);
    });
  });
});
