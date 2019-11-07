import { ImportMock, MockManager } from 'ts-mock-imports';
import { stub, spy, restore } from 'sinon';
import { BigNumber } from '@polymathnetwork/contract-wrappers';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-protocol';
import * as contextModule from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as approveModule from '../ApproveErc20';
import * as tokenFactoryModule from '../../testUtils/MockedTokenFactoryObject';
import { CreateErc20DividendDistribution } from '../../procedures/CreateErc20DividendDistribution';
import { Procedure } from '~/procedures/Procedure';
import { PolymathError } from '~/PolymathError';
import { ErrorCode, ProcedureType } from '~/types';
import { ApproveErc20 } from '../ApproveErc20';
import * as dividendDistributionSecurityTokenFactoryModule from '~/entities/factories/DividendDistributionFactory';
import * as utilsModule from '~/utils';
import { mockFactories } from '~/testUtils/mockFactories';

const params = {
  symbol: 'TEST1',
  name: 'Test Token 1',
  amount: new BigNumber(1),
  checkpointIndex: 1,
  erc20Address: '0x1',
  maturityDate: new Date(2030, 1),
  expiryDate: new Date(2031, 1),
};

describe('CreateErc20DividendDistribution', () => {
  let target: CreateErc20DividendDistribution;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let approvalMock: MockManager<approveModule.ApproveErc20>;
  let tokenFactoryMock: MockManager<tokenFactoryModule.MockedTokenFactoryObject>;
  let gpmMock: MockManager<contractWrappersModule.GeneralPermissionManager_3_0_0>;
  let erc20DividendsMock: MockManager<contractWrappersModule.ERC20DividendCheckpoint_3_0_0>;

  let dividendDistributionFactoryMock: MockManager<
    dividendDistributionSecurityTokenFactoryModule.DividendDistributionFactory
  >;

  beforeEach(() => {
    // Mock the context, wrappers, and tokenFactory to test CreateErc20DividendDistribution
    contextMock = ImportMock.mockClass(contextModule, 'Context');
    wrappersMock = ImportMock.mockClass(wrappersModule, 'PolymathBase');
    tokenFactoryMock = ImportMock.mockClass(tokenFactoryModule, 'MockedTokenFactoryObject');

    // Import mock out of ApproveErc20
    approvalMock = ImportMock.mockClass(approveModule, 'ApproveErc20');
    approvalMock.mock('prepareTransactions', Promise.resolve());
    approvalMock.set('transactions' as any, []);
    approvalMock.set('fees' as any, []);

    contextMock.set('contractWrappers', wrappersMock.getMockInstance());
    wrappersMock.set('tokenFactory', tokenFactoryMock.getMockInstance());

    gpmMock = ImportMock.mockClass(contractWrappersModule, 'GeneralPermissionManager_3_0_0');
    erc20DividendsMock = ImportMock.mockClass(
      contractWrappersModule,
      'ERC20DividendCheckpoint_3_0_0'
    );
    tokenFactoryMock.mock('getSecurityTokenInstanceFromTicker', {});
    erc20DividendsMock.mock('address', Promise.resolve(params.erc20Address));
    wrappersMock.mock(
      'getAttachedModules',
      Promise.resolve([erc20DividendsMock.getMockInstance()])
    );

    dividendDistributionFactoryMock = ImportMock.mockClass(
      dividendDistributionSecurityTokenFactoryModule,
      'DividendDistributionFactory'
    );

    const factoryMockSetup = mockFactories();
    factoryMockSetup.dividendDistributionFactory = dividendDistributionFactoryMock.getMockInstance();
    contextMock.set('factories', factoryMockSetup);

    // Instantiate CreateErc20DividendDistribution
    target = new CreateErc20DividendDistribution(params, contextMock.getMockInstance());
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have CreateErc20DividendDistribution type', async () => {
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.CreateErc20DividendDistribution);
    });
  });

  describe('CreateErc20DividendDistribution', () => {
    test('should add a transaction to the queue to create an erc20 dividend distribution and to approve erc20 token', async () => {
      const addProcedureSpy = spy(target, 'addProcedure');
      const addTransactionSpy = spy(target, 'addTransaction');
      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(addProcedureSpy.getCall(0).calledWith(ApproveErc20)).toEqual(true);
      expect(
        addTransactionSpy
          .getCall(0)
          .calledWith(
            erc20DividendsMock.getMockInstance().createDividendWithCheckpointAndExclusions
          )
      ).toEqual(true);
      expect(addTransactionSpy.callCount).toEqual(1);
      expect(addProcedureSpy.callCount).toEqual(1);
    });

    test('should send add a transaction to the queue to create arc20 dividend distribution with taxWitholding data', async () => {
      target = new CreateErc20DividendDistribution(
        {
          ...params,
          taxWithholdings: [
            {
              address: '0x5555555555555555555555555555555555555555',
              percentage: 50,
            },
          ],
        },
        contextMock.getMockInstance()
      );
      const addProcedureSpy = spy(target, 'addProcedure');
      const addTransactionSpy = spy(target, 'addTransaction');
      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(addProcedureSpy.getCall(0).calledWith(ApproveErc20)).toEqual(true);
      expect(
        addTransactionSpy
          .getCall(0)
          .calledWith(
            erc20DividendsMock.getMockInstance().createDividendWithCheckpointAndExclusions
          )
      ).toEqual(true);
      expect(
        addTransactionSpy.getCall(1).calledWith(erc20DividendsMock.getMockInstance().setWithholding)
      ).toEqual(true);
      expect(addTransactionSpy.callCount).toEqual(2);
      expect(addProcedureSpy.callCount).toEqual(1);
    });

    test('should throw if there is no valid security token supplied', async () => {
      tokenFactoryMock.set(
        'getSecurityTokenInstanceFromTicker',
        stub()
          .withArgs({ address: params.symbol })
          .throws()
      );

      expect(target.prepareTransactions()).rejects.toThrow(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `There is no Security Token with symbol ${params.symbol}`,
        })
      );
    });

    test('should throw if corresponding dividend distribution event is not fired', async () => {
      ImportMock.mockFunction(utilsModule, 'findEvents', []);

      // Real call
      const resolver = await target.prepareTransactions();

      expect(resolver.run({} as TransactionReceiptWithDecodedLogs)).rejects.toThrow(
        new PolymathError({
          code: ErrorCode.UnexpectedEventLogs,
          message:
            "The ERC20 Dividend Distribution was successfully created but the corresponding event wasn't fired. Please report this issue to the Polymath team.",
        })
      );
    });

    test('should return the created erc20 dividend distribution', async () => {
      const dividendObject = {
        permissions: {
          securityTokenId: () => Promise.resolve(params.symbol),
          index: () => Promise.resolve(1),
        },
      };
      const fetchStub = dividendDistributionFactoryMock.mock('fetch', dividendObject);
      ImportMock.mockFunction(utilsModule, 'findEvents', [
        {
          args: {
            _dividendIndex: new BigNumber(1),
          },
        },
      ]);

      // Real call
      const resolver = await target.prepareTransactions();
      await resolver.run({} as TransactionReceiptWithDecodedLogs);
      expect(resolver.result).toEqual(dividendObject);
      expect(fetchStub.callCount).toBe(1);
    });

    test('should throw error if the erc20 dividends manager has not been enabled', async () => {
      wrappersMock.mock('getAttachedModules', Promise.resolve([]));
      // Real call
      expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: "The ERC20 Dividends Manager hasn't been enabled",
        })
      );
    });
  });
});