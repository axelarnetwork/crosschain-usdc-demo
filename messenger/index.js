const { ethers } = require("ethers");
const { privateKey } = require("./secret.json");

// Mocked the MessageTransmitter contract address
const MESSAGE_TRANSMITTER_ADDRESS =
  "0x45600eC9d7dA05050699d4B98d35EcfA886c9e67";
const CIRCLE_BRIDGE_ADDRESS = "0x10c85E0D6e8aD1F71F0b9926f962e2f266d39a69";
const signer = new ethers.Wallet(privateKey);
const srcProvider = new ethers.providers.WebSocketProvider(
  "wss://api.avax-test.network/ext/bc/C/ws"
);
const destProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.api.moonbase.moonbeam.network"
);

// Step 1: Observe for the MessageSent event
const srcContract = new ethers.Contract(
  CIRCLE_BRIDGE_ADDRESS,
  ["event MessageSent(bytes message)"],
  srcProvider
);

srcContract.on("MessageSent", async (message) => {
  // Step 2: Call the Attestation API to get the signature
  console.log("Received message from Circle Bridge", message);
  const response = await fetch(
    `http://localhost:4000/v1/attestations/${ethers.utils.solidityKeccak256(
      ["bytes"],
      [message]
    )}`
  ).then((resp) => resp.json());
  console.log("Attestation response", response);
  if (response.success) {
    const destContract = new ethers.Contract(
      MESSAGE_TRANSMITTER_ADDRESS,
      ["function receiveMessage(bytes message, bytes signature)"],
      signer.connect(destProvider)
    );

    const signature = response.signature;

    // Step 3: Call the receiveMessage function with the signature
    const tx = await destContract
      .receiveMessage(message, signature)
      .then((tx) => tx.wait());

    console.log(
      "Message received on the destination chain:",
      tx.transactionHash
    );
  }
});

console.log("Messenger started");
