# Class: Documents

Namespace that handles all document Related functionality

## Hierarchy

* [SubModule](entities.securitytoken.submodule.md)

  ↳ **Documents**

## Index

### Constructors

* [constructor](entities.securitytoken.documents.md#constructor)

### Properties

* [context](entities.securitytoken.documents.md#protected-context)
* [securityToken](entities.securitytoken.documents.md#protected-securitytoken)

### Methods

* [getAllDocuments](entities.securitytoken.documents.md#getalldocuments)
* [getDocument](entities.securitytoken.documents.md#getdocument)
* [remove](entities.securitytoken.documents.md#remove)
* [set](entities.securitytoken.documents.md#set)

## Constructors

###  constructor

\+ **new Documents**(`securityToken`: [SecurityToken](entities.securitytoken.securitytoken.md), `context`: [Context](_context_.context.md)): *[Documents](entities.securitytoken.documents.md)*

*Inherited from [SubModule](entities.securitytoken.submodule.md).[constructor](entities.securitytoken.submodule.md#constructor)*

*Defined in [src/entities/SecurityToken/SubModule.ts:15](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/SubModule.ts#L15)*

Create a new SubModule instance

**Parameters:**

Name | Type |
------ | ------ |
`securityToken` | [SecurityToken](entities.securitytoken.securitytoken.md) |
`context` | [Context](_context_.context.md) |

**Returns:** *[Documents](entities.securitytoken.documents.md)*

## Properties

### `Protected` context

• **context**: *[Context](_context_.context.md)*

*Inherited from [SubModule](entities.securitytoken.submodule.md).[context](entities.securitytoken.submodule.md#protected-context)*

*Defined in [src/entities/SecurityToken/SubModule.ts:15](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/SubModule.ts#L15)*

___

### `Protected` securityToken

• **securityToken**: *[SecurityToken](entities.securitytoken.securitytoken.md)*

*Inherited from [SubModule](entities.securitytoken.submodule.md).[securityToken](entities.securitytoken.submodule.md#protected-securitytoken)*

*Defined in [src/entities/SecurityToken/SubModule.ts:13](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/SubModule.ts#L13)*

## Methods

###  getAllDocuments

▸ **getAllDocuments**(): *Promise‹[Document](../interfaces/entities.securitytoken.document.md)[]›*

*Defined in [src/entities/SecurityToken/Documents.ts:95](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Documents.ts#L95)*

Retrieve an array of all the documents attached to the security token

**Returns:** *Promise‹[Document](../interfaces/entities.securitytoken.document.md)[]›*

___

###  getDocument

▸ **getDocument**(`args`: object): *Promise‹[Document](../interfaces/entities.securitytoken.document.md)›*

*Defined in [src/entities/SecurityToken/Documents.ts:66](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Documents.ts#L66)*

Retrieve a specific document's data by name

**Parameters:**

▪ **args**: *object*

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *Promise‹[Document](../interfaces/entities.securitytoken.document.md)›*

___

###  remove

▸ **remove**(`args`: object): *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[RemoveDocumentProcedureArgs](../interfaces/_types_index_.removedocumentprocedureargs.md), void››*

*Defined in [src/entities/SecurityToken/Documents.ts:55](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Documents.ts#L55)*

Remove an existing document from the Security Token

**Parameters:**

▪ **args**: *object*

Name | Type | Description |
------ | ------ | ------ |
`name` | string | should always be unique  |

**Returns:** *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[RemoveDocumentProcedureArgs](../interfaces/_types_index_.removedocumentprocedureargs.md), void››*

___

###  set

▸ **set**(`args`: object): *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[SetDocumentProcedureArgs](../interfaces/_types_index_.setdocumentprocedureargs.md), void››*

*Defined in [src/entities/SecurityToken/Documents.ts:42](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Documents.ts#L42)*

Attach a new document to the contract, or update the URI or hash of an existing attached document

**Parameters:**

▪ **args**: *object*

Name | Type | Description |
------ | ------ | ------ |
`documentHash` | string | hash of the document's contents  |
`name` | string | should always be unique |
`uri` | string | off-chain uri of the document from where it is accessible to investors/advisors to read |

**Returns:** *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[SetDocumentProcedureArgs](../interfaces/_types_index_.setdocumentprocedureargs.md), void››*