import { BigNumber, FundRaiseType, ModuleName } from '@polymathnetwork/contract-wrappers';
import { Procedure } from './Procedure';
import {
  Currency,
  ErrorCode,
  InvestInTieredStoProcedureArgs,
  isInvestWithStableCoinArgs,
  PolyTransactionTag,
  ProcedureType,
  StoType,
} from '../types';
import { PolymathError } from '../PolymathError';
import { isValidAddress } from '../utils';
import { SecurityToken, TieredSto } from '../entities';
import { ApproveErc20 } from './ApproveErc20';
import { Factories } from '../Context';

/**
 * @hidden
 */
export const createRefreshSecurityTokenFactoryResolver = (
  factories: Factories,
  securityTokenId: string
) => async () => {
  return factories.securityTokenFactory.refresh(securityTokenId);
};

/**
 * @hidden
 */
export const createRefreshTieredStoFactoryResolver = (
  factories: Factories,
  tieredStoId: string
) => async () => {
  return factories.tieredStoFactory.refresh(tieredStoId);
};

/**
 * Procedure that invests in a Tiered STO
 */
export class InvestInTieredSto extends Procedure<InvestInTieredStoProcedureArgs> {
  public type = ProcedureType.InvestInTieredSto;

  /**
   * Invest the specified amount in the STO
   *
   * Note that this procedure will fail if:
   * - The Security Token doesn't exist
   * - The STO address is invalid
   * - The STO is either archived or hasn't been launched
   * - The STO hasn't started yet
   * - The STO is paused
   * - Trying to invest on behalf of someone else if the STO doesn't allow beneficial investments
   * - The STO doesn't support investments in the selected currency
   */
  public async prepareTransactions() {
    const { args, context } = this;
    const { stoAddress, symbol, amount, currency, minTokens = new BigNumber(0) } = args;
    let { beneficiary } = args;

    const { contractWrappers, factories } = context;

    /*
     * Validation
     */
    try {
      await contractWrappers.tokenFactory.getSecurityTokenInstanceFromTicker(symbol);
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

    const securityTokenId = SecurityToken.generateId({ symbol });
    const tieredStoId = TieredSto.generateId({
      securityTokenId,
      stoType: StoType.Tiered,
      address: stoAddress,
    });

    const stoModule = await contractWrappers.moduleFactory.getModuleInstance({
      name: ModuleName.UsdTieredSTO,
      address: stoAddress,
    });

    if (!stoModule) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `STO ${stoAddress} is either archived or hasn't been launched`,
      });
    }

    const [sto, currentAddress] = await Promise.all([
      factories.tieredStoFactory.fetch(tieredStoId),
      context.currentWallet.address(),
    ]);
    const {
      isFinalized,
      isPaused,
      startDate,
      beneficialInvestmentsAllowed,
      fundraiseCurrencies,
    } = sto;

    if (startDate > new Date()) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `Cannot invest in STO ${stoAddress} because it hasn't started yet`,
      });
    }

    if (isFinalized) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `STO ${stoAddress} has already been finalized`,
      });
    }

    if (isPaused) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `STO ${stoAddress} is paused`,
      });
    }

    if (beneficiary && beneficiary !== currentAddress && !beneficialInvestmentsAllowed) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `Cannot invest on behalf of ${beneficiary} because this STO doesn't allow beneficial investments`,
      });
    }

    beneficiary = beneficiary || currentAddress;

    const resolvers = [
      createRefreshTieredStoFactoryResolver(factories, tieredStoId),
      createRefreshSecurityTokenFactoryResolver(factories, securityTokenId),
    ];

    const unsupportedCurrencyError = new PolymathError({
      code: ErrorCode.ProcedureValidationError,
      message: `STO ${stoAddress} doesn't support investments in the selected currency`,
    });

    if (isInvestWithStableCoinArgs(args)) {
      const { stableCoinAddress } = args;

      if (!fundraiseCurrencies.includes(FundRaiseType.StableCoin)) {
        throw unsupportedCurrencyError;
      }

      await this.addProcedure(ApproveErc20)({
        tokenAddress: stableCoinAddress,
        amount,
        spender: stoAddress,
      });

      await this.addTransaction(stoModule.buyWithUSDRateLimited, {
        tag: PolyTransactionTag.BuyWithScRateLimited,
        resolvers,
      })({
        minTokens,
        beneficiary,
        usdToken: stableCoinAddress,
        investedSC: amount,
      });
    } else if (currency === Currency.POLY) {
      if (!fundraiseCurrencies.includes(FundRaiseType.POLY)) {
        throw unsupportedCurrencyError;
      }

      await this.addProcedure(ApproveErc20)({
        amount,
        spender: stoAddress,
      });

      await this.addTransaction(stoModule.buyWithPOLYRateLimited, {
        tag: PolyTransactionTag.BuyWithPolyRateLimited,
        resolvers,
      })({
        minTokens,
        beneficiary,
        investedPOLY: amount,
      });
    } else {
      if (!fundraiseCurrencies.includes(FundRaiseType.ETH)) {
        throw unsupportedCurrencyError;
      }

      await this.addTransaction(stoModule.buyWithETHRateLimited, {
        tag: PolyTransactionTag.BuyWithEthRateLimited,
        resolvers,
      })({
        minTokens,
        beneficiary,
        value: amount,
      });
    }
  }
}
