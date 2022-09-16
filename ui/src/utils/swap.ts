import { SquidChain } from "types/chain";
import { Token } from "types/token";

export function requiredSwapSrc(srcToken: Token) {
  // If srcToken isn't a cross-chain token, it requires to be swapped to a cross-chain toke first.
  // Otherwise, it can be sent rightaway to the gateway contract.
  return !srcToken.crosschain;
}

export function requiredSwapDest(
  srcToken: Token,
  destToken: Token,
  destChain: SquidChain
) {
  // Always required swap when the output token is custom erc20 token.
  if (!destToken.crosschain) return true;

  // If srcToken is not a cross-chain token, then the destination chain will receive the defaultCrosschainToken.
  // As a result, it requires swap if the destToken is not a defaultCrosschainToken.
  if (
    !srcToken.crosschain &&
    destChain.defaultCrosschainToken !== destToken.address
  )
    return true;

  // If srcToken is a cross-chain token, then the destination chain will receive the same cross-chain token.
  // As a result, it requires swap if both srcToken and destToken symbol are not equal. (destToken is a cross-chain token here because it passes the first check.)
  if (srcToken.crosschain && srcToken.symbol !== destToken.symbol) return true;

  // Otherwise, it doesn't require swap.
  return false;
}
