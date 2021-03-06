import { BigNumber } from '@polymathnetwork/contract-wrappers';
import { Entity } from './Entity';
import { unserialize } from '../utils';
import { StoType, isStoType, Currency, ErrorCode, StoRole } from '../types';
import { PolymathError } from '../PolymathError';
import { Context } from '../Context';
import {
  TogglePauseSto,
  AssignStoRole,
  FinalizeSto,
  ToggleAllowBeneficialInvestments,
  ToggleAllowPreIssuing,
} from '../procedures';

/**
 * Properties that uniquely identify an STO
 */
export interface UniqueIdentifiers {
  securityTokenId: string;
  stoType: StoType;
  address: string;
}

/**
 * Check if the provided value is of type [[UniqueIdentifiers]]
 */
function isUniqueIdentifiers(identifiers: any): identifiers is UniqueIdentifiers {
  const { securityTokenId, stoType, address } = identifiers;

  return typeof securityTokenId === 'string' && typeof address === 'string' && isStoType(stoType);
}

/**
 * STO constructor parameters
 */
export interface Params {
  /**
   * symbol of security token
   */
  securityTokenSymbol: string;
  /**
   * start date of the sto
   */
  startDate: Date;
  /**
   * expiry date of the sto
   */
  endDate: Date;
  /**
   * currencies that can be used to fundraise in this sto
   */
  fundraiseCurrencies: Currency[];
  /**
   * wallet address where raised funds will be stored
   */
  raisedFundsWallet: string;
  /**
   * wallet address where unsold tokens will be returned to
   */
  unsoldTokensWallet: string;
  /**
   * funds that have been raised to this date
   */
  raisedAmount: BigNumber;
  /**
   * amount of tokens that have been sold
   */
  soldTokensAmount: BigNumber;
  /**
   * number of investors in the sto
   */
  investorCount: number;
  /**
   * whether or not the sto is currently paused
   */
  isPaused: boolean;
  /**
   * whether or not the cap has been reached for the sto
   */
  capReached: boolean;
  /**
   * whether or not the sto has been finalized
   */
  isFinalized: boolean;
  /**
   * whether or not pre issuance is allowed for the sto
   */
  preIssueAllowed: boolean;
  /**
   * whether or not investments can be made on behalf of a beneficiary in the sto
   */
  beneficialInvestmentsAllowed: boolean;
}

/**
 * Abstract class used as a base to manage sto functionalities
 */
export abstract class Sto<P> extends Entity<P> {
  /**
   * Uniquely generated id for the STO
   */
  public abstract uid: string;

  /**
   * ethereum address for the STO
   */
  public address: string;

  public securityTokenSymbol: string;

  public securityTokenId: string;

  /**
   * type of STO setup
   */
  public stoType: StoType;

  public startDate: Date;

  public endDate: Date;

  /**
   * wallet where raised funds will be forwarded to
   */
  public raisedFundsWallet: string;

  /**
   * wallet where unsold tokens will be returned to
   */
  public unsoldTokensWallet: string;

  /**
   * amount of funds that have been raised so far
   */
  public raisedAmount: BigNumber;

  /**
   * total number of tokens that have been sold so far
   */
  public soldTokensAmount: BigNumber;

  /**
   * number of investors that have purchased tokens in the STO
   */
  public investorCount: number;

  /**
   * types of currency in which funds can be raised
   */
  public fundraiseCurrencies: Currency[];

  /**
   * whether the STO is currently paused or not
   */
  public isPaused: boolean;

  /**
   * whether the STO cap has been reached or not
   */
  public capReached: boolean;

  /**
   * whether the STO has been finalized or not
   */
  public isFinalized: boolean;

  /**
   * whether all tokens due to be sold are issued when the STO starts. If false, the appropriate amount of tokens is issued to the buyer whenever a sale is made
   */
  public preIssueAllowed: boolean;

  /**
   * whether investments can be made on behalf of a beneficiary or not
   */
  public beneficialInvestmentsAllowed: boolean;

  protected context: Context;

  /**
   * Unserialize string to a Security Token Offering object representation
   *
   * @param serialize - security token's serialized representation
   */
  public static unserialize(serialized: string) {
    const unserialized = unserialize(serialized);

    if (!isUniqueIdentifiers(unserialized)) {
      throw new PolymathError({
        code: ErrorCode.InvalidUuid,
        message: 'Wrong STO ID format',
      });
    }

    return unserialized;
  }

  /**
   * Create a new sto instance
   */
  constructor(params: Params & UniqueIdentifiers, context: Context) {
    super();

    const {
      address,
      securityTokenSymbol,
      securityTokenId,
      stoType,
      fundraiseCurrencies,
      startDate,
      endDate,
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount,
      soldTokensAmount,
      investorCount,
      isPaused,
      capReached,
      isFinalized,
      preIssueAllowed,
      beneficialInvestmentsAllowed,
    } = params;

    this.address = address;
    this.securityTokenSymbol = securityTokenSymbol;
    this.securityTokenId = securityTokenId;
    this.stoType = stoType;
    this.startDate = startDate;
    this.endDate = endDate;
    this.raisedFundsWallet = raisedFundsWallet;
    this.unsoldTokensWallet = unsoldTokensWallet;
    this.raisedAmount = raisedAmount;
    this.soldTokensAmount = soldTokensAmount;
    this.investorCount = investorCount;
    this.fundraiseCurrencies = fundraiseCurrencies;
    this.isPaused = isPaused;
    this.capReached = capReached;
    this.isFinalized = isFinalized;
    this.preIssueAllowed = preIssueAllowed;
    this.beneficialInvestmentsAllowed = beneficialInvestmentsAllowed;
    this.context = context;
  }

  /**
   * Pause the offering
   */
  public pause = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new TogglePauseSto(
      { stoAddress, stoType, symbol, pause: true },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Unpause the offering
   */
  public unpause = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new TogglePauseSto(
      { stoAddress, stoType, symbol, pause: false },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Finalize the offering. The offering's treasury wallet (or the Security Token's treasury wallet if one was not specified for the offering)
   * will receive the remaining unsold tokens. Throws an error if there are transfer restrictions which do not permit the wallet to receive that amount of tokens
   */
  public finalize = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new FinalizeSto({ stoAddress, stoType, symbol }, this.context);

    return procedure.prepare();
  };

  /**
   * Enable all offered tokens to be issued instantly at STO start (default behavior is to issue on purchase)
   * Can be disabled *BEFORE* the STO starts by calling disallowPreIssuing
   */
  public allowPreIssuing = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new ToggleAllowPreIssuing(
      { stoAddress, stoType, symbol, allowPreIssuing: true },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Disable pre-issuing of offered tokens at STO start (goes back to default behavior, which is to issue on purchase)
   * Can be re-enabled *BEFORE* the STO starts by calling allowPreIssuing
   */
  public disallowPreIssuing = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new ToggleAllowPreIssuing(
      { stoAddress, stoType, symbol, allowPreIssuing: false },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Enable a party to invest in the STO on behalf of another party
   */
  public allowBeneficialInvestments = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new ToggleAllowBeneficialInvestments(
      { stoAddress, stoType, symbol, allowBeneficialInvestments: true },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Disable the possibility for a party to invest in the STO on behalf of another party
   */
  public disallowBeneficialInvestments = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new ToggleAllowBeneficialInvestments(
      { stoAddress, stoType, symbol, allowBeneficialInvestments: false },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Assign a role on the STO to a delegate
   *
   * @param args.delegateAddress - wallet address of the delegate
   * @param args.role - role to assign
   * @param args.description - description of the delegate (defaults to empty string, is ignored if the delegate already exists)
   */
  public assignRole = async (args: {
    delegateAddress: string;
    role: StoRole;
    description?: string;
  }) => {
    const { securityTokenSymbol: symbol, address } = this;

    const procedure = new AssignStoRole(
      {
        symbol,
        assign: true,
        stoAddress: address,
        ...args,
      },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Remove a role from a delegate
   *
   * @param args.delegateAddress - wallet address of the delegate
   * @param args.role - role to revoke
   */
  public revokeRole = async (args: { delegateAddress: string; role: StoRole }) => {
    const { securityTokenSymbol: symbol, address } = this;

    const procedure = new AssignStoRole(
      {
        symbol,
        assign: false,
        stoAddress: address,
        ...args,
      },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Convert entity to a POJO (Plain Old Javascript Object)
   */
  public toPojo() {
    const {
      uid,
      securityTokenId,
      address,
      securityTokenSymbol,
      fundraiseCurrencies,
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount,
      soldTokensAmount,
      investorCount,
      startDate,
      endDate,
      capReached,
      isFinalized,
      isPaused,
      preIssueAllowed,
      beneficialInvestmentsAllowed,
    } = this;

    return {
      uid,
      securityTokenId,
      address,
      securityTokenSymbol,
      fundraiseCurrencies,
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount,
      soldTokensAmount,
      investorCount,
      startDate,
      endDate,
      capReached,
      isFinalized,
      isPaused,
      preIssueAllowed,
      beneficialInvestmentsAllowed,
    };
  }

  /**
   * Hydrate the entity
   */
  public _refresh(params: Partial<Params>) {
    const {
      securityTokenSymbol,
      startDate,
      endDate,
      fundraiseCurrencies,
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount,
      soldTokensAmount,
      investorCount,
      isPaused,
      capReached,
      isFinalized,
      preIssueAllowed,
      beneficialInvestmentsAllowed,
    } = params;

    if (securityTokenSymbol) {
      this.securityTokenSymbol = securityTokenSymbol;
    }

    if (startDate) {
      this.startDate = startDate;
    }

    if (endDate) {
      this.endDate = endDate;
    }

    if (fundraiseCurrencies) {
      this.fundraiseCurrencies = fundraiseCurrencies;
    }

    if (raisedFundsWallet) {
      this.raisedFundsWallet = raisedFundsWallet;
    }

    if (unsoldTokensWallet) {
      this.unsoldTokensWallet = unsoldTokensWallet;
    }

    if (raisedAmount) {
      this.raisedAmount = raisedAmount;
    }

    if (soldTokensAmount) {
      this.soldTokensAmount = soldTokensAmount;
    }

    if (investorCount) {
      this.investorCount = investorCount;
    }

    if (isPaused !== undefined) {
      this.isPaused = isPaused;
    }

    if (capReached !== undefined) {
      this.capReached = capReached;
    }

    if (isFinalized !== undefined) {
      this.isFinalized = isFinalized;
    }

    if (preIssueAllowed !== undefined) {
      this.preIssueAllowed = preIssueAllowed;
    }

    if (beneficialInvestmentsAllowed !== undefined) {
      this.beneficialInvestmentsAllowed = beneficialInvestmentsAllowed;
    }
  }
}
