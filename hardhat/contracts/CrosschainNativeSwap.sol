// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IAxelarForecallable} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarForecallable.sol";
import {IAxelarGasService} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol";
import {IAxelarGateway} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGateway.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICircleBridge} from "./ICircleBridge.sol";
import "./StringAddressUtils.sol";

contract CrosschainNativeSwap is IAxelarForecallable, Ownable {
    IERC20 public usdc;
    ICircleBridge public circleBridge;
    IAxelarGasService immutable gasReceiver;

    // mapping chain name => domain number;
    mapping(string => uint32) public circleDestinationDomains;
    // mapping destination chain name => destination contract address
    mapping(string => address) public siblings;

    bytes32 constant CHAIN_ETHEREUM = keccak256(abi.encodePacked("ethereum-2"));
    bytes32 constant CHAIN_AVALANCHE = keccak256(abi.encodePacked("avalanche"));

    error InvalidTrade();
    error InsufficientInput();
    error TradeFailed();

    event SwapSuccess(bytes32 indexed traceId, uint256 amount, bytes tradeData);

    event SwapFailed(
        bytes32 indexed traceId,
        uint256 amount,
        address refundAddress
    );

    constructor(
        address _usdc,
        address _gasReceiver,
        address _gateway,
        address _circleBridge
    ) IAxelarForecallable(_gateway) Ownable() {
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

    /**
     * @dev Swap native token to USDC, burn it, and send swap payload to AxelarGateway contract
     * @param destinationChain Name of the destination chain
     * @param srcTradeData Trade data for the first swap
     * @param destTradeData Trade data for the second swap
     * @param traceId Trace ID of the swap
     * @param fallbackRecipient Recipient address to receive USDC token if the swap fails
     * @param inputPos Position of the input token in destTradeData
     */
    function nativeTradeSendTrade(
        string memory destinationChain,
        bytes memory srcTradeData,
        bytes memory destTradeData,
        bytes32 traceId,
        address fallbackRecipient,
        uint16 inputPos
    ) external payable isValidChain(destinationChain) {
        // Swap native token to USDC
        (uint256 nativeSwapAmount, uint256 usdcAmount) = _trade(srcTradeData);

        _depositAndBurnUSDC(
            usdcAmount,
            destinationChain,
            this.siblings(destinationChain)
        );

        // encode the payload to send to the sibling contract
        bytes memory payload = abi.encode(
            destTradeData,
            usdcAmount,
            traceId,
            fallbackRecipient,
            inputPos
        );

        // Pay gas to AxelarGasReceiver contract with native token to execute the sibling contract at the destination chain
        _payGasAndCallContract(
            destinationChain,
            payload,
            msg.value - nativeSwapAmount
        );
    }

    function _payGasAndCallContract(
        string memory destinationChain,
        bytes memory payload,
        uint256 fee
    ) private {
        gasReceiver.payNativeGasForContractCall{value: fee}(
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
        uint256 preTradeBalance = IERC20(address(usdc)).balanceOf(
            address(this)
        );

        // Swap native token to USDC
        (bool success, uint256 _nativeSwapAmount) = _tradeSrc(tradeData1);

        // Revert if trade failed
        require(success, "TRADE_FAILED");

        // Calculate amount of USDC token swapped. This is the amount to be burned at the source chain.
        uint256 _usdcAmount = IERC20(address(usdc)).balanceOf(address(this)) -
            preTradeBalance;

        // Return amount of native token swapped and amount of USDC token to be burned
        return (_nativeSwapAmount, _usdcAmount);
    }

    function _refund(
        bytes32 traceId,
        uint256 amount,
        address recipient
    ) internal {
        SafeERC20.safeTransfer(IERC20(address(usdc)), recipient, amount);
        emit SwapFailed(traceId, amount, recipient);
    }

    // This function will be called by Axelar Executor service.
    function _execute(
        string memory, /*sourceChain*/
        string memory, /*sourceAddress*/
        bytes calldata payload
    ) internal override {
        // Decode payload
        (
            bytes memory tradeData,
            uint256 usdcAmount,
            bytes32 traceId,
            address fallbackRecipient,
            uint16 inputPos
        ) = abi.decode(payload, (bytes, uint256, bytes32, address, uint16));

        // Decode trade data to get srcToken, router and swap data
        (address srcToken, , address router, bytes memory data) = abi.decode(
            tradeData,
            (address, uint256, address, bytes)
        );

        // If the input token is not USDC, refund USDC to the user.
        if (srcToken != address(usdc))
            return _refund(traceId, usdcAmount, fallbackRecipient);

        // This hack puts the amount in the correct position.
        assembly {
            mstore(add(tradeData, inputPos), usdcAmount)
        }

        // Approve USDC to the router contract
        IERC20(srcToken).approve(router, usdcAmount);

        // Swap USDC to native token
        (bool swapSuccess, ) = router.call(data);

        // If swap failed, refund USDC to the user.
        if (!swapSuccess)
            return _refund(traceId, usdcAmount, fallbackRecipient);

        // Emit success event so that our application can be notified.
        emit SwapSuccess(traceId, usdcAmount, tradeData);
    }
}
