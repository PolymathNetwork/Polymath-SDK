import {
  ModuleName,
  BlockParamLiteral,
  conversionUtils,
  FULL_DECIMALS,
  CappedSTOEvents_3_0_0,
  USDTieredSTOEvents_3_0_0,
} from '@polymathnetwork/contract-wrappers';
import { Factory } from './Factory';
import { Context } from '../../Context';
import { StoType, ErrorCode } from '../../types';
import { Investment, Params, UniqueIdentifiers } from '../Investment';
import { Sto } from '../Sto';
import { SecurityToken } from '../SecurityToken';
import { PolymathError } from '../../PolymathError';

const { weiToValue } = conversionUtils;

export class InvestmentFactory extends Factory<Investment, Params, UniqueIdentifiers> {
  protected generateProperties = async (uid: string) => {
    const { stoId, securityTokenId, index } = Investment.unserialize(uid);

    const { stoType, address } = Sto.unserialize(stoId);
    const { symbol } = SecurityToken.unserialize(securityTokenId);

    if (stoType === StoType.Capped) {
      const module = await this.context.contractWrappers.moduleFactory.getModuleInstance({
        name: ModuleName.CappedSTO,
        address,
      });

      const tokenPurchases = await module.getLogsAsync({
        eventName: CappedSTOEvents_3_0_0.TokenPurchase,
        blockRange: {
          fromBlock: BlockParamLiteral.Earliest,
          toBlock: BlockParamLiteral.Latest,
        },
        indexFilterValues: {},
      });

      const thisPurchase = tokenPurchases.find((_, eventIndex) => eventIndex === index);

      if (!thisPurchase) {
        throw new PolymathError({
          code: ErrorCode.FetcherValidationError,
          message: `Investment ${uid} not found`,
        });
      }

      const {
        args: { beneficiary, amount, value },
      } = thisPurchase;

      return {
        address: beneficiary,
        tokenAmount: weiToValue(amount, FULL_DECIMALS),
        investedFunds: weiToValue(value, FULL_DECIMALS),
        securityTokenSymbol: symbol,
      };
    } else if (stoType === StoType.UsdTiered) {
      const module = await this.context.contractWrappers.moduleFactory.getModuleInstance({
        name: ModuleName.UsdTieredSTO,
        address,
      });

      const tokenPurchases = await module.getLogsAsync({
        eventName: USDTieredSTOEvents_3_0_0.TokenPurchase,
        blockRange: {
          fromBlock: BlockParamLiteral.Earliest,
          toBlock: BlockParamLiteral.Latest,
        },
        indexFilterValues: {},
      });

      const thisPurchase = tokenPurchases.find((_, eventIndex) => eventIndex === index);

      if (!thisPurchase) {
        throw new PolymathError({
          code: ErrorCode.FetcherValidationError,
          message: `Investment ${uid} not found`,
        });
      }

      const {
        args: { _beneficiary, _usdAmount, _tokens },
      } = thisPurchase;

      return {
        address: _beneficiary,
        tokenAmount: weiToValue(_usdAmount, FULL_DECIMALS),
        investedFunds: weiToValue(_tokens, FULL_DECIMALS),
        securityTokenSymbol: symbol,
      };
    } else {
      throw new PolymathError({
        code: ErrorCode.FetcherValidationError,
        message: `Invalid STO type ${stoType}`,
      });
    }
  };

  constructor(context: Context) {
    super(Investment, context);
  }
}
