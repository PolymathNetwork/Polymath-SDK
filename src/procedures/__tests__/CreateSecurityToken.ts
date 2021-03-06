/* eslint-disable import/no-duplicates */
import { ImportMock, MockManager } from 'ts-mock-imports';
import { BigNumber } from '@polymathnetwork/contract-wrappers';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import { spy, stub, restore } from 'sinon';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-protocol';
import sinon from 'sinon';
import * as contextModule from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as approvalModule from '../ApproveErc20';
import { CreateSecurityToken } from '../../procedures/CreateSecurityToken';
import { Procedure } from '../../procedures/Procedure';
import { Wallet } from '../../Wallet';
import { PolymathError } from '../../PolymathError';
import { ErrorCode, PolyTransactionTag, ProcedureType } from '../../types';
import { ApproveErc20 } from '../ApproveErc20';
import * as securityTokenFactoryModule from '../../entities/factories/SecurityTokenFactory';
import { mockFactories } from '../../testUtils/mockFactories';
import { SecurityToken } from '../../entities';

const params = {
  symbol: 'TEST1',
  name: 'Test Token 1',
  address: '0x1111111111111111111111111111111111111111',
  owner: '0x3333333333333333333333333333333333333333',
  amount: new BigNumber(1),
  divisible: false,
};

const costInPoly = new BigNumber(5);
const costInUsd = new BigNumber(6);

describe('CreateSecurityToken', () => {
  let target: CreateSecurityToken;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let approvalMock: MockManager<approvalModule.ApproveErc20>;

  let securityTokenRegistryMock: MockManager<contractWrappersModule.SecurityTokenRegistry>;
  let securityTokenFactoryMock: MockManager<securityTokenFactoryModule.SecurityTokenFactory>;

  beforeEach(() => {
    // Mock the context, wrappers, and tokenFactory to test
    contextMock = ImportMock.mockClass(contextModule, 'Context');
    wrappersMock = ImportMock.mockClass(wrappersModule, 'PolymathBase');

    // Import mock for approveErc20
    approvalMock = ImportMock.mockClass(approvalModule, 'ApproveErc20');
    approvalMock.mock('prepareTransactions', Promise.resolve());
    approvalMock.set('transactions' as any, []);
    approvalMock.set('fees' as any, []);

    securityTokenRegistryMock = ImportMock.mockClass(
      contractWrappersModule,
      'SecurityTokenRegistry'
    );

    securityTokenRegistryMock.mock('tickerAvailable', Promise.resolve(false));
    securityTokenRegistryMock.mock('isTickerRegisteredByCurrentIssuer', Promise.resolve(true));
    securityTokenRegistryMock.mock('isTokenLaunched', Promise.resolve(false));
    securityTokenRegistryMock.mock('getFees', Promise.resolve([costInUsd, costInPoly]));
    securityTokenRegistryMock.mock('address', Promise.resolve(params.address));

    contextMock.set('contractWrappers', wrappersMock.getMockInstance());
    wrappersMock.set('securityTokenRegistry', securityTokenRegistryMock.getMockInstance());

    contextMock.set('currentWallet', new Wallet({ address: () => Promise.resolve(params.owner) }));

    wrappersMock.mock('isTestnet', Promise.resolve(false));

    securityTokenFactoryMock = ImportMock.mockClass(
      securityTokenFactoryModule,
      'SecurityTokenFactory'
    );
    const factoryMockSetup = mockFactories();
    factoryMockSetup.securityTokenFactory = securityTokenFactoryMock.getMockInstance();
    contextMock.set('factories', factoryMockSetup);

    // Instantiate CreateSecurityToken
    target = new CreateSecurityToken(params, contextMock.getMockInstance());
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have CreateSecurityToken type', async () => {
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.CreateSecurityToken);
    });
  });

  describe('CreateSecurityToken', () => {
    test('should throw error if token is not reserved ', async () => {
      securityTokenRegistryMock.mock('tickerAvailable', Promise.resolve(true));
      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `The security token symbol ${
            params.symbol
          } hasn't been reserved. You need to call "reserveSecurityToken" first.`,
        })
      );
    });

    test('should return the newly created security token', async () => {
      const fakeSecurityToken = {
        name: () => params.name,
        owner: () => params.owner,
        address: () => params.address,
      };

      const fetchStub = securityTokenFactoryMock.mock('fetch', Promise.resolve(fakeSecurityToken));

      // Real call
      const resolver = await target.prepareTransactions();
      const receipt = {} as TransactionReceiptWithDecodedLogs;
      await resolver.run(receipt);

      // Verifications
      expect(resolver.result).toEqual(fakeSecurityToken);
      expect(
        fetchStub.getCall(0).calledWithExactly(SecurityToken.generateId({ symbol: params.symbol }))
      ).toEqual(true);
      expect(fetchStub.callCount).toBe(1);
    });

    test('should throw error if token has been reserved by other user', async () => {
      securityTokenRegistryMock.mock('isTickerRegisteredByCurrentIssuer', Promise.resolve(false));
      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `The security token symbol ${
            params.symbol
          } has already been reserved by another issuer.`,
        })
      );
    });

    test('should throw error if the token has already been launched', async () => {
      securityTokenRegistryMock.mock('isTokenLaunched', Promise.resolve(true));
      // Real call
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `The security token symbol ${params.symbol} has already been launched`,
        })
      );
    });

    test('should add the transaction to the queue to create the security token and approve erc20 transfer', async () => {
      const approveErc20ArgsSpy = sinon.spy();
      const addProcedureStub = stub(target, 'addProcedure');
      addProcedureStub.withArgs(ApproveErc20).returns(approveErc20ArgsSpy);

      const generateNewSecurityTokenArgsStub = sinon.stub();
      generateNewSecurityTokenArgsStub.returns([{}]);

      const addTransactionStub = stub(target, 'addTransaction');
      securityTokenRegistryMock.mock(
        'generateNewSecurityToken',
        Promise.resolve('GenerateNewSecurityToken')
      );
      const { generateNewSecurityToken } = securityTokenRegistryMock.getMockInstance();
      addTransactionStub
        .withArgs(generateNewSecurityToken)
        .returns(generateNewSecurityTokenArgsStub);

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(approveErc20ArgsSpy.getCall(0).args[0]).toEqual({
        amount: costInPoly,
        spender: params.address,
      });
      expect(approveErc20ArgsSpy.callCount).toBe(1);

      expect(generateNewSecurityTokenArgsStub.getCall(0).args[0]).toEqual({
        name: params.name,
        ticker: params.symbol,
        tokenDetails: '',
        divisible: params.divisible,
        protocolVersion: '0',
        treasuryWallet: params.owner,
      });
      expect(generateNewSecurityTokenArgsStub.callCount).toEqual(1);

      expect(
        addTransactionStub
          .getCall(0)
          .calledWith(securityTokenRegistryMock.getMockInstance().generateNewSecurityToken)
      ).toEqual(true);
      expect(addTransactionStub.getCall(0).lastArg.fees).toEqual({
        usd: costInUsd,
        poly: costInPoly,
      });
      expect(addTransactionStub.getCall(0).lastArg.tag).toEqual(
        PolyTransactionTag.CreateSecurityToken
      );
      expect(addTransactionStub.callCount).toEqual(1);
      expect(addProcedureStub.getCall(0).calledWithExactly(ApproveErc20)).toEqual(true);
      expect(addProcedureStub.callCount).toEqual(1);
    });

    test('should add the transaction to the queue to create the security token with a treasury wallet', async () => {
      const customTreasuryWallet = '0x5555555555555555555555555555555555555555';
      target = new CreateSecurityToken(
        {
          ...params,
          treasuryWallet: customTreasuryWallet, // Extra argument of treasuryWallet
        },
        contextMock.getMockInstance()
      );
      const approveErc20ArgsSpy = sinon.spy();
      const addProcedureStub = stub(target, 'addProcedure');
      addProcedureStub.withArgs(ApproveErc20).returns(approveErc20ArgsSpy);

      const generateNewSecurityTokenArgsStub = sinon.stub();
      generateNewSecurityTokenArgsStub.returns([{}]);

      const addTransactionStub = stub(target, 'addTransaction');
      securityTokenRegistryMock.mock(
        'generateNewSecurityToken',
        Promise.resolve('GenerateNewSecurityToken')
      );
      const { generateNewSecurityToken } = securityTokenRegistryMock.getMockInstance();
      addTransactionStub
        .withArgs(generateNewSecurityToken)
        .returns(generateNewSecurityTokenArgsStub);

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(approveErc20ArgsSpy.getCall(0).args[0]).toEqual({
        amount: costInPoly,
        spender: params.address,
      });
      expect(approveErc20ArgsSpy.callCount).toBe(1);

      expect(generateNewSecurityTokenArgsStub.getCall(0).args[0]).toEqual({
        name: params.name,
        ticker: params.symbol,
        tokenDetails: '',
        divisible: params.divisible,
        protocolVersion: '0',
        treasuryWallet: customTreasuryWallet,
      });
      expect(generateNewSecurityTokenArgsStub.callCount).toEqual(1);

      expect(
        addTransactionStub
          .getCall(0)
          .calledWith(securityTokenRegistryMock.getMockInstance().generateNewSecurityToken)
      ).toEqual(true);
      expect(addTransactionStub.getCall(0).lastArg.fees).toEqual({
        usd: costInUsd,
        poly: costInPoly,
      });
      expect(addTransactionStub.getCall(0).lastArg.tag).toEqual(
        PolyTransactionTag.CreateSecurityToken
      );
      expect(addTransactionStub.callCount).toEqual(1);
      expect(addProcedureStub.getCall(0).calledWithExactly(ApproveErc20)).toEqual(true);
      expect(addProcedureStub.callCount).toEqual(1);
    });
  });
});
