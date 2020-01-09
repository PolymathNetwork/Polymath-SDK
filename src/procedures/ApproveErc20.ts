import { BigNumber } from '@polymathnetwork/contract-wrappers';
import { Procedure } from './Procedure';
import { ApproveErc20ProcedureArgs, ErrorCode, ProcedureType, PolyTransactionTag } from '../types';
import { PolymathError } from '../PolymathError';

/**
 * Procedure to approve spending funds on an ERC20 token. If no token address is specified, it defaults to POLY
 */
export class ApproveErc20 extends Procedure<ApproveErc20ProcedureArgs> {
  public type = ProcedureType.ApproveErc20;

  /**
   * - If the balance is less than the amount being approved, and procedure used with poly on testnet, poly tokens will be transferred from faucet
   * - Approve the ERC20 token transfer
   *
   * Note that this procedure will fail if the shareholder balance is lower than the amount being approved, off test net
   * Note that this procedure will fail if the shareholder balance is lower than the amount being approved, on test net and with a custom erc20 token
   * Note that the token approval transaction will not be added to the queue, if the amount has already been approved previously
   */
  public async prepareTransactions() {
    const { amount, spender, tokenAddress } = this.args;
    const { contractWrappers, currentWallet } = this.context;

    const ownerAddress = await currentWallet.address();

    const { polyToken } = contractWrappers;

    let token;

    if (tokenAddress) {
      try {
        token = await contractWrappers.getERC20TokenWrapper({ address: tokenAddress });
      } catch (err) {
        throw new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: 'The supplied address does not correspond to an ERC20 token',
        });
      }
    } else {
      token = polyToken;
    }

    const balance = await token.balanceOf({ owner: ownerAddress });

    const address = await token.address();
    const polyTokenAddress = await polyToken.address();

    const isTestnet = await contractWrappers.isTestnet();

    if (balance.lt(amount)) {
      if (isTestnet && address.toUpperCase() === polyTokenAddress.toUpperCase()) {
        await this.addTransaction(contractWrappers.getPolyTokens, {
          tag: PolyTransactionTag.GetTokens,
        })({
          amount: amount.minus(balance).decimalPlaces(0, BigNumber.ROUND_HALF_UP),
          address: ownerAddress,
        });
      } else {
        throw new PolymathError({
          code: ErrorCode.ProcedureValidationError,
          message: 'Not enough funds',
        });
      }
    }

    const allowance = await token.allowance({
      spender,
      owner: ownerAddress,
    });
    const hasEnoughAllowance = allowance.gte(amount);

    if (hasEnoughAllowance) {
      return;
    }

    await this.addTransaction(token.approve, {
      tag: PolyTransactionTag.ApproveErc20,
    })({ spender, value: amount });
  }
}
