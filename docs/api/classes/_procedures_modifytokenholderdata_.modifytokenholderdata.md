# ModifyTokenholderData

Procedure that modifies data for a list of \(potential\) tokenholders. The data that can be modified is:

* KYC data \(sale/buy lockup dates and KYC expiry\)
* Whether the tokenholder is accredited
* Whether the tokenholder can buy from an STO

## Hierarchy

* Procedure‹[ModifyTokenholderDataProcedureArgs](../interfaces/_types_index_.modifytokenholderdataprocedureargs.md), [Tokenholder](_entities_tokenholder_.tokenholder.md)\[\]›

  ↳ **ModifyTokenholderData**

## Index

### Constructors

* [constructor](_procedures_modifytokenholderdata_.modifytokenholderdata.md#constructor)

### Properties

* [args](_procedures_modifytokenholderdata_.modifytokenholderdata.md#protected-args)
* [context](_procedures_modifytokenholderdata_.modifytokenholderdata.md#protected-context)
* [type](_procedures_modifytokenholderdata_.modifytokenholderdata.md#type)

### Methods

* [addProcedure](_procedures_modifytokenholderdata_.modifytokenholderdata.md#addprocedure)
* [addSignatureRequest](_procedures_modifytokenholderdata_.modifytokenholderdata.md#addsignaturerequest)
* [addTransaction](_procedures_modifytokenholderdata_.modifytokenholderdata.md#addtransaction)
* [prepare](_procedures_modifytokenholderdata_.modifytokenholderdata.md#prepare)
* [prepareTransactions](_procedures_modifytokenholderdata_.modifytokenholderdata.md#preparetransactions)

## Constructors

### constructor

+ **new ModifyTokenholderData**\(`args`: [ModifyTokenholderDataProcedureArgs](../interfaces/_types_index_.modifytokenholderdataprocedureargs.md), `context`: [Context](_context_.context.md)\): [_ModifyTokenholderData_](_procedures_modifytokenholderdata_.modifytokenholderdata.md)

_Inherited from void_

_Defined in_ [_src/procedures/Procedure.ts:40_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/Procedure.ts#L40)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `args` | [ModifyTokenholderDataProcedureArgs](../interfaces/_types_index_.modifytokenholderdataprocedureargs.md) |
| `context` | [Context](_context_.context.md) |

**Returns:** [_ModifyTokenholderData_](_procedures_modifytokenholderdata_.modifytokenholderdata.md)

## Properties

### `Protected` args

• **args**: [_ModifyTokenholderDataProcedureArgs_](../interfaces/_types_index_.modifytokenholderdataprocedureargs.md)

_Inherited from void_

_Defined in_ [_src/procedures/Procedure.ts:34_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/Procedure.ts#L34)

### `Protected` context

• **context**: [_Context_](_context_.context.md)

_Inherited from void_

_Defined in_ [_src/procedures/Procedure.ts:36_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/Procedure.ts#L36)

### type

• **type**: [_ProcedureType_](../enums/_types_index_.proceduretype.md) = ProcedureType.ModifyTokenholderData

_Overrides void_

_Defined in_ [_src/procedures/ModifyTokenholderData.ts:31_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/ModifyTokenholderData.ts#L31)

## Methods

### addProcedure

▸ **addProcedure**&lt;**A**, **R**&gt;\(`Proc`: [ProcedureClass](../interfaces/_procedures_procedure_.procedureclass.md)‹A, R›\): _\(Anonymous function\)_

_Inherited from void_

_Defined in_ [_src/procedures/Procedure.ts:91_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/Procedure.ts#L91)

Appends a Procedure into the TransactionQueue's queue. This defines what will be run by the TransactionQueue when it is started.

**Type parameters:**

▪ **A**

▪ **R**: _any_

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `Proc` | [ProcedureClass](../interfaces/_procedures_procedure_.procedureclass.md)‹A, R› | A Procedure that will be run in the Procedure's TransactionQueue |

**Returns:** _\(Anonymous function\)_

whichever value is returned by the Procedure

### addSignatureRequest

▸ **addSignatureRequest**&lt;**A**&gt;\(`request`: [SignatureRequest](../external-modules/_types_index_.md#signaturerequest)‹A›\): _\(Anonymous function\)_

_Inherited from void_

_Defined in_ [_src/procedures/Procedure.ts:179_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/Procedure.ts#L179)

Appends a signature request into the TransactionQueue's queue. This defines what will be run by the TransactionQueue when it is started.

**Type parameters:**

▪ **A**

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `request` | [SignatureRequest](../external-modules/_types_index_.md#signaturerequest)‹A› | A signature request that will be run in the Procedure's TransactionQueue |

**Returns:** _\(Anonymous function\)_

a PostTransactionResolver that resolves to the signed data

### addTransaction

▸ **addTransaction**&lt;**A**, **R**, **V**&gt;\(`method`: [LowLevelMethod](../external-modules/_types_index_.md#lowlevelmethod)‹A› \| [FutureLowLevelMethod](../interfaces/_types_index_.futurelowlevelmethod.md)‹V, A›, `__namedParameters`: object\): _\(Anonymous function\)_

_Inherited from void_

_Defined in_ [_src/procedures/Procedure.ts:137_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/Procedure.ts#L137)

Appends a method or future method into the TransactionQueue's queue. This defines what will be run by the TransactionQueue when it is started.

**Type parameters:**

▪ **A**

▪ **R**: _any\[\]_

▪ **V**: _any_

**Parameters:**

▪ **method**: [_LowLevelMethod_](../external-modules/_types_index_.md#lowlevelmethod)_‹A› \|_ [_FutureLowLevelMethod_](../interfaces/_types_index_.futurelowlevelmethod.md)_‹V, A›_

A method \(or future method\) that will be run in the Procedure's TransactionQueue. A future method is a transaction that doesn't exist at prepare time \(for example a transaction on a module that hasn't been attached but will be by the time the previous transactions are run\)

▪`Default value` **\_\_namedParameters**: _object_= {}

| Name | Type | Default |
| :--- | :--- | :--- |
| `fees` | undefined \| [Fees](../interfaces/_types_index_.fees.md) | - |
| `resolvers` | object | \(\[\] as unknown\) as ResolverArray |
| `tag` | undefined \| [Any](../enums/_types_index_.polytransactiontag.md#any) \| [GetTokens](../enums/_types_index_.polytransactiontag.md#gettokens) \| [ApproveErc20](../enums/_types_index_.polytransactiontag.md#approveerc20) \| [TransferErc20](../enums/_types_index_.polytransactiontag.md#transfererc20) \| [ReserveSecurityToken](../enums/_types_index_.polytransactiontag.md#reservesecuritytoken) \| [CreateSecurityToken](../enums/_types_index_.polytransactiontag.md#createsecuritytoken) \| [CreateCheckpoint](../enums/_types_index_.polytransactiontag.md#createcheckpoint) \| [CreateErc20DividendDistribution](../enums/_types_index_.polytransactiontag.md#createerc20dividenddistribution) \| [SetErc20TaxWithholding](../enums/_types_index_.polytransactiontag.md#seterc20taxwithholding) \| [SetEtherTaxWithholding](../enums/_types_index_.polytransactiontag.md#setethertaxwithholding) \| [SetDefaultExcluded](../enums/_types_index_.polytransactiontag.md#setdefaultexcluded) \| [EnableDividends](../enums/_types_index_.polytransactiontag.md#enabledividends) \| [EnableCappedSto](../enums/_types_index_.polytransactiontag.md#enablecappedsto) \| [EnableTieredSto](../enums/_types_index_.polytransactiontag.md#enabletieredsto) \| [EnableGeneralPermissionManager](../enums/_types_index_.polytransactiontag.md#enablegeneralpermissionmanager) \| [EnableGeneralTransferManager](../enums/_types_index_.polytransactiontag.md#enablegeneraltransfermanager) \| [EnableCountTransferManager](../enums/_types_index_.polytransactiontag.md#enablecounttransfermanager) \| [EnablePercentageTransferManager](../enums/_types_index_.polytransactiontag.md#enablepercentagetransfermanager) \| [DisableController](../enums/_types_index_.polytransactiontag.md#disablecontroller) \| [FreezeIssuance](../enums/_types_index_.polytransactiontag.md#freezeissuance) \| [DisableFeature](../enums/_types_index_.polytransactiontag.md#disablefeature) \| [ReclaimDividendFunds](../enums/_types_index_.polytransactiontag.md#reclaimdividendfunds) \| [WithdrawTaxWithholdings](../enums/_types_index_.polytransactiontag.md#withdrawtaxwithholdings) \| [PushDividendPayment](../enums/_types_index_.polytransactiontag.md#pushdividendpayment) \| [PullDividendPayment](../enums/_types_index_.polytransactiontag.md#pulldividendpayment) \| [SetDividendsWallet](../enums/_types_index_.polytransactiontag.md#setdividendswallet) \| [AddDelegate](../enums/_types_index_.polytransactiontag.md#adddelegate) \| [ChangePermission](../enums/_types_index_.polytransactiontag.md#changepermission) \| [ControllerTransfer](../enums/_types_index_.polytransactiontag.md#controllertransfer) \| [ControllerRedeem](../enums/_types_index_.polytransactiontag.md#controllerredeem) \| [PauseSto](../enums/_types_index_.polytransactiontag.md#pausesto) \| [UnpauseSto](../enums/_types_index_.polytransactiontag.md#unpausesto) \| [FinalizeSto](../enums/_types_index_.polytransactiontag.md#finalizesto) \| [SetController](../enums/_types_index_.polytransactiontag.md#setcontroller) \| [SetDocument](../enums/_types_index_.polytransactiontag.md#setdocument) \| [RemoveDocument](../enums/_types_index_.polytransactiontag.md#removedocument) \| [ModifyKycDataMulti](../enums/_types_index_.polytransactiontag.md#modifykycdatamulti) \| [ModifyInvestorFlagMulti](../enums/_types_index_.polytransactiontag.md#modifyinvestorflagmulti) \| [IssueMulti](../enums/_types_index_.polytransactiontag.md#issuemulti) \| [AllowPreMinting](../enums/_types_index_.polytransactiontag.md#allowpreminting) \| [RevokePreMinting](../enums/_types_index_.polytransactiontag.md#revokepreminting) \| [ChangeAllowBeneficialInvestments](../enums/_types_index_.polytransactiontag.md#changeallowbeneficialinvestments) \| [ModifyTimes](../enums/_types_index_.polytransactiontag.md#modifytimes) \| [ModifyFunding](../enums/_types_index_.polytransactiontag.md#modifyfunding) \| [ModifyAddresses](../enums/_types_index_.polytransactiontag.md#modifyaddresses) \| [ModifyTiers](../enums/_types_index_.polytransactiontag.md#modifytiers) \| [ModifyLimits](../enums/_types_index_.polytransactiontag.md#modifylimits) \| [ModifyOracles](../enums/_types_index_.polytransactiontag.md#modifyoracles) \| [BuyWithScRateLimited](../enums/_types_index_.polytransactiontag.md#buywithscratelimited) \| [BuyWithPolyRateLimited](../enums/_types_index_.polytransactiontag.md#buywithpolyratelimited) \| [BuyWithEthRateLimited](../enums/_types_index_.polytransactiontag.md#buywithethratelimited) \| [BuyTokens](../enums/_types_index_.polytransactiontag.md#buytokens) \| [BuyTokensWithPoly](../enums/_types_index_.polytransactiontag.md#buytokenswithpoly) \| [ChangeHolderCount](../enums/_types_index_.polytransactiontag.md#changeholdercount) \| [ChangeHolderPercentage](../enums/_types_index_.polytransactiontag.md#changeholderpercentage) \| [ModifyWhitelistMulti](../enums/_types_index_.polytransactiontag.md#modifywhitelistmulti) \| [SetAllowPrimaryIssuance](../enums/_types_index_.polytransactiontag.md#setallowprimaryissuance) \| [TransferSecurityTokens](../enums/_types_index_.polytransactiontag.md#transfersecuritytokens) \| [UnfreezeTransfers](../enums/_types_index_.polytransactiontag.md#unfreezetransfers) \| [FreezeTransfers](../enums/_types_index_.polytransactiontag.md#freezetransfers) \| [Signature](../enums/_types_index_.polytransactiontag.md#signature) \| [TransferReservationOwnership](../enums/_types_index_.polytransactiontag.md#transferreservationownership) \| [TransferOwnership](../enums/_types_index_.polytransactiontag.md#transferownership) | - |

**Returns:** _\(Anonymous function\)_

a PostTransactionResolver that resolves to the value returned by the resolver function, or undefined if no resolver function was passed

### prepare

▸ **prepare**\(\): _Promise‹_[_TransactionQueue_](_entities_transactionqueue_.transactionqueue.md)_‹Args, ReturnType››_

_Inherited from void_

_Defined in_ [_src/procedures/Procedure.ts:52_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/Procedure.ts#L52)

Mandatory method that builds a list of transactions that will be run

**Returns:** _Promise‹_[_TransactionQueue_](_entities_transactionqueue_.transactionqueue.md)_‹Args, ReturnType››_

### prepareTransactions

▸ **prepareTransactions**\(\): _Promise‹PostTransactionResolver‹_[_Tokenholder_](_entities_tokenholder_.tokenholder.md)_\[\], TransactionReceiptWithDecodedLogs››_

_Overrides void_

_Defined in_ [_src/procedures/ModifyTokenholderData.ts:41_](https://github.com/PolymathNetwork/polymath-sdk/blob/e8bbc1e/src/procedures/ModifyTokenholderData.ts#L41)

Update tokenholder data for a subset of addresses

Note that this procedure will fail if:

* You're trying to set the dates to 0 \(there is a special "RevokeKyc" procedure for that\)
* The Security Token doesn't exist
* There is no difference between the "new" data and the data already present in the contract

**Returns:** _Promise‹PostTransactionResolver‹_[_Tokenholder_](_entities_tokenholder_.tokenholder.md)_\[\], TransactionReceiptWithDecodedLogs››_

