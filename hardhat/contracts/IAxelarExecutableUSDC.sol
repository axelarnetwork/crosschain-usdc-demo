// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {IAxelarGateway} from "./IAxelarGateway.sol";
import {MessageTransmitter} from "./MessageTransmitter.sol";

abstract contract IAxelarExecutableUSDC {
    error NotApprovedByGateway();
    error NotApprovedByMessageTransmitter();

    IAxelarGateway public gateway;
    MessageTransmitter public messageTransmitter;

    constructor(address gateway_, address _messageTransmitter) {
        gateway = IAxelarGateway(gateway_);
        messageTransmitter = MessageTransmitter(_messageTransmitter);
    }

    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) private {
        bytes32 payloadHash = keccak256(payload);
        if (
            !gateway.validateContractCall(
                commandId,
                sourceChain,
                sourceAddress,
                payloadHash
            )
        ) revert NotApprovedByGateway();
        _execute(sourceChain, sourceAddress, payload);
    }

    function executeWithUsdc(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        bytes memory _message,
        bytes memory _signature
    ) external {
        // If _message and _signature are valid, then mint the USDC
        if (!messageTransmitter.receiveMessage(_message, _signature))
            revert NotApprovedByMessageTransmitter();

        execute(commandId, sourceChain, sourceAddress, payload);
    }

    function _execute(
        string memory sourceChain,
        string memory sourceAddress,
        bytes calldata payload
    ) internal virtual {}
}
