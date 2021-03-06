import { ImportMock, MockManager } from 'ts-mock-imports';
import sinon, { restore, stub } from 'sinon';
import * as contractWrappersModule from '@polymathnetwork/contract-wrappers';
import * as contextModule from '../../Context';
import * as wrappersModule from '../../PolymathBase';
import * as tokenFactoryModule from '../../testUtils/MockedTokenFactoryModule';
import { SetDocument } from '../../procedures/SetDocument';
import { Procedure } from '../../procedures/Procedure';
import {
  ProcedureType,
  PolyTransactionTag,
  ErrorCode,
  SetDocumentProcedureArgs,
} from '../../types';
import { PolymathError } from '../../PolymathError';
import { Wallet } from '../../Wallet';

const params: SetDocumentProcedureArgs = {
  symbol: 'TEST1',
  name: 'Doc Name',
  uri: 'Doc Uri',
  documentHash: 'Doc Hash',
};

describe('SetDocument', () => {
  let target: SetDocument;
  let contextMock: MockManager<contextModule.Context>;
  let wrappersMock: MockManager<wrappersModule.PolymathBase>;
  let tokenFactoryMock: MockManager<tokenFactoryModule.MockedTokenFactoryModule>;
  let securityTokenMock: MockManager<contractWrappersModule.SecurityToken_3_0_0>;

  beforeEach(() => {
    // Mock the context, wrappers, tokenFactory and securityToken to test SetDocument
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
    contextMock.set('currentWallet', new Wallet({ address: () => Promise.resolve('0x02') }));
    securityTokenMock.set('owner', () => Promise.resolve('0x02'));
  });

  afterEach(() => {
    restore();
  });

  describe('Types', () => {
    test('should extend procedure and have SetDocument type', async () => {
      target = new SetDocument(params, contextMock.getMockInstance());
      expect(target instanceof Procedure).toBe(true);
      expect(target.type).toBe(ProcedureType.SetDocument);
    });
  });

  describe('SetDocument', () => {
    test('should throw if there is no valid security token being provided', async () => {
      // Instantiate SetDocument with incorrect security symbol
      target = new SetDocument(params, contextMock.getMockInstance());

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

    test('should throw if the document name is too large', async () => {
      // Instantiate SetDocument
      target = new SetDocument(
        {
          ...params,
          name: 'abcdefghijklmnopqrstuvwxyzabcdefg',
        },
        contextMock.getMockInstance()
      );

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `You must provide a valid name between 1 and 32 characters long`,
        })
      );
    });

    test('should throw if the document name is empty', async () => {
      // Instantiate SetDocument
      target = new SetDocument(
        {
          ...params,
          name: '',
        },
        contextMock.getMockInstance()
      );

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `You must provide a valid name between 1 and 32 characters long`,
        })
      );
    });

    test('should throw if the document hash is too large', async () => {
      // Instantiate SetDocument
      target = new SetDocument(
        {
          ...params,
          documentHash: 'abcdefghijklmnopqrstuvwxyzabcdefg',
        },
        contextMock.getMockInstance()
      );

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `You must provide a valid document hash between 1 and 32 characters long`,
        })
      );
    });

    test('should throw if the document hash is empty', async () => {
      // Instantiate SetDocument
      target = new SetDocument(
        {
          ...params,
          documentHash: '',
        },
        contextMock.getMockInstance()
      );

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `You must provide a valid document hash between 1 and 32 characters long`,
        })
      );
    });

    test('should throw if account address is different than owner address', async () => {
      securityTokenMock.mock('owner', Promise.resolve('0x01'));

      // Instantiate SetDocument
      target = new SetDocument(params, contextMock.getMockInstance());

      // Real call rejects
      await expect(target.prepareTransactions()).rejects.toThrowError(
        new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `You must be the owner of this Security Token to set the document`,
        })
      );
    });

    test('should add a transaction to the queue to set a document on the security token', async () => {
      securityTokenMock.mock('owner', Promise.resolve('0x01'));
      contextMock.set('currentWallet', new Wallet({ address: () => Promise.resolve('0x01') }));

      target = new SetDocument(params, contextMock.getMockInstance());

      const setDocumentArgsSpy = sinon.spy();
      const addTransactionStub = stub(target, 'addTransaction');
      securityTokenMock.mock('setDocument', Promise.resolve('SetDocument'));
      const { setDocument } = securityTokenMock.getMockInstance();
      addTransactionStub.withArgs(setDocument).returns(setDocumentArgsSpy);

      // Real call
      await target.prepareTransactions();

      // Verifications
      expect(setDocumentArgsSpy.getCall(0).args[0]).toEqual({
        name: params.name,
        uri: params.uri,
        documentHash: params.documentHash,
      });
      expect(setDocumentArgsSpy.callCount).toEqual(1);

      expect(
        addTransactionStub
          .getCall(0)
          .calledWithExactly(securityTokenMock.getMockInstance().setDocument, {
            tag: PolyTransactionTag.SetDocument,
          })
      ).toEqual(true);
      expect(addTransactionStub.callCount).toEqual(1);
    });
  });
});
