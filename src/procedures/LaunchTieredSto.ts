import {
  ModuleName,
  BigNumber,
  SecurityTokenEvents,
  isUSDTieredSTO_3_0_0,
  TransactionParams,
  FundRaiseType,
} from '@polymathnetwork/contract-wrappers';
import { Procedure } from './Procedure';
import {
  ProcedureType,
  PolyTransactionTag,
  ErrorCode,
  LaunchTieredStoProcedureArgs,
  StoType,
} from '../types';
import { PolymathError } from '../PolymathError';
import { TransferErc20 } from './TransferErc20';
import { findEvents, isValidAddress } from '../utils';
import { SecurityToken, TieredSto } from '../entities';
import { ZERO_ADDRESS } from '../utils/constants';

/**
 * Procedure that launches a Tiered STO
 */
export class LaunchTieredSto extends Procedure<LaunchTieredStoProcedureArgs, TieredSto> {
  public type = ProcedureType.LaunchTieredSto;

  /**
   * - Transfer the necessary amount of POLY to the Security Token to cover the STO's setup fee
   * - Launch the Tiered STO
   * - Allow pre-issuing (if applicable, defaults to false)
   * - Return the newly created STO
   *
   * Note that this procedure will fail if:
   * - The supplied custom currency oracle addresses corresponding to the selected fund raise currencies are invalid
   * - Raising in Stable Coin and not providing stable coin addresses
   * - Attempting to allow pre-issuing on a version 3.0 STO
   */
  public async prepareTransactions() {
    const { args, context } = this;
    const {
      symbol,
      startDate,
      endDate,
      tiers,
      nonAccreditedInvestmentLimit,
      minimumInvestment,
      currencies,
      raisedFundsWallet,
      unsoldTokensWallet,
      stableCoinAddresses = [],
      customCurrency,
      allowPreIssuing = false,
    } = args;
    const {
      contractWrappers,
      factories: { tieredStoFactory },
    } = context;

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

    if (currencies.includes(FundRaiseType.StableCoin) && stableCoinAddresses.length === 0) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: 'Stable Coin address array cannot be empty if raising in Stable Coin',
      });
    }

    const customOracleAddresses: string[] = [];
    let denominatedCurrency = '';

    if (customCurrency) {
      const {
        currencySymbol = 'USD',
        ethOracleAddress = '',
        polyOracleAddress = '',
      } = customCurrency;

      if (currencies.includes(FundRaiseType.ETH)) {
        if (!isValidAddress(ethOracleAddress)) {
          throw new PolymathError({
            code: ErrorCode.ProcedureValidationError,
            message: `Must provide ETH oracle for '${currencySymbol}'`,
          });
        } else {
          customOracleAddresses.push(ethOracleAddress);
        }
      } else {
        customOracleAddresses.push(ZERO_ADDRESS);
      }

      if (currencies.includes(FundRaiseType.POLY)) {
        if (!isValidAddress(polyOracleAddress)) {
          throw new PolymathError({
            code: ErrorCode.ProcedureValidationError,
            message: `Must provide POLY oracle for '${currencySymbol}'`,
          });
        } else {
          customOracleAddresses.push(polyOracleAddress);
        }
      } else {
        customOracleAddresses.push(ZERO_ADDRESS);
      }

      denominatedCurrency = currencySymbol;
    }

    const securityTokenAddress = await securityToken.address();
    const moduleName = ModuleName.UsdTieredSTO;

    const factoryAddress = await contractWrappers.getModuleFactoryAddress({
      tokenAddress: securityTokenAddress,
      moduleName,
    });

    const moduleFactory = await contractWrappers.moduleFactory.getModuleFactory(factoryAddress);
    let usdCost: BigNumber | null = null;
    const [polyCost, isCostInPoly, cost] = await Promise.all([
      moduleFactory.setupCostInPoly(),
      moduleFactory.isCostInPoly(),
      moduleFactory.setupCost(),
    ]);

    if (!isCostInPoly) {
      usdCost = cost;
    }

    const balance = await contractWrappers.polyToken.balanceOf({ owner: securityTokenAddress });
    const difference = polyCost.minus(balance);

    // only transfer the required amount of POLY
    if (difference.gt(new BigNumber(0))) {
      await this.addProcedure(TransferErc20)({
        receiver: securityTokenAddress,
        amount: difference,
      });
    }

    const ratePerTier: BigNumber[] = [];
    const ratePerTierDiscountPoly: BigNumber[] = [];
    const tokensPerTierTotal: BigNumber[] = [];
    const tokensPerTierDiscountPoly: BigNumber[] = [];

    tiers.forEach(
      ({
        tokensOnSale,
        price,
        tokensWithDiscount = new BigNumber(0),
        discountedPrice = new BigNumber(0),
      }) => {
        ratePerTier.push(price);
        ratePerTierDiscountPoly.push(discountedPrice);
        tokensPerTierTotal.push(tokensOnSale);
        tokensPerTierDiscountPoly.push(tokensWithDiscount);
      }
    );

    const [newStoAddress, newSto] = await this.addTransaction<
      TransactionParams.SecurityToken.AddUSDTieredSTO,
      [string, TieredSto]
    >(securityToken.addModuleWithLabel, {
      tag: PolyTransactionTag.EnableTieredSto,
      fees: {
        usd: usdCost,
        poly: polyCost,
      },
      resolvers: [
        async receipt => {
          const { logs } = receipt;

          const [event] = findEvents({
            eventName: SecurityTokenEvents.ModuleAdded,
            logs,
          });

          if (event) {
            const { args: eventArgs } = event;

            const { _module } = eventArgs;

            return _module;
          }
          throw new PolymathError({
            code: ErrorCode.UnexpectedEventLogs,
            message:
              "The Tiered STO was successfully launched but the corresponding event wasn't fired. Please report this issue to the Polymath team.",
          });
        },
        async receipt => {
          const { logs } = receipt;

          const [event] = findEvents({
            eventName: SecurityTokenEvents.ModuleAdded,
            logs,
          });

          if (event) {
            const { args: eventArgs } = event;

            const { _module } = eventArgs;

            return tieredStoFactory.fetch(
              TieredSto.generateId({
                securityTokenId: SecurityToken.generateId({ symbol }),
                stoType: StoType.Tiered,
                address: _module,
              })
            );
          }
          throw new PolymathError({
            code: ErrorCode.UnexpectedEventLogs,
            message:
              "The Tiered STO was successfully launched but the corresponding event wasn't fired. Please report this issue to the Polymath team.",
          });
        },
      ],
    })({
      moduleName,
      address: factoryAddress,
      data: {
        startTime: startDate,
        endTime: endDate,
        ratePerTier,
        ratePerTierDiscountPoly,
        tokensPerTierTotal,
        tokensPerTierDiscountPoly,
        nonAccreditedLimitUSD: nonAccreditedInvestmentLimit,
        minimumInvestmentUSD: minimumInvestment,
        fundRaiseTypes: currencies,
        wallet: raisedFundsWallet,
        treasuryWallet: unsoldTokensWallet,
        stableTokens: stableCoinAddresses,
        customOracleAddresses,
        denominatedCurrency,
      },
      maxCost: polyCost,
      archived: false,
    });

    if (allowPreIssuing) {
      await this.addTransaction(
        {
          futureValue: newStoAddress,
          futureMethod: async address => {
            const stoModule = await contractWrappers.moduleFactory.getModuleInstance({
              name: ModuleName.UsdTieredSTO,
              address,
            });

            if (isUSDTieredSTO_3_0_0(stoModule)) {
              throw new PolymathError({
                code: ErrorCode.IncorrectVersion,
                message:
                  'STO version is 3.0.0. Version 3.1.0 or greater is required for pre-issuing',
              });
            }

            return stoModule.allowPreMinting;
          },
        },
        {
          tag: PolyTransactionTag.AllowPreMinting,
          resolvers: [
            () => {
              return tieredStoFactory.update(
                TieredSto.generateId({
                  securityTokenId: SecurityToken.generateId({ symbol }),
                  stoType: StoType.Tiered,
                  address: newStoAddress.result!,
                }),
                { preIssueAllowed: true }
              );
            },
          ],
        }
      )({});
    }

    return newSto;
  }
}
