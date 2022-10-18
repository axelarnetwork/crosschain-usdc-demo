// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IAxelarForecallable} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarForecallable.sol";
import {IAxelarGasService} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICircleBridge} from "./ICircleBridge.sol";
import "./StringAddressUtils.sol";

contract CircleSwapExecutable is IAxelarForecallable, Ownable {
    IERC20 public usdc;
    ICircleBridge public circleBridge;
    IAxelarGasService immutable gasReceiver;

    // mapping chain name => domain number;
    mapping(string => uint32) public circleDestinationDomains;
    // mapping destination chain name => destination contract address
    mapping(string => address) public siblings;

    bytes32 constant CHAIN_ETHEREUM = keccak256(abi.encodePacked("ethereum"));
    bytes32 constant CHAIN_AVALANCHE = keccak256(abi.encodePacked("avalanche"));

    constructor(
        address _usdc,
        address _gasReceiver,
        address _circleBridge
    ) {
        usdc = IERC20(_usdc);
        circleBridge = ICircleBridge(_circleBridge);
        gasReceiver = IAxelarGasService(_gasReceiver);
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

    // Set address for this contract that deployed at another chain
    function addSibling(string memory chain_, address address_)
        external
        onlyOwner
    {
        siblings[chain_] = address_;
    }

    function nativeTradeSendTrade(
        string memory destinationChain,
        bytes memory tradeData1,
        bytes memory tradeData2,
        bytes32 traceId, // used for tracking trade progress.
        address fallbackRecipient,
        uint16 inputPos
    ) external payable isValidChain(destinationChain) {
        // Swap native token to USDC
        (uint256 nativeSwapAmount, uint256 usdcAmount) = _trade(tradeData1);

        _depositAndBurnUSDC(
            usdcAmount,
            destinationChain,
            this.siblings(destinationChain)
        );

        // encode the payload to send to the sibling contract
        bytes memory payload = abi.encode(
            tradeData,
            usdcAmount,
            traceId,
            fallbackRecipient,
            inputPos
        );

        // Pay gas to AxelarGasReceiver contract with native token to execute the sibling contract at the destination chain
        gasReceiver.payNativeGasForContractCall{
            value: msg.value - nativeSwapAmount
        }(
            address(this),
            destinationChain,
            AddressToString.toString(this.siblings(destinationChain)),
            payload,
            msg.sender
        );

        // Send all information to AxelarGateway contract.
        gateway.callContract(
            destinationChain,
            AddressToString.toString(this.siblings(destinationChain)),
            payload
        );
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

    function _tradeSrc(bytes memory tradeData)
        internal
        returns (bool success, uint256 amount)
    {
        (uint256 amountIn, address router, bytes memory data) = abi.decode(
            tradeData,
            (uint256, address, bytes)
        );
        (success, ) = router.call{value: amountIn}(data);
        return (success, amountIn);
    }

    function _trade(bytes memory tradeData1)
        private
        returns (uint256 amount, uint256 burnAmount)
    {
        // Calculate remaining usdc token in the contract
        uint256 preTradeBalance = tokenBalance(address(usdc));

        // Swap native token to USDC
        (bool success, uint256 _nativeSwapAmount) = _tradeSrc(tradeData1);

        // Revert if trade failed
        require(success, "TRADE_FAILED");

        // Calculate amount of USDC token swapped. This is the amount to be burned at the source chain.
        uint256 _usdcAmount = tokenBalance(address(usdc)) - preTradeBalance;

        // Return amount of native token swapped and amount of USDC token to be burned
        return (_nativeSwapAmount, _usdcAmount);
    }
}
