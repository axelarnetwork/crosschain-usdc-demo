// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./USDC.sol";

contract CircleBridge is Ownable {
    // A mapping of destinationDomain to the corresponding destination chain's CircleBridge contract
    mapping(uint32 => bytes32) public circleBridgeSiblings;
    uint32 sourceDomain;
    uint64 nonce = 0;
    USDC private usdc;

    constructor(address _usdc, uint32 _sourceDomain) {
        usdc = USDC(_usdc);
        sourceDomain = _sourceDomain;
    }

    /**
    * @notice Emitted when a deposit for burn is received on local domain
    * @param depositor address where deposit is transferred from
    * @param burnToken address of token burnt on local domain
    * @param amount deposit amount
    * @param mintRecipient address receiving minted tokens on destination
    domain as bytes32
    * @param destinationDomain destination domain
    * @param destinationCircleBridge address of CircleBridge on destination
    domain as bytes32
    */
    event DepositForBurn(
        address depositor,
        address burnToken,
        uint256 amount,
        bytes32 mintRecipient,
        uint32 destinationDomain,
        bytes32 destinationCircleBridge
    );

    /**
     * @notice Emitted when a new message is dispatched
     * @param message Raw bytes of message
     */
    event MessageSent(bytes message);

    /**
    * @param _amount amount of tokens to burn
    * @param _destinationDomain destination domain
    * @param _mintRecipient address of mint recipient on destination domain
    * @param _burnToken address of contract to burn deposited tokens, on local
    domain
    * @return success bool, true if successful
    */
    function depositForBurn(
        uint256 _amount,
        uint32 _destinationDomain,
        bytes32 _mintRecipient,
        address _burnToken
    ) external returns (bool success) {
        usdc.burn(msg.sender, _amount);
        emit DepositForBurn(
            msg.sender,
            _burnToken,
            _amount,
            _mintRecipient,
            _destinationDomain,
            circleBridgeSiblings[_destinationDomain]
        );
        bytes memory messageBody = abi.encode(_amount, _mintRecipient);
        bytes memory message = abi.encode(
            sourceDomain,
            nonce,
            msg.sender,
            messageBody
        );
        nonce++;
        emit MessageSent(message);
        return true;
    }

    /**
     * @param _domain destination domain
     * @param _circleBridge address of CircleBridge on destination domain
     */
    function addCircleBridgeSibling(uint32 _domain, bytes32 _circleBridge)
        external
        onlyOwner
    {
        circleBridgeSiblings[_domain] = _circleBridge;
    }
}
