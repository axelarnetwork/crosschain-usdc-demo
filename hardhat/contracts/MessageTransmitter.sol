// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./USDC.sol";

contract MessageTransmitter is Ownable {
    USDC private usdc;
    uint8 private MESSAGE_SENT = 1;
    uint8 private MESSAGE_RECEIVED = 2;
    mapping(bytes32 => uint8) public messages;

    constructor(address _usdc) {
        usdc = USDC(_usdc);
    }

    /**
     * @notice Emitted when a new message is received
     * @param sourceDomain The source domain this message originated from
     * @param nonce The nonce unique to this message
     * @param sender The sender of this message
     * @param messageBody message body bytes
     */
    event MessageReceived(
        uint32 sourceDomain,
        uint64 nonce,
        bytes32 sender,
        bytes messageBody
    );

    modifier onlyValidMessage(bytes memory _message, bytes memory _signature) {
        bytes32 key = keccak256(abi.encodePacked(_message, _signature));
        require(
            messages[key] == MESSAGE_SENT,
            "MessageTransmitter: message already processed or not sent"
        );
        messages[key] = MESSAGE_RECEIVED;
        _;
    }

    /**
     * @notice This function will be called by the attestation service
     * @param message Raw bytes of message
     */
    function setMessage(bytes memory message, bytes memory _signature)
        external
        onlyOwner
    {
        bytes32 key = keccak256(abi.encodePacked(message, _signature));
        messages[key] = MESSAGE_SENT;
    }

    /**
     * @param _message The message raw bytes
     * @param _signature The message signature
     * @return success bool, true if successful
     */
    function receiveMessage(bytes memory _message, bytes memory _signature)
        external
        onlyValidMessage(_message, _signature)
        returns (bool success)
    {
        (
            uint32 _sourceDomain,
            uint64 _nonce,
            bytes32 _sender,
            bytes memory messageBody
        ) = abi.decode(_message, (uint32, uint64, bytes32, bytes));
        (uint256 amount, bytes32 recipient) = abi.decode(
            messageBody,
            (uint256, bytes32)
        );
        usdc.mint(address(uint160(uint256(recipient))), amount);
        emit MessageReceived(_sourceDomain, _nonce, _sender, messageBody);
        return true;
    }
}
