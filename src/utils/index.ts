import stringify from 'json-stable-stringify';
import {
  ContractEvents,
  LogEntry,
  LogWithDecodedArgs,
  DecodedLogArgs,
  SecurityTokenRegistryEvents,
  SecurityTokenRegistryRegisterTickerEventArgs,
  SecurityTokenRegistryNewSecurityTokenEventArgs,
  SecurityTokenEvents,
  SecurityTokenModuleAddedEventArgs,
  SecurityTokenCheckpointCreatedEventArgs,
  SecurityTokenControllerTransferEventArgs,
  GeneralTransferManagerEvents,
  GeneralTransferManagerModifyKYCDataEventArgs,
  GeneralTransferManagerModifyInvestorFlagEventArgs,
  CappedSTOEvents,
  CappedSTOPauseEventArgs,
  USDTieredSTOEvents,
  USDTieredSTOPauseEventArgs,
  ERC20DividendCheckpointEvents,
  ERC20DividendCheckpointERC20DividendDepositedEventArgs,
  ERC20DividendCheckpointERC20DividendClaimedEventArgs,
  ERC20DividendCheckpointERC20DividendReclaimedEventArgs,
  ERC20DividendCheckpointSetWalletEventArgs,
  ERC20DividendCheckpointSetWithholdingEventArgs,
  EtherDividendCheckpointEvents,
  EtherDividendCheckpointEtherDividendDepositedEventArgs,
  EtherDividendCheckpointEtherDividendClaimedEventArgs,
  EtherDividendCheckpointEtherDividendReclaimedEventArgs,
  EtherDividendCheckpointSetWalletEventArgs,
  EtherDividendCheckpointSetWithholdingEventArgs,
  USDTieredSTOAllowPreMintFlagEventArgs,
  CappedSTOAllowPreMintFlagEventArgs,
  BigNumber,
} from '@polymathnetwork/contract-wrappers';
import { isAddress } from 'ethereum-address';
import { ErrorCode, Pojo, Version } from '../types';
import { PolymathError } from '../PolymathError';

/**
 * Promisified version of a timeout
 *
 * @param amount - time to wait
 */
export const delay = async (amount: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, amount);
  });
};

/**
 * Check if two addresses correspond to the same wallet
 */
export function areSameAddress(a: string, b: string) {
  return a.toUpperCase() === b.toUpperCase();
}

/**
 * Check the length of a given string to ensure it meets correct bounds
 *
 * @param value - the string itself
 * @param variableName - the name of the variable associated to the string itself
 * @param opts - optional min and max length of the string. Defaults to a minimum of 0 (empty string) and a maximum of 32 characters
 */
export function checkStringLength(
  value: string,
  variableName: string,
  opts: { minLength?: number; maxLength: number } = { maxLength: 32 }
) {
  const { minLength = 0, maxLength } = opts;
  if (value.length < minLength || value.length > maxLength) {
    throw new PolymathError({
      code: ErrorCode.ProcedureValidationError,
      message: `You must provide a valid ${variableName} ${
        opts.minLength !== undefined
          ? `between ${minLength} and ${maxLength}`
          : `up to ${maxLength}`
      } characters long`,
    });
  }
}

/**
 * @hidden
 * Generate a hash of an Entity's unique identifiers
 */
export function serialize(entityType: string, uniqueIdentifiers: Pojo) {
  return Buffer.from(`${entityType}:${stringify(uniqueIdentifiers)}`).toString('base64');
}

/**
 * @hidden
 * Retrieve an Entity's unique identifiers from their hashed version
 */
export function unserialize(id: string) {
  const unserialized = Buffer.from(id, 'base64').toString('utf8');

  const matched = unserialized.match(/^.*?:(.*)/);

  const errorMsg = 'Wrong ID format';

  if (!matched) {
    throw new Error(errorMsg);
  }

  const [, jsonString] = matched;

  try {
    return JSON.parse(jsonString);
  } catch (err) {
    throw new Error(errorMsg);
  }
}

/**
 * @hidden
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(address: string) {
  return isAddress(address);
}

interface FindEventParams {
  logs: (LogEntry | LogWithDecodedArgs<DecodedLogArgs>)[];
  eventName: ContractEvents;
}

interface FindTickerRegisteredParams extends FindEventParams {
  eventName: SecurityTokenRegistryEvents.RegisterTicker;
}

interface FindNewSecurityTokenParams extends FindEventParams {
  eventName: SecurityTokenRegistryEvents.NewSecurityToken;
}

interface FindCheckpointCreatedParams extends FindEventParams {
  eventName: SecurityTokenEvents.CheckpointCreated;
}

interface FindModuleAddedParams extends FindEventParams {
  eventName: SecurityTokenEvents.ModuleAdded;
}

interface FindControllerTransferParams extends FindEventParams {
  eventName: SecurityTokenEvents.ControllerTransfer;
}

interface FindErc20DividendDepositedParams extends FindEventParams {
  eventName: ERC20DividendCheckpointEvents.ERC20DividendDeposited;
}

interface FindEtherDividendDepositedParams extends FindEventParams {
  eventName: EtherDividendCheckpointEvents.EtherDividendDeposited;
}

interface FindModifyKycDataParams extends FindEventParams {
  eventName: typeof GeneralTransferManagerEvents.ModifyKYCData;
}

interface FindModifyInvestorFlagParams extends FindEventParams {
  eventName: typeof GeneralTransferManagerEvents.ModifyInvestorFlag;
}

interface FindCappedStoPauseParams extends FindEventParams {
  eventName: typeof CappedSTOEvents.Pause;
}

interface FindCappedStoPreMintAllowedParams extends FindEventParams {
  eventName: typeof CappedSTOEvents.AllowPreMintFlag;
}

interface FindTieredStoPauseParams extends FindEventParams {
  eventName: typeof USDTieredSTOEvents.Pause;
}

interface FindTieredStoPreMintAllowedParams extends FindEventParams {
  eventName: typeof USDTieredSTOEvents.AllowPreMintFlag;
}

interface FindErc20DividendClaimedParams extends FindEventParams {
  eventName: ERC20DividendCheckpointEvents.ERC20DividendClaimed;
}

interface FindEthDividendClaimedParams extends FindEventParams {
  eventName: EtherDividendCheckpointEvents.EtherDividendClaimed;
}

interface FindErc20DividendReclaimedParams extends FindEventParams {
  eventName: ERC20DividendCheckpointEvents.ERC20DividendReclaimed;
}

interface FindEthDividendReclaimedParams extends FindEventParams {
  eventName: EtherDividendCheckpointEvents.EtherDividendReclaimed;
}

interface FindErc20SetWalletParams extends FindEventParams {
  eventName: ERC20DividendCheckpointEvents.SetWallet;
}

interface FindEthSetWalletParams extends FindEventParams {
  eventName: EtherDividendCheckpointEvents.SetWallet;
}

interface FindErc20SetWithholdingParams extends FindEventParams {
  eventName: ERC20DividendCheckpointEvents.SetWithholding;
}

interface FindEthSetWithholdingParams extends FindEventParams {
  eventName: EtherDividendCheckpointEvents.SetWithholding;
}

interface FindEvents {
  (params: FindTickerRegisteredParams): LogWithDecodedArgs<
    SecurityTokenRegistryRegisterTickerEventArgs
  >[];
  (params: FindNewSecurityTokenParams): LogWithDecodedArgs<
    SecurityTokenRegistryNewSecurityTokenEventArgs
  >[];
  (params: FindModuleAddedParams): LogWithDecodedArgs<SecurityTokenModuleAddedEventArgs>[];
  (params: FindCheckpointCreatedParams): LogWithDecodedArgs<
    SecurityTokenCheckpointCreatedEventArgs
  >[];
  (params: FindControllerTransferParams): LogWithDecodedArgs<
    SecurityTokenControllerTransferEventArgs
  >[];
  (params: FindErc20DividendDepositedParams): LogWithDecodedArgs<
    ERC20DividendCheckpointERC20DividendDepositedEventArgs
  >[];
  (params: FindEtherDividendDepositedParams): LogWithDecodedArgs<
    EtherDividendCheckpointEtherDividendDepositedEventArgs
  >[];
  (params: FindModifyKycDataParams): LogWithDecodedArgs<
    GeneralTransferManagerModifyKYCDataEventArgs
  >[];
  (params: FindModifyInvestorFlagParams): LogWithDecodedArgs<
    GeneralTransferManagerModifyInvestorFlagEventArgs
  >[];
  (params: FindCappedStoPauseParams): LogWithDecodedArgs<CappedSTOPauseEventArgs>[];
  (params: FindCappedStoPreMintAllowedParams): LogWithDecodedArgs<
    CappedSTOAllowPreMintFlagEventArgs
  >[];
  (params: FindTieredStoPauseParams): LogWithDecodedArgs<USDTieredSTOPauseEventArgs>[];
  (params: FindTieredStoPreMintAllowedParams): LogWithDecodedArgs<
    USDTieredSTOAllowPreMintFlagEventArgs
  >[];
  (params: FindErc20DividendClaimedParams): LogWithDecodedArgs<
    ERC20DividendCheckpointERC20DividendClaimedEventArgs
  >[];
  (params: FindEthDividendClaimedParams): LogWithDecodedArgs<
    EtherDividendCheckpointEtherDividendClaimedEventArgs
  >[];
  (params: FindErc20DividendReclaimedParams): LogWithDecodedArgs<
    ERC20DividendCheckpointERC20DividendReclaimedEventArgs
  >[];
  (params: FindEthDividendReclaimedParams): LogWithDecodedArgs<
    EtherDividendCheckpointEtherDividendReclaimedEventArgs
  >[];
  (params: FindErc20SetWalletParams): LogWithDecodedArgs<
    ERC20DividendCheckpointSetWalletEventArgs
  >[];
  (params: FindEthSetWalletParams): LogWithDecodedArgs<EtherDividendCheckpointSetWalletEventArgs>[];
  (params: FindErc20SetWithholdingParams): LogWithDecodedArgs<
    ERC20DividendCheckpointSetWithholdingEventArgs
  >[];
  (params: FindEthSetWithholdingParams): LogWithDecodedArgs<
    EtherDividendCheckpointSetWithholdingEventArgs
  >[];
}

/**
 * @hidden
 * Find all occurrences of a certain event in an array
 */
export const findEvents: FindEvents = ({
  logs,
  eventName,
}: {
  logs: (LogEntry | LogWithDecodedArgs<DecodedLogArgs>)[];
  eventName: ContractEvents;
}): any => {
  const foundLogs = logs.filter(log => {
    const l = log as LogWithDecodedArgs<DecodedLogArgs>;

    return l.event === eventName;
  });

  return foundLogs;
};

/**
 * Convert a version number array into a string of type [[Version]]
 */
export function convertVersionToEnum(versionBigNumber: BigNumber[]) {
  const version = versionBigNumber
    .map(num => {
      return (num as BigNumber).toString();
    })
    .join('.');
  switch (version) {
    case Version.V3_0_0: {
      return Version.V3_0_0;
    }
    case Version.V3_1_0: {
      return Version.V3_1_0;
    }
    default: {
      throw new PolymathError({
        code: ErrorCode.FatalError,
        message: `Unsupported Security Token version. Expected 3.0.0 or 3.1.0, got ${version}`,
      });
    }
  }
}
