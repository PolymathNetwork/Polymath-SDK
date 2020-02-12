# Interface: FutureLowLevelMethod <**T, U**>

Represents a contract method that doesn't exist yet but will exist
once a certain post transaction resolver is resolved

## Type parameters

▪ **T**

type of the value that will be resolved by the post transaction resolver

▪ **U**

type of the arguments object that the future method will accept

## Hierarchy

* **FutureLowLevelMethod**

## Index

### Properties

* [futureMethod](_types_index_.futurelowlevelmethod.md#futuremethod)
* [futureValue](_types_index_.futurelowlevelmethod.md#futurevalue)

## Properties

###  futureMethod

• **futureMethod**: *function*

*Defined in [src/types/index.ts:1519](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/types/index.ts#L1519)*

function that returns a low level method

#### Type declaration:

▸ (`resolvedValue`: T): *Promise‹[LowLevelMethod](../modules/_types_index_.md#lowlevelmethod)‹U››*

**Parameters:**

Name | Type |
------ | ------ |
`resolvedValue` | T |

___

###  futureValue

• **futureValue**: *PostTransactionResolver‹T›*

*Defined in [src/types/index.ts:1523](https://github.com/PolymathNetwork/polymath-sdk/blob/454d285/src/types/index.ts#L1523)*

post transaction resolver that resolves into the value that is passed to the future method