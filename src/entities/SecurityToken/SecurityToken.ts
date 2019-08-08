import { Context } from '../../Context';
import { Entity } from '../Entity';
import { serialize, unserialize as unserializeUtil } from '../../utils';
import { Shareholders } from './Shareholders';
import { Dividends } from './Dividends';
import { Offerings } from './Offerings';
import { Permissions } from './Permissions';
import { PolymathError } from '../../PolymathError';
import { ErrorCode } from '../../types';

interface UniqueIdentifiers {
  symbol: string;
}

function isUniqueIdentifiers(identifiers: any): identifiers is UniqueIdentifiers {
  const { symbol } = identifiers;

  return typeof symbol === 'string';
}

interface Params extends UniqueIdentifiers {
  name: string;
  address: string;
  owner: string;
}

export const unserialize = (serialized: string) => {
  const unserialized = unserializeUtil(serialized);

  if (!isUniqueIdentifiers(unserialized)) {
    throw new PolymathError({
      code: ErrorCode.InvalidUuid,
      message: 'Wrong Security Token ID format.',
    });
  }

  return unserialized;
};

export class SecurityToken extends Entity {
  public static generateId({ symbol }: UniqueIdentifiers) {
    return serialize('securityToken', {
      symbol,
    });
  }

  public static unserialize = unserialize;

  public uid: string;

  public symbol: string;

  public name: string;

  public owner: string;

  public address: string;

  public shareholders: Shareholders;

  public dividends: Dividends;

  public offerings: Offerings;

  public permissions: Permissions;

  constructor(params: Params, context: Context) {
    super();

    const { symbol, name, address, owner } = params;

    this.symbol = symbol;
    this.name = name;
    this.owner = owner;
    this.address = address;
    this.uid = SecurityToken.generateId({ symbol });
    this.shareholders = new Shareholders(this, context);
    this.dividends = new Dividends(this, context);
    this.offerings = new Offerings(this, context);
    this.permissions = new Permissions(this, context);
  }

  public toPojo() {
    const { uid, symbol, name, address } = this;

    return { uid, symbol, name, address };
  }
}
