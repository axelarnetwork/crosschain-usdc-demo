// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICircleBridge} from "./ICircleBridge.sol";
import "./StringAddressUtils.sol";

contract CircleSwapExecutable {
    IERC20 public usdc;
    ICircleBridge public circleBridge;

    // mapping chain name to domain number;
    mapping(string => uint32) public circleDestinationDomains;
    bytes32 constant CHAIN_ETHEREUM = keccak256(abi.encodePacked("ethereum"));
    bytes32 constant CHAIN_AVALANCHE = keccak256(abi.encodePacked("avalanche"));

    constructor(address _usdc, address _circleBridge) {
        usdc = IERC20(_usdc);
        circleBridge = ICircleBridge(_circleBridge);
        circleDestinationDomains["ethereum"] = 0;
        circleDestinationDomains["avalanche"] = 1;
    }

    modifier isValidChain(string memory destinationChain) {
        require(
            keccak256(abi.encodePacked(destinationChain)) == CHAIN_ETHEREUM ||
                keccak256(abi.encodePacked(destinationChain)) ==
                CHAIN_AVALANCHE,
            "Invalid chain"
        );
        _;
    }

    // Step 1: Burn USDC on the source chain with given amount
    function _depositAndBurnUSDC(
        uint256 amount,
        string memory destinationChain,
        address recipient
    ) private isValidChain(destinationChain) {
        IERC20(address(usdc)).approve(address(circleBridge), amount);

        circleBridge.depositForBurn(
            amount,
            this.circleDestinationDomains(destinationChain),
            bytes32(uint256(uint160(recipient))),
            address(usdc)
        );
    }
}
