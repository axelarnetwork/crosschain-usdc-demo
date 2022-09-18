// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { AttestationsResponse } from "types/api";
import { ethers, Signer } from "ethers";
import { ChainName } from "types/chain";
import { MESSAGE_TRANSMITTER, RPC } from "config/constants";

function signMessage(signer: Signer, messageHash: string) {
  return signer.signMessage(messageHash);
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AttestationsResponse>
) {
  const privateKey = process.env.PRIVATE_KEY || "";
  const chain = req.query.chain as ChainName;
  if (chain !== ChainName.AVALANCHE && chain !== ChainName.FANTOM) {
    return res
      .status(400)
      .json({ success: false, error: `${chain} is not supported.` });
  }

  const destProvider = new ethers.providers.JsonRpcProvider(RPC[chain]);
  const messageTransmitterAddress = MESSAGE_TRANSMITTER[chain];
  const signer = new ethers.Wallet(privateKey, destProvider);

  // Step 1: Get the message hash from the request
  const messageHash = req.query.messageHash as string;
  // Step 2: Sign messageHash to get the attestation (signature)
  const signature = await signMessage(signer, messageHash);
  // Step 3: Call "setMessage" at the MessageTransmitter contract to send the attestation to the blockchain
  const messageTransmitter = new ethers.Contract(
    messageTransmitterAddress,
    ["function setMessage(bytes32 messageHash, bytes signature)"],
    signer
  );
  const tx = await messageTransmitter
    .setMessage(messageHash, signature)
    .then((tx: any) => tx.wait());
  // Step 4: Return the attestation (signature)
  console.log(`setMessage on ${chain}`, tx.transactionHash);
  return res.status(200).json({
    success: true,
    signature,
    hash: tx.transactionHash,
  });
}
