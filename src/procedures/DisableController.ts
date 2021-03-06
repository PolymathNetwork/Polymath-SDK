import { Procedure } from './Procedure';
import {
  ProcedureType,
  PolyTransactionTag,
  DisableControllerProcedureArgs,
  ErrorCode,
} from '../types';
import { PolymathError } from '../PolymathError';

/**
 * Procedure that permanently disables a Security Token's controller functionality. This requires the Security Token's owner to send signed data in acknowledgement
 */
export class DisableController extends Procedure<DisableControllerProcedureArgs> {
  public type = ProcedureType.DisableController;

  /**
   * - If no signature acknowledgement data (optional) is appended to the procedure arguments, the procedure itself will request the user's signature or sign the data in place if the client was instanced with a private key
   * - Disable the Security Token's controller functionality
   *
   * Note that this procedure will fail if:
   * - The current user is not the owner of the Security Token
   * - The controller has already been previously disabled
   */
  public async prepareTransactions() {
    const { signature, symbol } = this.args;
    const { contractWrappers, currentWallet } = this.context;

    let securityToken;

    try {
      securityToken = await contractWrappers.tokenFactory.getSecurityTokenInstanceFromTicker(
        symbol
      );
    } catch (err) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `There is no Security Token with symbol ${symbol}`,
      });
    }

    const [owner, account, isControllable] = await Promise.all([
      securityToken.owner(),
      currentWallet.address(),
      securityToken.isControllable(),
    ]);

    if (account !== owner) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `You must be the owner of this Security Token to disable the controller`,
      });
    }

    if (!isControllable) {
      throw new PolymathError({
        code: ErrorCode.ProcedureValidationError,
        message: `The controller has already been disabled permanently`,
      });
    }

    // If there is no hex signature passed in, create a signature request to sign the disable controller acknowledgement
    const requestedSignature =
      signature || (await this.addSignatureRequest(securityToken.signDisableControllerAck)({}));

    /*
     * Transactions
     */
    await this.addTransaction(securityToken.disableController, {
      tag: PolyTransactionTag.DisableController,
    })({ signature: requestedSignature });
  }
}
