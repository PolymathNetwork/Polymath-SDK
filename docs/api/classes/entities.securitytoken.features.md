# Class: Features

Namespace that handles all Feature related functionality

## Hierarchy

* [SubModule](entities.securitytoken.submodule.md)

  ↳ **Features**

## Index

### Constructors

* [constructor](entities.securitytoken.features.md#constructor)

### Properties

* [context](entities.securitytoken.features.md#protected-context)
* [list](entities.securitytoken.features.md#list)
* [securityToken](entities.securitytoken.features.md#protected-securitytoken)

### Methods

* [disable](entities.securitytoken.features.md#disable)
* [enable](entities.securitytoken.features.md#enable)
* [getModuleNameFromFeature](entities.securitytoken.features.md#private-getmodulenamefromfeature)
* [getStatus](entities.securitytoken.features.md#getstatus)
* [isEnabled](entities.securitytoken.features.md#isenabled)

## Constructors

###  constructor

\+ **new Features**(`securityToken`: [SecurityToken](entities.securitytoken.securitytoken.md), `context`: [Context](_context_.context.md)): *[Features](entities.securitytoken.features.md)*

*Inherited from [SubModule](entities.securitytoken.submodule.md).[constructor](entities.securitytoken.submodule.md#constructor)*

*Defined in [src/entities/SecurityToken/SubModule.ts:15](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/SubModule.ts#L15)*

Create a new SubModule instance

**Parameters:**

Name | Type |
------ | ------ |
`securityToken` | [SecurityToken](entities.securitytoken.securitytoken.md) |
`context` | [Context](_context_.context.md) |

**Returns:** *[Features](entities.securitytoken.features.md)*

## Properties

### `Protected` context

• **context**: *[Context](_context_.context.md)*

*Inherited from [SubModule](entities.securitytoken.submodule.md).[context](entities.securitytoken.submodule.md#protected-context)*

*Defined in [src/entities/SecurityToken/SubModule.ts:15](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/SubModule.ts#L15)*

___

###  list

• **list**: *[Feature](../enums/_types_index_.feature.md)[]* =  [
    Feature.Permissions,
    Feature.Shareholders,
    Feature.Dividends,
    Feature.ShareholderCountRestrictions,
    Feature.PercentageOwnershipRestrictions,
  ]

*Defined in [src/entities/SecurityToken/Features.ts:85](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Features.ts#L85)*

List of all existing features

___

### `Protected` securityToken

• **securityToken**: *[SecurityToken](entities.securitytoken.securitytoken.md)*

*Inherited from [SubModule](entities.securitytoken.submodule.md).[securityToken](entities.securitytoken.submodule.md#protected-securitytoken)*

*Defined in [src/entities/SecurityToken/SubModule.ts:13](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/SubModule.ts#L13)*

## Methods

###  disable

▸ **disable**(`args`: object): *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[DisableFeatureProcedureArgs](../interfaces/_types_index_.disablefeatureprocedureargs.md)››*

*Defined in [src/entities/SecurityToken/Features.ts:218](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Features.ts#L218)*

Disable a feature

**Parameters:**

▪ **args**: *object*

Name | Type |
------ | ------ |
`feature` | [Feature](../enums/_types_index_.feature.md) |

**Returns:** *Promise‹[TransactionQueue](entities.transactionqueue.md)‹[DisableFeatureProcedureArgs](../interfaces/_types_index_.disablefeatureprocedureargs.md)››*

___

###  enable

▸ **enable**(`args`: object, `opts?`: [EnableOpts](../modules/entities.securitytoken.md#enableopts)): *Promise‹[TransactionQueue](entities.transactionqueue.md)›*

*Defined in [src/entities/SecurityToken/Features.ts:143](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Features.ts#L143)*

Enable a feature

**Parameters:**

▪ **args**: *object*

Name | Type |
------ | ------ |
`feature` | [Feature](../enums/_types_index_.feature.md) |

▪`Optional`  **opts**: *[EnableOpts](../modules/entities.securitytoken.md#enableopts)*

**Returns:** *Promise‹[TransactionQueue](entities.transactionqueue.md)›*

___

### `Private` getModuleNameFromFeature

▸ **getModuleNameFromFeature**(`feature`: [Feature](../enums/_types_index_.feature.md)): *ModuleName*

*Defined in [src/entities/SecurityToken/Features.ts:245](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Features.ts#L245)*

**Parameters:**

Name | Type |
------ | ------ |
`feature` | [Feature](../enums/_types_index_.feature.md) |

**Returns:** *ModuleName*

___

###  getStatus

▸ **getStatus**(): *Promise‹[FeatureStatuses](../interfaces/entities.securitytoken.featurestatuses.md)›*

*Defined in [src/entities/SecurityToken/Features.ts:116](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Features.ts#L116)*

Gets the status on all Security Token features (true = enabled, false = not enabled/disabled)

**Returns:** *Promise‹[FeatureStatuses](../interfaces/entities.securitytoken.featurestatuses.md)›*

___

###  isEnabled

▸ **isEnabled**(`args`: object): *Promise‹boolean›*

*Defined in [src/entities/SecurityToken/Features.ts:98](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/SecurityToken/Features.ts#L98)*

Returns whether a particular feature has been enabled or not

**Parameters:**

▪ **args**: *object*

Name | Type |
------ | ------ |
`feature` | [Feature](../enums/_types_index_.feature.md) |

**Returns:** *Promise‹boolean›*