// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { AttestationsResponse } from "types/api";
import { ethers, PopulatedTransaction } from "ethers";
import { ChainName } from "types/chain";
import { RPC } from "config/constants";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AttestationsResponse>
) {
  const privateKey = process.env.PRIVATE_KEY || "";
  const chain = req.body.chain as ChainName;
  const rawTx = req.body.rawTx as PopulatedTransaction;
  if (chain !== ChainName.AVALANCHE && chain !== ChainName.ETHEREUM) {
    return res
      .status(400)
      .json({ success: false, error: `${chain} is not supported.` });
  }

  const provider = new ethers.providers.JsonRpcProvider(RPC[chain]);
  const signer = new ethers.Wallet(privateKey, provider);
  const tx = await signer
    .sendTransaction(rawTx)
    .then((tx: any) => tx.wait())
    .catch((e) => undefined);

  if (!tx) {
    return res.status(400).json({ success: false, error: "Failed to send tx" });
  }

  return res.status(200).json({
    success: true,
    hash: tx.transactionHash,
  });
}
