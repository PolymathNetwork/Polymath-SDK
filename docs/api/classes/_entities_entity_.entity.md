# Entity

Represents an object or resource in the Polymath Ecosystem with its own set of properties and functionality

## Type parameters

▪ **Params**

## Hierarchy

* **Entity**

  ↳ [PolyTransaction](_entities_polytransaction_.polytransaction.md)

  ↳ [TransactionQueue](_entities_transactionqueue_.transactionqueue.md)

  ↳ [SecurityTokenReservation](_entities_securitytokenreservation_.securitytokenreservation.md)

  ↳ [DividendDistribution](_entities_dividenddistribution_.dividenddistribution.md)

  ↳ [Checkpoint](_entities_checkpoint_.checkpoint.md)

  ↳ [TaxWithholding](_entities_taxwithholding_.taxwithholding.md)

  ↳ [Erc20TokenBalance](_entities_erc20tokenbalance_.erc20tokenbalance.md)

  ↳ [Sto](_entities_sto_.sto.md)

  ↳ [Investment](_entities_investment_.investment.md)

  ↳ [Tokenholder](_entities_tokenholder_.tokenholder.md)

  ↳ [Wallet](_entities_wallet_.wallet.md)

  ↳ [SecurityToken](_entities_securitytoken_securitytoken_.securitytoken.md)

## Index

### Properties

* [uid](_entities_entity_.entity.md#abstract-uid)

### Methods

* [\_refresh](_entities_entity_.entity.md#abstract-_refresh)
* [toPojo](_entities_entity_.entity.md#abstract-topojo)

## Properties

### `Abstract` uid

• **uid**: _string_

_Defined in_ [_src/entities/Entity.ts:5_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/entities/Entity.ts#L5)

## Methods

### `Abstract` \_refresh

▸ **\_refresh**\(`params`: Partial‹Params›\): _void_

_Defined in_ [_src/entities/Entity.ts:9_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/entities/Entity.ts#L9)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params` | Partial‹Params› |

**Returns:** _void_

### `Abstract` toPojo

▸ **toPojo**\(\): _any_

_Defined in_ [_src/entities/Entity.ts:7_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/entities/Entity.ts#L7)

**Returns:** _any_

