# Class: Transfers

Namespace that handles all Transfer related functionality

## Hierarchy

* [SubModule](entities.securitytoken.submodule.md)

  ↳ **Transfers**

## Index

### Constructors

* [constructor](entities.securitytoken.transfers.transfers.md#constructor)

### Properties

* [context](entities.securitytoken.transfers.transfers.md#protected-context)
* [restrictions](entities.securitytoken.transfers.transfers.md#restrictions)
* [securityToken](entities.securitytoken.transfers.transfers.md#protected-securitytoken)

### Methods

* [canTransfer](entities.securitytoken.transfers.transfers.md#cantransfer)
* [freeze](entities.securitytoken.transfers.transfers.md#freeze)
* [frozen](entities.securitytoken.transfers.transfers.md#frozen)
* [getStatusCode](entities.securitytoken.transfers.transfers.md#private-getstatuscode)
* [signKycData](entities.securitytoken.transfers.transfers.md#signkycdata)
* [transfer](entities.securitytoken.transfers.transfers.md#transfer)
* [unfreeze](entities.securitytoken.transfers.transfers.md#unfreeze)

## Constructors

###  constructor

\+ **new Transfers**(`securityToken`: [SecurityToken](entities.securitytoken.securitytoken.md), `context`: [Context](_context_.context.md)): *[Transfers](entities.securitytoken.transfers.transfers.md)*

*Overrides [SubModule](entities.securitytoken.submodule.md).[constructor](entities.securitytoken.submodule.md#constructor)*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:26](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L26)*

Create a new Transfers instance

**Parameters:**

Name | Type |
------ | ------ |
`securityToken` | [SecurityToken](entities.securitytoken.securitytoken.md) |
`context` | [Context](_context_.context.md) |

**Returns:** *[Transfers](entities.securitytoken.transfers.transfers.md)*

## Properties

### `Protected` context

• **context**: *[Context](_context_.context.md)*

*Inherited from [SubModule](entities.securitytoken.submodule.md).[context](entities.securitytoken.submodule.md#protected-context)*

*Defined in [src/entities/SecurityToken/SubModule.ts:15](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/SubModule.ts#L15)*

___

###  restrictions

• **restrictions**: *[Restrictions](entities.securitytoken.transfers.restrictions.restrictions.md)*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:26](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L26)*

___

### `Protected` securityToken

• **securityToken**: *[SecurityToken](entities.securitytoken.securitytoken.md)*

*Inherited from [SubModule](entities.securitytoken.submodule.md).[securityToken](entities.securitytoken.submodule.md#protected-securitytoken)*

*Defined in [src/entities/SecurityToken/SubModule.ts:13](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/SubModule.ts#L13)*

## Methods

###  canTransfer

▸ **canTransfer**(`args`: object): *Promise‹object›*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:135](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L135)*

Validate if a transfer of Security Tokens can be performed. This takes all present transfer restrictions into account

**Parameters:**

▪ **args**: *object*

Name | Type |
------ | ------ |
`data?` | undefined &#124; string |
`from?` | undefined &#124; string |
`to` | string |
`value` | BigNumber |

**Returns:** *Promise‹object›*

___

###  freeze

▸ **freeze**(): *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[ToggleFreezeTransfersProcedureArgs](../interfaces/_types_index_.togglefreezetransfersprocedureargs.md), void››*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:119](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L119)*

Freeze transfers of the security token

**Returns:** *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[ToggleFreezeTransfersProcedureArgs](../interfaces/_types_index_.togglefreezetransfersprocedureargs.md), void››*

___

###  frozen

▸ **frozen**(): *Promise‹boolean›*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:94](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L94)*

Retrieve whether the transfer of tokens is frozen or not
Can be modified with `freeze` and `unfreeze`

**Returns:** *Promise‹boolean›*

___

### `Private` getStatusCode

▸ **getStatusCode**(`statusCode`: RawTransferStatusCode): *[TransferStatusCode](../enums/_types_index_.transferstatuscode.md)*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:173](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L173)*

**Parameters:**

Name | Type |
------ | ------ |
`statusCode` | RawTransferStatusCode |

**Returns:** *[TransferStatusCode](../enums/_types_index_.transferstatuscode.md)*

___

###  signKycData

▸ **signKycData**(`args`: object): *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[SignTransferDataProcedureArgs](../interfaces/_types_index_.signtransferdataprocedureargs.md), void››*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:52](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L52)*

Generate a signature string based on dynamic KYC data. This data can be used to:

- Check if a transfer can be made (using `canTransfer`) with different KYC data than is currently present
- Actually make a transfer (using `transfer`) with different KYC data than is currently present (in this case, the existing KYC data will be overwritten)

The signature can be generated by a third party other than the issuer. The signing wallet should have permission to modify KYC data (via the Shareholders Administrator role)
Otherwise, the new data will be disregarded

**Note that, when supplying KYC data for signing, ALL investor entries should be supplied (even those that remain the same)**

**Parameters:**

▪ **args**: *object*

Name | Type |
------ | ------ |
`kycData` | [Omit](../modules/_types_index_.md#omit)‹[Omit](../modules/_types_index_.md#omit)‹[ShareholderDataEntry](../interfaces/_types_index_.shareholderdataentry.md), "canBuyFromSto"›, "isAccredited"›[] |
`validFrom` | Date |
`validTo` | Date |

**Returns:** *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[SignTransferDataProcedureArgs](../interfaces/_types_index_.signtransferdataprocedureargs.md), void››*

___

###  transfer

▸ **transfer**(`args`: object): *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[TransferSecurityTokensProcedureArgs](../interfaces/_types_index_.transfersecuritytokensprocedureargs.md), void››*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:77](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L77)*

Transfer an amount of Security Tokens to a specified address

**Parameters:**

▪ **args**: *object*

Name | Type |
------ | ------ |
`amount` | BigNumber |
`data?` | undefined &#124; string |
`from?` | undefined &#124; string |
`to` | string |

**Returns:** *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[TransferSecurityTokensProcedureArgs](../interfaces/_types_index_.transfersecuritytokensprocedureargs.md), void››*

___

###  unfreeze

▸ **unfreeze**(): *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[ToggleFreezeTransfersProcedureArgs](../interfaces/_types_index_.togglefreezetransfersprocedureargs.md), void››*

*Defined in [src/entities/SecurityToken/Transfers/Transfers.ts:206](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Transfers/Transfers.ts#L206)*

Unfreeze transfers of the security token

**Returns:** *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[ToggleFreezeTransfersProcedureArgs](../interfaces/_types_index_.togglefreezetransfersprocedureargs.md), void››*