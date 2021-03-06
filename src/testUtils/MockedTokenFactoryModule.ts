import { SecurityToken_3_0_0, Web3Wrapper } from '@polymathnetwork/contract-wrappers';
import SecurityTokenRegistryWrapper from '@polymathnetwork/contract-wrappers/lib/contract_wrappers/registries/security_token_registry_wrapper';
import ERC20TokenWrapper from '@polymathnetwork/contract-wrappers/lib/contract_wrappers/tokens/erc20_wrapper';
import ContractFactory from '@polymathnetwork/contract-wrappers/lib/factories/contractFactory';

/**
 * @hidden
 * Mocks the behavior of the contract-wrappers Token Factory
 */
export abstract class MockedTokenFactoryModule {
  public readonly web3Wrapper: Web3Wrapper;

  public contractFactory: ContractFactory;

  public securityTokenRegistry: SecurityTokenRegistryWrapper;

  // eslint-disable-next-line require-jsdoc
  public constructor(
    web3Wrapper: Web3Wrapper,
    securityTokenRegistry: SecurityTokenRegistryWrapper,
    contractFactory: ContractFactory
  ) {
    this.web3Wrapper = web3Wrapper;
    this.securityTokenRegistry = securityTokenRegistry;
    this.contractFactory = contractFactory;
  }

  public abstract getERC20TokenInstanceFromAddress(address: string): Promise<ERC20TokenWrapper>;

  public abstract getSecurityTokenInstanceFromAddress(
    address: string
  ): Promise<SecurityToken_3_0_0>;

  // eslint-disable-next-line require-jsdoc
  public async getSecurityTokenInstanceFromTicker(): Promise<SecurityToken_3_0_0> {
    return {} as Promise<SecurityToken_3_0_0>;
  }
}
