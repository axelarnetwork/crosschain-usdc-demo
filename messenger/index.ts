import { ethers } from "ethers";
import ora from "ora";
import { fetch } from "cross-fetch";
import { privateKey } from "./secret.json";
import { Chain } from "./constants/chains";
import { RPC, WSS } from "./constants/rpc";
import chalk from "chalk";
import { CIRCLE_BRIDGE, MESSAGE_TRANSMITTER } from "./constants/address";

// Mocked the MessageTransmitter contract address
const supportedChains = [Chain.AVALANCHE, Chain.FANTOM];
if (supportedChains.length > 2) {
  console.log("Only two chains are supported");
  process.exit(0);
}

function leadingZero(num: number) {
  return num < 10 ? `0${num}` : num;
}

function getDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = leadingZero(now.getMonth() + 1);
  const day = leadingZero(now.getDate());
  const hour = leadingZero(now.getHours());
  const minute = leadingZero(now.getMinutes());
  const second = leadingZero(now.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

const colorMessage = chalk.cyanBright("message");
const colorAttestation = chalk.cyanBright("attestation");
const colorCircleBridge = chalk.yellowBright("CircleBridge");
const colorAttestationApi = chalk.yellowBright("Attestation API");
const colorReceiveMessage = chalk.whiteBright("receiveMessage");
const colorMessageTransmitter = chalk.yellowBright("MessageTransmitter");
const colorUSDC = chalk.whiteBright("USDC");

for (const chain of supportedChains) {
  const destChain = supportedChains.find((c) => c !== chain);
  if (!destChain) continue;
  const circleBridgeAddress = CIRCLE_BRIDGE[chain];
  const messageTransmitterAddress = MESSAGE_TRANSMITTER[destChain];
  const srcProvider = new ethers.providers.WebSocketProvider(WSS[chain]);
  const destProvider = new ethers.providers.JsonRpcProvider(RPC[destChain]);
  const destSigner = new ethers.Wallet(privateKey, destProvider);

  // Step 1: Observe for the MessageSent event
  const srcContract = new ethers.Contract(
    circleBridgeAddress,
    ["event MessageSent(bytes message)"],
    srcProvider
  );

  srcContract.on("MessageSent", async (message) => {
    // Step 2: Call the Attestation API to get the signature
    console.log(""); // Add a new line
    ora({
      prefixText: `[${getDateTime()}]`,
    })
      .start()
      .succeed(
        `Received ${colorMessage} from the ${colorCircleBridge} contract on ${chain}: ` +
          chalk.green(message)
      );
    const oraApiCall = ora("Waiting for Attestation API response").start();
    const response = await fetch(
      `http://localhost:4000/v1/attestations/${destChain}/${ethers.utils.solidityKeccak256(
        ["bytes"],
        [message]
      )}`
    )
      .then((resp) => resp.json())
      .catch((err: any) => {
        oraApiCall.fail(
          "Error fetching attestation: " + chalk.redBright(err.message)
        );
      });
    oraApiCall.prefixText = `[${getDateTime()}]`;
    oraApiCall.succeed(
      `Received ${colorAttestation} from the ${colorAttestationApi}: ` +
        chalk.green(response.signature)
    );
    if (response.success) {
      const destContract = new ethers.Contract(
        messageTransmitterAddress,
        ["function receiveMessage(bytes message, bytes signature)"],
        destSigner
      );

      const signature = response.signature;

      // Step 3: Call the receiveMessage function with the signature
      const oraTx = ora(
        `Calling ${colorReceiveMessage} function on ${destChain}`
      ).start();
      const tx = await destContract
        .receiveMessage(message, signature)
        .then((tx: any) => tx.wait())
        .catch((e: any) => {
          oraTx.fail(
            "Error calling 'receiveMessage' function: " +
              chalk.redBright(e.message)
          );
        });
      oraTx.prefixText = `[${getDateTime()}]`;

      const [, , , messageBody] = ethers.utils.defaultAbiCoder.decode(
        ["uint32", "uint64", "address", "bytes"],
        message
      );
      const [amount, _recipient] = ethers.utils.defaultAbiCoder.decode(
        ["uint256", "bytes32"],
        messageBody
      );
      const colorRecipient = chalk.greenBright("0x" + _recipient.slice(-40));
      const colorAmount = chalk.cyanBright(ethers.utils.formatUnits(amount, 6));

      oraTx.succeed(
        `Sent "${colorReceiveMessage}(${colorMessage},${colorAttestation})" tx to the ${colorMessageTransmitter} contract on ${destChain}: ` +
          chalk.greenBright(tx.transactionHash) +
          ` which means ${colorAmount} ${colorUSDC} has been minted to the recipient ${colorRecipient}`
      );
    }
  });
}

console.log("Messenger started");
