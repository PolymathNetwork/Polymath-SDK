import { BigNumber, ContractWrapper } from '@polymathnetwork/contract-wrappers';
import { Entity } from './Entity';
import { serialize, unserialize } from '../utils';
import { PolymathError } from '../PolymathError';
import { ErrorCode } from '../types';
import { Context } from '../Context';

export interface UniqueIdentifiers {
  address: string;
}

function isUniqueIdentifiers(identifier: any): identifier is UniqueIdentifiers {
  const { address } = identifier;

  return typeof address === 'string';
}

export interface Params extends UniqueIdentifiers {}

export class Wallet extends Entity<Params> {
  public static generateId({ address }: UniqueIdentifiers) {
    return serialize('wallet', {
      address,
    });
  }

  public static unserialize(serialized: string) {
    const unserialized = unserialize(serialized);

    if (!isUniqueIdentifiers(unserialized)) {
      throw new PolymathError({
        code: ErrorCode.InvalidUuid,
        message: 'Wrong Wallet ID format.',
      });
    }

    return unserialized;
  }

  public uid: string;

  public address: string;

  protected context: Context;

  constructor(params: Params, context: Context) {
    super();

    const { address } = params;

    this.address = address;
    this.context = context;
    this.uid = Wallet.generateId({
      address,
    });
  }

  public toPojo() {
    const { uid, address } = this;

    return {
      uid,
      address,
    };
  }

  public _refresh(params: Partial<Params>) {
    const { address } = params;

    if (address) {
      this.address = address;
    }
  }

  /**
   * Retrieve the POLY balance of this particular wallet address
   */
  public getPolyBalance = async (): Promise<BigNumber> => {
    const { address, context } = this;
    return await context.contractWrappers.polyToken.balanceOf({ owner: address });
  };

  /**
   * Retrieve the ETH balance of this particular wallet address
   */
  public getEthBalance = async (): Promise<BigNumber> => {
    const { address, context } = this;
    return await context.contractWrappers.getBalance({ address });
  };

  /**
   * Retrieve the ERC20 balance of this particular wallet address
   *
   * @param tokenAddress address of the ERC20 token contract
   */
  public getErc20Balance = async (args: { tokenAddress: string }): Promise<BigNumber> => {
    const { context, address } = this;
    const { tokenAddress } = args;
    const erc20Wrapper = await context.contractWrappers.getERC20TokenWrapper({
      address: tokenAddress,
    });
    return await erc20Wrapper.balanceOf({ owner: address });
  };
}