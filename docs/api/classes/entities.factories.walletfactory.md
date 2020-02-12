# Class: WalletFactory

Factory to generate properties for a wallet entity

## Hierarchy

* [Factory](entities.factories.factory.md)‹[Wallet](entities.wallet.md), [Params](../interfaces/entities.params-5.md), [UniqueIdentifiers](../interfaces/entities.uniqueidentifiers-4.md)›

  ↳ **WalletFactory**

## Index

### Constructors

* [constructor](entities.factories.walletfactory.md#constructor)

### Properties

* [Entity](entities.factories.walletfactory.md#entity)
* [cache](entities.factories.walletfactory.md#cache)
* [context](entities.factories.walletfactory.md#context)

### Methods

* [create](entities.factories.walletfactory.md#create)
* [fetch](entities.factories.walletfactory.md#fetch)
* [generateProperties](entities.factories.walletfactory.md#protected-generateproperties)
* [refresh](entities.factories.walletfactory.md#refresh)
* [update](entities.factories.walletfactory.md#update)

## Constructors

###  constructor

\+ **new WalletFactory**(`context`: [Context](_context_.context.md)): *[WalletFactory](entities.factories.walletfactory.md)*

*Overrides [Factory](entities.factories.factory.md).[constructor](entities.factories.factory.md#constructor)*

*Defined in [src/entities/factories/WalletFactory.ts:20](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/WalletFactory.ts#L20)*

Create a wallet factory

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](_context_.context.md) |

**Returns:** *[WalletFactory](entities.factories.walletfactory.md)*

## Properties

###  Entity

• **Entity**: *[EntityClass](../interfaces/entities.factories.entityclass.md)‹[Params](../interfaces/entities.params-5.md), [UniqueIdentifiers](../interfaces/entities.uniqueidentifiers-4.md)›*

*Inherited from [Factory](entities.factories.factory.md).[Entity](entities.factories.factory.md#entity)*

*Defined in [src/entities/factories/Factory.ts:42](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/Factory.ts#L42)*

entity class that this Factory is in charge of generating and caching

___

###  cache

• **cache**: *object*

*Inherited from [Factory](entities.factories.factory.md).[cache](entities.factories.factory.md#cache)*

*Defined in [src/entities/factories/Factory.ts:33](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/Factory.ts#L33)*

#### Type declaration:

* \[ **key**: *string*\]: [Wallet](entities.wallet.md) | undefined

___

###  context

• **context**: *[Context](_context_.context.md)*

*Inherited from [Factory](entities.factories.factory.md).[context](entities.factories.factory.md#context)*

*Defined in [src/entities/factories/Factory.ts:37](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/Factory.ts#L37)*

## Methods

###  create

▸ **create**(`uid`: string, `params`: [Params](../interfaces/entities.params-5.md)): *EntityType*

*Inherited from [Factory](entities.factories.factory.md).[create](entities.factories.factory.md#create)*

*Defined in [src/entities/factories/Factory.ts:92](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/Factory.ts#L92)*

Get an entity from the cache. Creates it if it isn't cached, updates it if it is

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`uid` | string | unique identifier for the entity |
`params` | [Params](../interfaces/entities.params-5.md) | constructor data for the entity  |

**Returns:** *EntityType*

___

###  fetch

▸ **fetch**(`uid`: string): *Promise‹EntityType›*

*Inherited from [Factory](entities.factories.factory.md).[fetch](entities.factories.factory.md#fetch)*

*Defined in [src/entities/factories/Factory.ts:62](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/Factory.ts#L62)*

Get an entity from the cache. Fetches the necessary data to create it if it isn't cached, refreshes it if it is

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`uid` | string | unique identifier for the entity  |

**Returns:** *Promise‹EntityType›*

___

### `Protected` generateProperties

▸ **generateProperties**(`uid`: string): *Promise‹object›*

*Overrides void*

*Defined in [src/entities/factories/WalletFactory.ts:14](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/WalletFactory.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`uid` | string |

**Returns:** *Promise‹object›*

___

###  refresh

▸ **refresh**(`uid`: string): *Promise‹void›*

*Inherited from [Factory](entities.factories.factory.md).[refresh](entities.factories.factory.md#refresh)*

*Defined in [src/entities/factories/Factory.ts:113](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/Factory.ts#L113)*

Fetch the data for an entity and updates its properties

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`uid` | string | unique identifier for the entity  |

**Returns:** *Promise‹void›*

___

###  update

▸ **update**(`uid`: string, `params`: Partial‹[Params](../interfaces/entities.params-5.md)›): *Promise‹void›*

*Inherited from [Factory](entities.factories.factory.md).[update](entities.factories.factory.md#update)*

*Defined in [src/entities/factories/Factory.ts:131](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/entities/factories/Factory.ts#L131)*

Update an entity's properties in place

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`uid` | string | unique identifier for the entity |
`params` | Partial‹[Params](../interfaces/entities.params-5.md)› | properties that should be updated  |

**Returns:** *Promise‹void›*