import {
  ModuleName,
  SecurityToken as SecurityTokenWrapper,
} from '@polymathnetwork/contract-wrappers';
import { TokenholderDataEntry, ErrorCode } from '../../types';
import { ModifyTokenholderData, CreateCheckpoint, RevokeKyc } from '../../procedures';
import { SubModule } from './SubModule';
import { Checkpoint } from '../Checkpoint';
import { PolymathError } from '../../PolymathError';
import { BaseCheckpoint } from '../../PolymathBase';
import { DividendDistribution } from '../DividendDistribution';
import { Tokenholder } from '../Tokenholder';

/**
 * Parameters for [[getCheckpoint]]
 */
export interface GetCheckpointParams {
  checkpointIndex: number;
}

/**
 * Namespace that handles all Tokenholder related functionality
 */
export class Tokenholders extends SubModule {
  /**
   * Add/modify investor data. For an investor to be able to hold, sell or purchase tokens, his address (and other KYC data)
   * must be added/modified via this method
   *
   * @param args.tokenholderData - array of tokenholder data to add/modify
   */
  public modifyData = async (args: { tokenholderData: TokenholderDataEntry[] }) => {
    const procedure = new ModifyTokenholderData(
      {
        symbol: this.securityToken.symbol,
        ...args,
      },
      this.context
    );
    return procedure.prepare();
  };

  /**
   * Revoke KYC for a group of tokenholder addresses. Supplied addresses must have valid KYC
   */
  public revokeKyc = async (args: { tokenholderAddresses: string[] }) => {
    const procedure = new RevokeKyc(
      {
        symbol: this.securityToken.symbol,
        ...args,
      },
      this.context
    );
    return procedure.prepare();
  };

  /**
   * Create a snapshot of the balances of every tokenholder at the current date
   */
  public createCheckpoint = async () => {
    const { context, securityToken } = this;
    const { symbol } = securityToken;
    const procedure = new CreateCheckpoint(
      {
        symbol,
      },
      context
    );
    return procedure.prepare();
  };

  /**
   * Retrieve list of checkpoints and their corresponding dividend distributions of every type
   */
  public getCheckpoints = async (): Promise<Checkpoint[]> => {
    const { contractWrappers, factories } = this.context;

    const { symbol, uid } = this.securityToken;

    let securityToken;

    try {
      securityToken = await contractWrappers.tokenFactory.getSecurityTokenInstanceFromTicker(
        symbol
      );
    } catch (err) {
      throw new PolymathError({
        code: ErrorCode.FetcherValidationError,
        message: `There is no Security Token with symbol ${symbol}`,
      });
    }

    const allDividends = await contractWrappers.getAllDividends({
      securityTokenSymbol: symbol,
    });

    const checkpoints: BaseCheckpoint[] = await contractWrappers.getCheckpoints({ securityToken });

    return checkpoints.map(({ index, ...checkpoint }) => {
      const checkpointId = Checkpoint.generateId({
        securityTokenId: uid,
        index,
      });

      const checkpointDividends = allDividends.filter(dividend => dividend.checkpointId === index);

      const dividendDistributions = checkpointDividends.map(distribution =>
        factories.dividendDistributionFactory.create(
          DividendDistribution.generateId({
            securityTokenId: uid,
            index,
          }),
          {
            ...distribution,
            checkpointId,
            securityTokenSymbol: symbol,
          }
        )
      );

      return factories.checkpointFactory.create(checkpointId, {
        ...checkpoint,
        dividendDistributions,
        securityTokenSymbol: symbol,
      });
    });
  };

  /**
   * Retrieve a checkpoint from the security token by index or UUID
   *
   * @param args - checkpoint uuid or object containing its index
   */
  public getCheckpoint = async (args: GetCheckpointParams | string) => {
    const { factories } = this.context;
    const { uid: securityTokenId } = this.securityToken;

    let uid: string;

    // fetch by UUID
    if (typeof args === 'string') {
      uid = args;
    } else {
      uid = Checkpoint.generateId({
        index: args.checkpointIndex,
        securityTokenId,
      });
    }

    return factories.checkpointFactory.fetch(uid);
  };

  /**
   * Get data for all tokenholders associated to the Security Token
   */
  public getTokenholders = async () => {
    const { contractWrappers, factories } = this.context;

    const { symbol: securityTokenSymbol, uid: securityTokenId } = this.securityToken;

    let securityToken: SecurityTokenWrapper;

    try {
      securityToken = await contractWrappers.tokenFactory.getSecurityTokenInstanceFromTicker(
        securityTokenSymbol
      );
    } catch (err) {
      throw new PolymathError({
        code: ErrorCode.FetcherValidationError,
        message: `There is no Security Token with symbol ${securityTokenSymbol}`,
      });
    }

    const generalTransferManager = (await contractWrappers.getAttachedModules(
      {
        moduleName: ModuleName.GeneralTransferManager,
        symbol: securityTokenSymbol,
      },
      { unarchived: true }
    ))[0];

    const [allKycData, allFlags] = await Promise.all([
      generalTransferManager.getAllKYCData(),
      generalTransferManager.getAllInvestorFlags(),
    ]);

    const tokenholders = [];

    const balances = await Promise.all(
      allKycData.map(({ investor }) => securityToken.balanceOf({ owner: investor }))
    );

    for (let i = 0; i < allKycData.length; ++i) {
      const { investor: address, canSendAfter, canReceiveAfter, expiryTime } = allKycData[i];
      const { isAccredited, canNotBuyFromSTO } = allFlags[i];
      const balance = balances[i];

      const tokenholder = factories.tokenholderFactory.create(
        Tokenholder.generateId({ securityTokenId, address }),
        {
          balance,
          canSendAfter,
          canReceiveAfter,
          kycExpiry: expiryTime,
          isAccredited,
          canBuyFromSto: !canNotBuyFromSTO,
          securityTokenSymbol,
        }
      );

      if (!tokenholder.isRevoked() || tokenholder.balance.isGreaterThan(0)) {
        tokenholders.push(tokenholder);
      }
    }

    return tokenholders;
  };

  /**
   * Retrieve the amount of wallets that ever held tokens or have any KYC data
   */
  public allTimeInvestorCount = async (): Promise<number> => {
    const {
      context: { contractWrappers },
      securityToken: { symbol },
    } = this;

    let securityTokenInstance;

    try {
      // prettier-ignore
      securityTokenInstance =
        await contractWrappers.tokenFactory.getSecurityTokenInstanceFromTicker(
          symbol
        );
    } catch (err) {
      throw new PolymathError({
        code: ErrorCode.FetcherValidationError,
        message: `There is no Security Token with symbol ${symbol}`,
      });
    }
    return securityTokenInstance.getInvestorCount();
  };

  /**
   * Retrieve the amount of wallets that currently hold tokens
   */
  public holderCount = async (): Promise<number> => {
    const {
      context: { contractWrappers },
      securityToken: { symbol },
    } = this;

    let securityTokenInstance;

    try {
      // prettier-ignore
      securityTokenInstance =
        await contractWrappers.tokenFactory.getSecurityTokenInstanceFromTicker(
          symbol
        );
    } catch (err) {
      throw new PolymathError({
        code: ErrorCode.FetcherValidationError,
        message: `There is no Security Token with symbol ${symbol}`,
      });
    }
    return securityTokenInstance.holderCount();
  };
}
