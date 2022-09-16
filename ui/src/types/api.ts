import { SquidChain } from "./chain";
import { Token } from "./token";

export type FeeResponse = {
  status: boolean;
  data?: string;
  error?: string;
};

export type FeeRequest = {
  srcChain?: SquidChain;
  destChain: SquidChain;
  srcToken?: Token;
};
