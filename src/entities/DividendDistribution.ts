import { BigNumber } from '@polymathnetwork/contract-wrappers';
import { Entity } from './Entity';
import { serialize, unserialize } from '../utils';
import { DividendType, DividendShareholderStatus, isDividendType, ErrorCode } from '../types';
import { PushDividendPayment, WithdrawTaxes } from '../procedures';
import { Context } from '../Context';
import { PolymathError } from '../PolymathError';

export interface UniqueIdentifiers {
  securityTokenId: string;
  dividendType: DividendType;
  index: number;
}

function isUniqueIdentifiers(identifiers: any): identifiers is UniqueIdentifiers {
  const { securityTokenId, checkpointId, dividendType, index } = identifiers;

  return (
    typeof securityTokenId === 'string' &&
    typeof checkpointId === 'string' &&
    typeof index === 'number' &&
    isDividendType(dividendType)
  );
}

export interface Params {
  securityTokenSymbol: string;
  checkpointId: string;
  created: Date;
  maturity: Date;
  expiry: Date;
  amount: BigNumber;
  claimedAmount: BigNumber;
  totalSupply: BigNumber;
  reclaimed: boolean;
  totalWithheld: BigNumber;
  totalWithheldWithdrawn: BigNumber;
  shareholders: DividendShareholderStatus[];
  name: string;
  currency: string | null;
}

export class DividendDistribution extends Entity<Params> {
  public static generateId({ securityTokenId, dividendType, index }: UniqueIdentifiers) {
    return serialize('dividend', {
      securityTokenId,
      dividendType,
      index,
    });
  }

  public static unserialize(serialized: string) {
    const unserialized = unserialize(serialized);

    if (!isUniqueIdentifiers(unserialized)) {
      throw new PolymathError({
        code: ErrorCode.InvalidUuid,
        message: 'Wrong Dividend Distribution ID format.',
      });
    }

    return unserialized;
  }

  public uid: string;

  public index: number;

  public checkpointId: string;

  public dividendType: DividendType;

  public securityTokenSymbol: string;

  public securityTokenId: string;

  public created: Date;

  public maturity: Date;

  public expiry: Date;

  public amount: BigNumber;

  public claimedAmount: BigNumber;

  public totalSupply: BigNumber;

  public reclaimed: boolean;

  public totalWithheld: BigNumber;

  public totalWithheldWithdrawn: BigNumber;

  public shareholders: DividendShareholderStatus[];

  public name: string;

  public currency: string | null;

  protected context: Context;

  constructor(params: Params & UniqueIdentifiers, context: Context) {
    super();

    const {
      index,
      checkpointId,
      dividendType,
      securityTokenSymbol,
      securityTokenId,
      created,
      maturity,
      expiry,
      amount,
      claimedAmount,
      totalSupply,
      reclaimed,
      totalWithheld,
      totalWithheldWithdrawn,
      shareholders,
      name,
      currency,
    } = params;

    this.index = index;
    this.checkpointId = checkpointId;
    this.dividendType = dividendType;
    this.securityTokenSymbol = securityTokenSymbol;
    this.securityTokenId = securityTokenId;
    this.created = created;
    this.maturity = maturity;
    this.expiry = expiry;
    this.amount = amount;
    this.claimedAmount = claimedAmount;
    this.totalSupply = totalSupply;
    this.reclaimed = reclaimed;
    this.totalWithheld = totalWithheld;
    this.totalWithheldWithdrawn = totalWithheldWithdrawn;
    this.name = name;
    this.shareholders = shareholders;
    this.currency = currency;
    this.context = context;

    this.uid = DividendDistribution.generateId({
      securityTokenId,
      dividendType,
      index,
    });
  }

  /**
   * Push payment for this dividend distribution
   */
  public pushPayment = async () => {
    const { securityTokenSymbol: symbol, dividendType, index: dividendIndex } = this;
    const procedure = new PushDividendPayment(
      {
        symbol,
        dividendType,
        dividendIndex,
      },
      this.context
    );
    return procedure.prepare();
  };

  /**
   * Withdraw collected taxes from this dividend distribution
   */
  public withdrawTaxes = async () => {
    const { securityTokenSymbol: symbol, dividendType, index: dividendIndex } = this;
    const procedure = new WithdrawTaxes(
      {
        symbol,
        dividendType,
        dividendIndex,
      },
      this.context
    );
    return procedure.prepare();
  };

  public toPojo() {
    const {
      uid,
      index,
      checkpointId,
      dividendType,
      securityTokenSymbol,
      securityTokenId,
      created,
      maturity,
      expiry,
      amount,
      claimedAmount,
      totalSupply,
      reclaimed,
      totalWithheld,
      totalWithheldWithdrawn,
      shareholders,
      name,
      currency,
    } = this;

    return {
      uid,
      index,
      checkpointId,
      dividendType,
      securityTokenSymbol,
      securityTokenId,
      created,
      maturity,
      expiry,
      amount,
      claimedAmount,
      totalSupply,
      reclaimed,
      totalWithheld,
      totalWithheldWithdrawn,
      shareholders,
      name,
      currency,
    };
  }

  public _refresh(params: Partial<Params>) {
    const {
      securityTokenSymbol,
      checkpointId,
      created,
      maturity,
      expiry,
      amount,
      claimedAmount,
      totalSupply,
      reclaimed,
      totalWithheld,
      totalWithheldWithdrawn,
      shareholders,
      name,
      currency,
    } = params;

    if (securityTokenSymbol) {
      this.securityTokenSymbol = securityTokenSymbol;
    }

    if (checkpointId) {
      this.checkpointId = checkpointId;
    }

    if (created) {
      this.created = created;
    }

    if (maturity) {
      this.maturity = maturity;
    }

    if (expiry) {
      this.expiry = expiry;
    }

    if (amount) {
      this.amount = amount;
    }

    if (claimedAmount) {
      this.claimedAmount = claimedAmount;
    }

    if (totalSupply) {
      this.totalSupply = totalSupply;
    }

    if (reclaimed !== undefined) {
      this.reclaimed = reclaimed;
    }

    if (totalWithheld) {
      this.totalWithheld = totalWithheld;
    }

    if (totalWithheldWithdrawn) {
      this.totalWithheldWithdrawn = totalWithheldWithdrawn;
    }

    if (shareholders) {
      this.shareholders = shareholders;
    }

    if (name) {
      this.name = name;
    }

    if (currency) {
      this.currency = currency;
    }
  }
}