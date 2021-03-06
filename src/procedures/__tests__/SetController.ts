import { ImportMock, MockManager } from 'ts-mock-imports';
import sinon, { restore, stub } from 'sinon';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import * as contextModule from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as tokenFactoryModule from '../../testUtils/MockedTokenFactoryModule';
import { SetController } from '../../procedures/SetController';
import { Procedure } from '~/procedures/Procedure';
import { ProcedureType, PolyTransactionTag, ErrorCode } from '~/types';
import { PolymathError } from '~/PolymathError';
import { Wallet } from '../../Wallet';

const params = {
  symbol: 'TEST1',
  controller: '0x3333333333333333333333333333333333333333',
};

describe('SetController', () => {
  let target: SetController;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let tokenFactoryMock: MockManager<tokenFactoryModule.MockedTokenFactoryModule>;
  let securityTokenMock: MockManager<contractWrappersModule.SecurityToken_3_0_0>;

  beforeEach(() => {
    // Mock the context, wrappers, tokenFactory and securityToken to test SetController
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
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have SetController type', async () => {
      target = new SetController(params, contextMock.getMockInstance());
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.SetController);
    });
  });

  describe('SetController', () => {
    test('should throw if there is no valid security token being provided', async () => {
      // Instantiate SetController with incorrect security symbol
      target = new SetController(params, contextMock.getMockInstance());

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

    test('should call error on inappropriate controller address', async () => {
      // Instantiate SetController with incorrect args instead
      target = new SetController(
        {
          ...params,
          controller: 'Inappropriate',
        },
        contextMock.getMockInstance()
      );

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `Controller address "Inappropriate" is invalid.`,
        })
      );
    });

    test('should throw if account address is different than owner address', async () => {
      securityTokenMock.mock('owner', Promise.resolve('0x01'));
      contextMock.set('currentWallet', new Wallet({ address: () => Promise.resolve('0x02') }));

      // Instantiate SetController
      target = new SetController(params, contextMock.getMockInstance());

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `You must be the owner of this Security Token to set the controller`,
        })
      );
    });

    test('should add a transaction to the queue to set a controller on the security token', async () => {
      securityTokenMock.mock('owner', Promise.resolve('0x01'));
      contextMock.set('currentWallet', new Wallet({ address: () => Promise.resolve('0x01') }));

      target = new SetController(params, contextMock.getMockInstance());

      const setControllerArgsSpy = sinon.spy();
      const addTransactionStub = stub(target, 'addTransaction');
      securityTokenMock.mock('setController', Promise.resolve('SetController'));
      const { setController } = securityTokenMock.getMockInstance();
      addTransactionStub.withArgs(setController).returns(setControllerArgsSpy);

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(setControllerArgsSpy.getCall(0).args[0]).toEqual({
        controller: params.controller,
      });
      expect(setControllerArgsSpy.callCount).toEqual(1);

      expect(
        addTransactionStub
          .getCall(0)
          .calledWithExactly(securityTokenMock.getMockInstance().setController, {
            tag: PolyTransactionTag.SetController,
          })
      ).toEqual(true);
      expect(addTransactionStub.callCount).toEqual(1);
    });
  });
});
