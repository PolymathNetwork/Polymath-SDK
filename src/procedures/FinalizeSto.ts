import {
  ModuleName,
  isCappedSTO_3_0_0,
  BigNumber,
  TransferStatusCode,
} from '@polymathnetwork/contract-wrappers';
import { Procedure } from './Procedure';
import {
  ProcedureType,
  PolyTransactionTag,
  FinalizeStoProcedureArgs,
  ErrorCode,
  StoType,
} from '../types';
import { PolymathError } from '../PolymathError';
import { isValidAddress } from '../utils';
import { SecurityToken, SimpleSto, TieredSto } from '../entities';
import { Factories } from '../Context';

/**
 * @hidden
 */
export const createRefreshStoFactoryResolver = (
  factories: Factories,
  symbol: string,
  stoType: StoType,
  stoAddress: string
) => async () => {
  const securityTokenId = SecurityToken.generateId({ symbol });

  switch (stoType) {
    case StoType.Simple: {
      return factories.simpleStoFactory.refresh(
        SimpleSto.generateId({
          securityTokenId,
          stoType,
          address: stoAddress,
        })
      );
    }
    case StoType.Tiered: {
      return factories.tieredStoFactory.refresh(
        TieredSto.generateId({
          securityTokenId,
          stoType,
          address: stoAddress,
        })
      );
    }
    default: {
      return undefined;
    }
  }
};

/**
 * Procedure that finalizes an STO
 */
export class FinalizeSto extends Procedure<FinalizeStoProcedureArgs> {
  public type = ProcedureType.FinalizeSto;

  /**
   * @hidden
   */
  private checkTransferStatus(
    statusCode: TransferStatusCode,
    fromAddress: string,
    symbol: string,
    to: string,
    reasonCode: string,
    amount: BigNumber
  ) {
    if (statusCode !== TransferStatusCode.TransferSuccess) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `Treasury wallet "${to}" is not cleared to \
receive the remaining ${amount} "${symbol}" tokens from "${fromAddress}". \
Please review transfer restrictions regarding this wallet address before attempting \
to finalize the STO. Possible reason: "${reasonCode}"`,
      });
    }
  }

  /**
   * Finalize the STO
   *
   * Note this procedure will fail if:
   * - The specified STO address is invalid
   * - The STO has not been launched or the module has been archived
   * - Attempting to finalize a Simple STO with version 3.0.0 or less
   * - The specified STO type is invalid
   * - The STO has already been finalized
   * - The STO's treasury wallet does not clear all transfer restrictions
   */
  public async prepareTransactions() {
    const { context, args } = this;
    const { stoAddress, stoType, symbol } = args;
    const { contractWrappers, factories, currentWallet } = context;

    /*
     * Validation
     */
    let securityToken;

    try {
      securityToken = await contractWrappers.tokenFactory.getSecurityTokenInstanceFromTicker(
        symbol
      );
    } catch (err) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `There is no Security Token with symbol ${symbol}`,
      });
    }

    if (!isValidAddress(stoAddress)) {
      throw new PolymathError({
        code: ErrorCode.InvalidAddress,
        message: `Invalid STO address ${stoAddress}`,
      });
    }

    const stoModuleError = new PolymathError({
      code: ErrorCode.ProcedureValidationError,
      message: `STO ${stoAddress} is either archived or hasn't been launched`,
    });

    let stoModule;
    let remainingTokens: BigNumber;

    switch (stoType) {
      case StoType.Simple: {
        stoModule = await contractWrappers.moduleFactory.getModuleInstance({
          name: ModuleName.CappedSTO,
          address: stoAddress,
        });

        if (!stoModule) {
          throw stoModuleError;
        }

        if (isCappedSTO_3_0_0(stoModule)) {
          throw new PolymathError({
            code: ErrorCode.IncorrectVersion,
            message:
              'Capped STO version is 3.0.0. Version 3.1.0 or greater is required for forced finalization',
          });
        }

        const { totalTokensSold, cap } = await stoModule.getSTODetails();
        remainingTokens = cap.minus(totalTokensSold);

        break;
      }
      case StoType.Tiered: {
        stoModule = await contractWrappers.moduleFactory.getModuleInstance({
          name: ModuleName.UsdTieredSTO,
          address: stoAddress,
        });

        if (!stoModule) {
          throw stoModuleError;
        }

        const { tokensSold, capPerTier } = await stoModule.getSTODetails();
        const totalCap = capPerTier.reduce((prev, next) => prev.plus(next), new BigNumber(0));
        remainingTokens = totalCap.minus(tokensSold);

        break;
      }
      default: {
        throw new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: `Invalid STO type ${stoType}`,
        });
      }
    }

    const [isFinalized, treasuryWallet] = await Promise.all([
      stoModule.isFinalized(),
      contractWrappers.getTreasuryWallet({ module: stoModule }),
    ]);

    if (isFinalized) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `STO ${stoAddress} has already been finalized`,
      });
    }

    const address = await currentWallet.address();

    const { statusCode, reasonCode } = await securityToken.canTransfer({
      to: treasuryWallet,
      value: remainingTokens,
    });
    this.checkTransferStatus(
      statusCode,
      address,
      symbol,
      treasuryWallet,
      reasonCode,
      remainingTokens
    );

    /*
     * Transactions
     */
    await this.addTransaction(stoModule.finalize, {
      tag: PolyTransactionTag.FinalizeSto,
      resolvers: [createRefreshStoFactoryResolver(factories, symbol, stoType, stoAddress)],
    })({});
  }
}
