const { ethers } = require("ethers");
const { privateKey } = require("secret.json");

// Mocked the MessageTransmitter contract address
const MESSAGE_TRANSMITTER_ADDRESS = "0x...";
const CIRCLE_BRIDGE_ADDRESS = "0x...";
const signer = new ethers.Wallet(privateKey);
const srcProvider = new ethers.providers.JsonRpcProvider(
  "wss://ropsten.infura.io/ws/v3/510b6d5b3c56497b8070626a54f565a9"
);
const destProvider = new ethers.providers.JsonRpcProvider(
  "https://api.avax-test.network/ext/bc/C/rpc"
);

// Step 1: Observe for the MessageSent event
const srcContract = new ethers.Contract(
  CIRCLE_BRIDGE_ADDRESS,
  ["event MessageSent(bytes message)"],
  srcProvider
);

srcContract.on("MessageSent", async (message) => {
  // Step 2: Call the Attestation API to get the signature
  const response = await fetch(
    `http://localhost:4000/v1/attestation/${ethers.utils.solidityKeccak256(
      message
    )}`
  ).then((resp) => resp.json());
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
