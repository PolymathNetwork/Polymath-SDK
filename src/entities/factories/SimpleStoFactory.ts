import { ModuleName, isCappedSTO_3_1_0 } from '@polymathnetwork/contract-wrappers';
import { Factory } from './Factory';
import { Context } from '../../Context';
import { Currency } from '../../types';
import { SimpleSto, Params, UniqueIdentifiers } from '../SimpleSto';
import { SecurityToken } from '../SecurityToken';

export class SimpleStoFactory extends Factory<SimpleSto, Params, UniqueIdentifiers> {
  protected generateProperties = async (uid: string) => {
    const { securityTokenId, stoType, address } = SimpleSto.unserialize(uid);

    const { symbol } = SecurityToken.unserialize(securityTokenId);
    const {
      context: { contractWrappers },
    } = this;

    const module = await contractWrappers.moduleFactory.getModuleInstance({
      name: ModuleName.CappedSTO,
      address,
    });

    const [
      isPaused,
      capReached,
      beneficialInvestmentsAllowed,
      raisedFundsWallet,
      unsoldTokensWallet,
      {
        fundsRaised,
        investorCount,
        totalTokensSold,
        isRaisedInPoly,
        startTime,
        endTime,
        ...details
      },
    ] = await Promise.all([
      module.paused(),
      module.capReached(),
      module.allowBeneficialInvestments(),
      module.wallet(),
      contractWrappers.getTreasuryWallet({ module }),
      module.getSTODetails(),
    ]);

    let preMintAllowed = false;
    let isFinalized = capReached || endTime <= new Date();

    if (isCappedSTO_3_1_0(module)) {
      [preMintAllowed, isFinalized] = await Promise.all([
        module.preMintAllowed(),
        module.isFinalized(),
      ]);
    }

    return {
      currencies: isRaisedInPoly ? [Currency.POLY] : [Currency.ETH],
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount: fundsRaised,
      soldTokensAmount: totalTokensSold,
      investorCount,
      startDate: startTime,
      endDate: endTime,
      ...details,
      securityTokenId,
      securityTokenSymbol: symbol,
      stoType,
      address,
      isPaused,
      capReached,
      isFinalized,
      preMintAllowed,
      beneficialInvestmentsAllowed,
    };
  };

  constructor(context: Context) {
    super(SimpleSto, context);
  }
}