import { ImportMock, MockManager } from 'ts-mock-imports';
import sinon, { restore, stub } from 'sinon';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import * as contextModule from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as tokenFactoryModule from '../../testUtils/MockedTokenFactoryModule';
import { FreezeIssuance } from '../../procedures/FreezeIssuance';
import { Procedure } from '../Procedure';
import {
  ProcedureType,
  PolyTransactionTag,
  ErrorCode,
  FreezeIssuanceProcedureArgs,
} from '../../types';
import { PolymathError } from '../../PolymathError';
import { Wallet } from '../../Wallet';

const params: FreezeIssuanceProcedureArgs = {
  symbol: 'TEST1',
};

const ownerAddress = '0x01';
const randomSignature = 'Random freeze issuance signature ack';

describe('FreezeIssuance', () => {
  let target: FreezeIssuance;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let tokenFactoryMock: MockManager<tokenFactoryModule.MockedTokenFactoryModule>;
  let securityTokenMock: MockManager<contractWrappersModule.SecurityToken_3_0_0>;

  beforeEach(() => {
    // Mock the context, wrappers, tokenFactory and securityToken to test FreezeIssuance
    contextMock = ImportMock.mockClass(contextModule, 'Context');
    wrappersMock = ImportMock.mockClass(wrappersModule, 'PolymathBase');
    tokenFactoryMock = ImportMock.mockClass(tokenFactoryModule, 'MockedTokenFactoryModule');
    securityTokenMock = ImportMock.mockClass(contractWrappersModule, 'SecurityToken_3_0_0');

    tokenFactoryMock.mock(
      'getSecurityTokenInstanceFromTicker',
      securityTokenMock.getMockInstance()
    );

    contextMock.set('contractWrappers', wrappersMock.getMockInstance());
    wrappersMock.set('tokenFactory', tokenFactoryMock.getMockInstance());
    securityTokenMock.mock('owner', Promise.resolve(ownerAddress));
    contextMock.set('currentWallet', new Wallet({ address: () => Promise.resolve(ownerAddress) }));

    securityTokenMock.mock('isIssuable', true);

    target = new FreezeIssuance(params, contextMock.getMockInstance());
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have FreezeIssuance type', async () => {
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.FreezeIssuance);
    });
  });

  describe('FreezeIssuance', () => {
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

    test('should throw error if the security token is not issuable', async () => {
      securityTokenMock.mock('isIssuable', false);

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: 'Issuance has already been frozen permanently',
        })
      );
    });

    test('should throw if wallet address is different than owner address', async () => {
      contextMock.set('currentWallet', new Wallet({ address: () => Promise.resolve('0x02') }));

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `You must be the owner of this Security Token to freeze issuance`,
        })
      );
    });

    test('should add a transaction to the queue to freeze issuance of the security token, without passing in a signature', async () => {
      const freezeIssuanceArgsSpy = sinon.spy();
      const addTransactionStub = stub(target, 'addTransaction');
      securityTokenMock.mock('freezeIssuance', 'FreezeIssuance');
      const { freezeIssuance } = securityTokenMock.getMockInstance();
      addTransactionStub.withArgs(freezeIssuance).returns(freezeIssuanceArgsSpy);

      const addSignatureRequestArgsStub = sinon.stub();
      addSignatureRequestArgsStub.returns(Promise.resolve(randomSignature));
      const addSignatureRequestStub = stub(target, 'addSignatureRequest');

      securityTokenMock.mock('signFreezeIssuanceAck', randomSignature);
      addSignatureRequestStub
        .withArgs(securityTokenMock.getMockInstance().signFreezeIssuanceAck)
        .returns(addSignatureRequestArgsStub);

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(freezeIssuanceArgsSpy.getCall(0).args[0]).toEqual({
        signature: randomSignature,
      });
      expect(freezeIssuanceArgsSpy.callCount).toEqual(1);
      expect(addSignatureRequestArgsStub.getCall(0).args[0]).toEqual({});
      expect(addSignatureRequestArgsStub.callCount).toEqual(1);

      expect(
        addTransactionStub
          .getCall(0)
          .calledWithExactly(securityTokenMock.getMockInstance().freezeIssuance, {
            tag: PolyTransactionTag.FreezeIssuance,
          })
      ).toEqual(true);
      expect(addTransactionStub.callCount).toEqual(1);

      expect(
        addSignatureRequestStub
          .getCall(0)
          .calledWithExactly(securityTokenMock.getMockInstance().signFreezeIssuanceAck)
      ).toEqual(true);
      expect(addSignatureRequestStub.callCount).toEqual(1);
    });

    test('should add a transaction to the queue to freeze issuance of the security token, passing in your own hex signature', async () => {
      target = new FreezeIssuance(
        { ...params, signature: randomSignature },
        contextMock.getMockInstance()
      );
      const freezeIssuanceArgsSpy = sinon.spy();
      const addTransactionStub = stub(target, 'addTransaction');
      securityTokenMock.mock('freezeIssuance', 'FreezeIssuance');
      const { freezeIssuance } = securityTokenMock.getMockInstance();
      addTransactionStub.withArgs(freezeIssuance).returns(freezeIssuanceArgsSpy);

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(freezeIssuanceArgsSpy.getCall(0).args[0]).toEqual({
        signature: randomSignature,
      });
      expect(freezeIssuanceArgsSpy.callCount).toEqual(1);
      expect(
        addTransactionStub
          .getCall(0)
          .calledWithExactly(securityTokenMock.getMockInstance().freezeIssuance, {
            tag: PolyTransactionTag.FreezeIssuance,
          })
      ).toEqual(true);
      expect(addTransactionStub.callCount).toEqual(1);
    });
  });
});
