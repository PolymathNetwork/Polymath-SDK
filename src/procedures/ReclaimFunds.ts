import { ModuleName, TransactionParams } from '@polymathnetwork/contract-wrappers';
import { Procedure } from './Procedure';
import { ReclaimFundsProcedureArgs, ProcedureType, PolyTransactionTag, ErrorCode } from '../types';
import { PolymathError } from '../PolymathError';
import { DividendDistribution, SecurityToken } from '../entities';
import { Factories } from '~/Context';

/**
 * @hidden
 */
export const createReclaimFundsResolver = (
  dividendIndex: number,
  factories: Factories,
  symbol: string
) => async () => {
  return factories.dividendDistributionFactory.refresh(
    DividendDistribution.generateId({
      securityTokenId: SecurityToken.generateId({ symbol }),
      index: dividendIndex,
    })
  );
};

/**
 * Procedure that allows the issuer reclaim remaining unclaimed dividend amounts, for expired dividends
 */
export class ReclaimFunds extends Procedure<ReclaimFundsProcedureArgs> {
  public type = ProcedureType.ReclaimFunds;

  /**
   * - Reclaim desired dividend
   *
   * Note that this procedure will fail if the security token symbol doesn't exist
   * Note that this procedure will fail if the dividend feature hasn't been enabled
   */
  public async prepareTransactions() {
    const { symbol, dividendIndex } = this.args;
    const { contractWrappers, factories } = this.context;

    try {
      await contractWrappers.tokenFactory.getSecurityTokenInstanceFromTicker(symbol);
    } catch (err) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `There is no Security Token with symbol ${symbol}`,
      });
    }

    const [dividendModule] = await contractWrappers.getAttachedModules(
      { symbol, moduleName: ModuleName.ERC20DividendCheckpoint },
      { unarchived: true }
    );

    if (!dividendModule) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: "The Dividends Feature hasn't been enabled",
      });
    }

    await this.addTransaction<TransactionParams.DividendCheckpoint.ReclaimDividend>(
      dividendModule.reclaimDividend,
      {
        tag: PolyTransactionTag.ReclaimDividendFunds,
        resolvers: [createReclaimFundsResolver(dividendIndex, factories, symbol)],
      }
    )({ dividendIndex });
  }
}
