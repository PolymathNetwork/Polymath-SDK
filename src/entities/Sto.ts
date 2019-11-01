import { BigNumber } from '@polymathnetwork/contract-wrappers';
import { Entity } from './Entity';
import { unserialize } from '../utils';
import { StoType, isStoType, Currency, ErrorCode, StoRole } from '../types';
import { Investment } from './Investment';
import { PolymathError } from '../PolymathError';
import { Context } from '../Context';
import { PauseSto, AssignStoRole } from '../procedures';
import { ModifyPreMinting } from '../procedures/ModifyPreMinting';

export interface UniqueIdentifiers {
  securityTokenId: string;
  stoType: StoType;
  address: string;
}

function isUniqueIdentifiers(identifiers: any): identifiers is UniqueIdentifiers {
  const { securityTokenId, stoType, address } = identifiers;

  return typeof securityTokenId === 'string' && typeof address === 'string' && isStoType(stoType);
}

export interface Params {
  securityTokenSymbol: string;
  startTime: Date;
  endTime: Date;
  fundraiseTypes: Currency[];
  raisedFundsWallet: string;
  unsoldTokensWallet: string;
  raisedAmount: BigNumber;
  soldTokensAmount: BigNumber;
  investorAmount: number;
  investments: Investment[];
  paused: boolean;
  capReached: boolean;
  isFinalized: boolean;
  preMintAllowed: boolean;
  beneficialInvestmentsAllowed: boolean;
}

export abstract class Sto<P> extends Entity<P> {
  public abstract uid: string;

  public address: string;

  public securityTokenSymbol: string;

  public securityTokenId: string;

  public stoType: StoType;

  public startTime: Date;

  public endTime: Date;

  public raisedFundsWallet: string;

  public unsoldTokensWallet: string;

  public raisedAmount: BigNumber;

  public soldTokensAmount: BigNumber;

  public investorAmount: number;

  public investments: Investment[];

  public fundraiseTypes: Currency[];

  public paused: boolean;

  public capReached: boolean;

  public isFinalized: boolean;

  public preMintAllowed: boolean;

  public beneficialInvestmentsAllowed: boolean;

  protected context: Context;

  public static unserialize(serialized: string) {
    const unserialized = unserialize(serialized);

    if (!isUniqueIdentifiers(unserialized)) {
      throw new PolymathError({
        code: ErrorCode.InvalidUuid,
        message: 'Wrong STO ID format.',
      });
    }

    return unserialized;
  }

  constructor(params: Params & UniqueIdentifiers, context: Context) {
    super();

    const {
      address,
      securityTokenSymbol,
      securityTokenId,
      stoType,
      fundraiseTypes,
      startTime,
      endTime,
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount,
      soldTokensAmount,
      investorAmount,
      investments,
      paused,
      capReached,
      isFinalized,
      preMintAllowed,
      beneficialInvestmentsAllowed,
    } = params;

    this.address = address;
    this.securityTokenSymbol = securityTokenSymbol;
    this.securityTokenId = securityTokenId;
    this.stoType = stoType;
    this.startTime = startTime;
    this.endTime = endTime;
    this.raisedFundsWallet = raisedFundsWallet;
    this.unsoldTokensWallet = unsoldTokensWallet;
    this.raisedAmount = raisedAmount;
    this.soldTokensAmount = soldTokensAmount;
    this.investorAmount = investorAmount;
    this.investments = investments;
    this.fundraiseTypes = fundraiseTypes;
    this.paused = paused;
    this.capReached = capReached;
    this.isFinalized = isFinalized;
    this.preMintAllowed = preMintAllowed;
    this.beneficialInvestmentsAllowed = beneficialInvestmentsAllowed;
    this.context = context;
  }

  /**
   * Pause the offering
   */
  public pause = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new PauseSto({ stoAddress, stoType, symbol }, this.context);

    return procedure.prepare();
  };

  /**
   * Enables all offered tokens to be minted instantly at STO start (default behavior is to mint on purchase)
   * Can be disabled *BEFORE* the STO starts by calling disallowPreMinting
   */
  public allowPreMinting = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new ModifyPreMinting(
      { stoAddress, stoType, symbol, allowPreMinting: true },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Disables pre-minting of offered tokens at STO start (goes back to default behavior, which is to mint on purchase)
   * Can be re-enabled *BEFORE* the STO starts by calling allowPreMinting
   */
  public disallowPreMinting = async () => {
    const { address: stoAddress, stoType, securityTokenSymbol: symbol } = this;

    const procedure = new ModifyPreMinting(
      { stoAddress, stoType, symbol, allowPreMinting: false },
      this.context
    );

    return procedure.prepare();
  };

  /**
   * Assigns a role on the STO to a delegate
   *
   * @param delegateAddress wallet address of the delegate
   * @param role role to assign
   * @param description description of the delegate (defaults to empty string, is ignored if the delegate already exists)
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
   * Removes a role from a delegate
   *
   * @param delegateAddress wallet address of the delegate
   * @param role role to revoke
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

  public toPojo() {
    const {
      uid,
      securityTokenId,
      address,
      securityTokenSymbol,
      fundraiseTypes,
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount,
      soldTokensAmount,
      investorAmount,
      investments,
      startTime,
      endTime,
      capReached,
      isFinalized,
      paused,
      preMintAllowed,
      beneficialInvestmentsAllowed,
    } = this;

    return {
      uid,
      securityTokenId,
      address,
      securityTokenSymbol,
      fundraiseTypes,
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount,
      soldTokensAmount,
      investorAmount,
      startTime,
      endTime,
      capReached,
      isFinalized,
      paused,
      preMintAllowed,
      beneficialInvestmentsAllowed,
      investments: investments.map(investment => investment.toPojo()),
    };
  }

  public _refresh(params: Partial<Params>) {
    const {
      securityTokenSymbol,
      startTime,
      endTime,
      fundraiseTypes,
      raisedFundsWallet,
      unsoldTokensWallet,
      raisedAmount,
      soldTokensAmount,
      investorAmount,
      investments,
      paused,
      capReached,
      isFinalized,
      preMintAllowed,
      beneficialInvestmentsAllowed,
    } = params;

    if (securityTokenSymbol) {
      this.securityTokenSymbol = securityTokenSymbol;
    }

    if (startTime) {
      this.startTime = startTime;
    }

    if (endTime) {
      this.endTime = endTime;
    }

    if (fundraiseTypes) {
      this.fundraiseTypes = fundraiseTypes;
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

    if (investorAmount) {
      this.investorAmount = investorAmount;
    }

    if (investments) {
      this.investments = investments;
    }

    if (paused !== undefined) {
      this.paused = paused;
    }

    if (capReached !== undefined) {
      this.capReached = capReached;
    }

    if (isFinalized !== undefined) {
      this.isFinalized = isFinalized;
    }

    if (preMintAllowed !== undefined) {
      this.preMintAllowed = preMintAllowed;
    }

    if (beneficialInvestmentsAllowed !== undefined) {
      this.beneficialInvestmentsAllowed = beneficialInvestmentsAllowed;
    }
  }
}
