/* eslint-disable import/no-duplicates */
import { ImportMock, MockManager } from 'ts-mock-imports';
import sinon, { restore, stub } from 'sinon';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import * as contextModule from '../../Context';
import { Factories } from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as tokenFactoryModule from '../../testUtils/MockedTokenFactoryModule';
import { SignFreezeIssuanceAck } from '../SignFreezeIssuanceAck';
import { Procedure } from '../Procedure';
import { ProcedureType, ErrorCode } from '../../types';
import { PolymathError } from '../../PolymathError';
import { mockFactories } from '../../testUtils/mockFactories';

const params = {
  symbol: 'TEST1',
};

describe('SignFreezeIssuanceAck', () => {
  let target: SignFreezeIssuanceAck;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let tokenFactoryMock: MockManager<tokenFactoryModule.MockedTokenFactoryModule>;
  let securityTokenMock: MockManager<contractWrappersModule.SecurityToken_3_0_0>;
  let factoriesMockedSetup: Factories;

  beforeEach(() => {
    // Mock the context, wrappers, tokenFactory and securityToken to test SignFreezeIssuanceAck
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

    factoriesMockedSetup = mockFactories();
    contextMock.set('factories', factoriesMockedSetup);

    target = new SignFreezeIssuanceAck(params, contextMock.getMockInstance());
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have SignFreezeIssuanceAck type', async () => {
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.SignFreezeIssuanceAck);
    });
  });

  describe('SignFreezeIssuanceAck', () => {
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

    test('should add a signature request to the queue to sign confirmation for disabling the controller functionality', async () => {
      const addSignatureRequestArgsStub = sinon.stub();
      const randomSignature = 'Random freeze issuance signature ack';
      addSignatureRequestArgsStub.returns(Promise.resolve(randomSignature));
      const addSignatureRequestStub = stub(target, 'addSignatureRequest');
      securityTokenMock.mock('signFreezeIssuanceAck', Promise.resolve('SignFreezeIssuanceAck'));
      addSignatureRequestStub
        .withArgs(securityTokenMock.getMockInstance().signFreezeIssuanceAck)
        .returns(addSignatureRequestArgsStub);

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(addSignatureRequestArgsStub.getCall(0).args[0]).toEqual({});
      expect(addSignatureRequestArgsStub.callCount).toEqual(1);

      expect(
        addSignatureRequestStub
          .getCall(0)
          .calledWith(securityTokenMock.getMockInstance().signFreezeIssuanceAck)
      ).toEqual(true);
      expect(addSignatureRequestStub.callCount).toEqual(1);
    });
  });
});
