// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IAxelarForecallable} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarForecallable.sol";
import {IAxelarGasService} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {USDC} from "./USDC.sol";
import {CircleBridge} from "./CircleBridge.sol";
import "./StringAddressUtils.sol";

// Only support a native token for now.
contract CircleSwapExecutable is IAxelarForecallable, Ownable {
    error InvalidTrade();
    error InsufficientInput();
    error TradeFailed();

    event SwapSuccess(bytes32 indexed traceId, uint256 amount, bytes tradeData);

    event SwapFailed(
        bytes32 indexed traceId,
        uint256 amount,
        address refundAddress
    );

    event SwapPending(
        bytes32 indexed traceId,
        bytes32 indexed payloadHash,
        uint256 amount,
        string destinationChain,
        bytes payload
    );

    IAxelarGasService immutable gasReceiver;
    USDC public usdc;
    CircleBridge public circleBridge;

    // destination chain name => destination contract address
    mapping(string => address) public siblings;

    // destination chain name to destination chain id
    mapping(string => uint32) public destinationDomains;

    constructor(
        address _gateway,
        address _gasReceiver,
        address _usdc,
        address _circleBridge
    ) IAxelarForecallable(_gateway) Ownable() {
        gasReceiver = IAxelarGasService(_gasReceiver);
        usdc = USDC(_usdc);
        circleBridge = CircleBridge(_circleBridge);
    }

    // Prevent accidentally call, which leds to nobody is able to call `addSibling`.
    function renounceOwnership() public override {}

    modifier onlyValidChain(string memory _destinationChain) {
        require(
            siblings[_destinationChain] != address(0),
            "CircleSwapExecutable: invalid destination chain"
        );
        _;
    }

    //Use this to register additional siblings. Siblings are used to send headers to as well as to know who to trust for headers.
    function addSibling(
        string memory chain_,
        uint32 chainId,
        address address_
    ) external onlyOwner {
        siblings[chain_] = address_;
        destinationDomains[chain_] = chainId;
    }

    function _tradeSrc(bytes memory tradeData)
        internal
        returns (bool success, uint256 amount)
    {
        (
            address tokenIn,
            uint256 amountIn,
            address router,
            bytes memory data
        ) = abi.decode(tradeData, (address, uint256, address, bytes));
        if (tokenIn == address(0)) {
            (success, ) = router.call{value: amountIn}(data);
        } else {
            SafeERC20.safeTransferFrom(
                IERC20(tokenIn),
                msg.sender,
                address(this),
                amountIn
            );
            IERC20(tokenIn).approve(router, amountIn);
            (success, ) = router.call(data);
        }

        return (success, amountIn);
    }

    function _tradeDest(bytes memory tradeData, uint256 receiveAmount)
        internal
        returns (bool success)
    {
        (address tokenIn, , address router, bytes memory data) = abi.decode(
            tradeData,
            (address, uint256, address, bytes)
        );
        IERC20(tokenIn).approve(router, receiveAmount);
        (success, ) = router.call(data);
    }

    function _nativeSendTrade(
        string memory destinationChain,
        bytes memory tradeData,
        uint256 amount,
        uint256 gasAmount,
        bytes32 traceId,
        address fallbackRecipient,
        uint16 inputPos
    ) private {
        bytes memory payload = abi.encode(
            tradeData,
            amount,
            traceId,
            fallbackRecipient,
            inputPos
        );
        gasReceiver.payNativeGasForContractCall{value: gasAmount}(
            address(this),
            destinationChain,
            AddressToString.toString(this.siblings(destinationChain)),
            payload,
            msg.sender
        );
        gateway.callContract(
            destinationChain,
            AddressToString.toString(this.siblings(destinationChain)),
            payload
        );
        emit SwapPending(
            traceId,
            keccak256(payload),
            amount,
            destinationChain,
            payload
        );
    }

    function tokenBalance(address tokenAddress)
        internal
        view
        returns (uint256 balance)
    {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // function sendTrade(
    //     string memory destinationChain,
    //     string memory symbol,
    //     uint256 amount,
    //     bytes memory tradeData,
    //     bytes32 traceId,
    //     address fallbackRecipient,
    //     uint16 inputPos
    // ) external payable {
    //     address token = gateway.tokenAddresses(symbol);
    //     IERC20(token).transferFrom(msg.sender, address(this), amount);
    //     _nativeSendTrade(
    //         destinationChain,
    //         amount,
    //         amount,
    //         tradeData,
    //         traceId,
    //         fallbackRecipient,
    //         inputPos
    //     );
    // }

    // function tradeSend(
    //     string memory destinationChain,
    //     string memory destinationAddress,
    //     string memory symbol,
    //     bytes memory tradeData
    // ) external payable {
    //     address tokenAddress = gateway.tokenAddresses(symbol);
    //     uint256 preTradeBalance = tokenBalance(tokenAddress);

    //     require(_tradeSrc(tradeData), "TRADE_FAILED");

    //     uint256 swapAmount = tokenBalance(tokenAddress) - preTradeBalance;
    //     IERC20(tokenAddress).approve(address(gateway), swapAmount);
    //     gateway.sendToken(
    //         destinationChain,
    //         destinationAddress,
    //         symbol,
    //         swapAmount
    //     );
    // }
    function _trade(bytes memory tradeData1)
        private
        returns (uint256 amount, uint256 burnAmount)
    {
        uint256 preTradeBalance = tokenBalance(address(usdc));

        (bool success, uint256 _amount) = _tradeSrc(tradeData1);
        require(success, "TRADE_FAILED");

        burnAmount = tokenBalance(address(usdc)) - preTradeBalance;

        return (_amount, burnAmount);
    }

    function nativeTradeSendTrade(
        string memory destinationChain,
        bytes memory tradeData1,
        bytes memory tradeData2,
        bytes32 traceId,
        address fallbackRecipient,
        uint16 inputPos
    ) external payable onlyValidChain(destinationChain) {
        (uint256 amount, uint256 burnAmount) = _trade(tradeData1);
        bool burnSuccess = circleBridge.depositForBurn(
            burnAmount,
            this.destinationDomains(destinationChain),
            bytes32(uint256(uint160(this.siblings(destinationChain)))),
            address(this)
        );

        require(burnSuccess, "BURN_FAILED");

        _nativeSendTrade(
            destinationChain,
            tradeData2,
            burnAmount, // total burned amount (usdc)
            msg.value - amount, // total sent eth - eth for trade
            traceId,
            fallbackRecipient,
            inputPos
        );
    }

    function nativeSendTrade(
        string memory destinationChain,
        uint256 amount,
        bytes memory tradeData,
        bytes32 traceId,
        address fallbackRecipient,
        uint16 inputPos
    ) external payable onlyValidChain(destinationChain) {
        usdc.transferFrom(msg.sender, address(this), amount);
        bool success = circleBridge.depositForBurn(
            amount,
            this.destinationDomains(destinationChain),
            bytes32(uint256(uint160(this.siblings(destinationChain)))),
            address(this)
        );
        require(success, "DEPOSIT_FAILED");

        _nativeSendTrade(
            destinationChain,
            tradeData,
            amount,
            msg.value,
            traceId,
            fallbackRecipient,
            inputPos
        );
    }

    function _refund(
        bytes32 traceId,
        uint256 amount,
        address recipient
    ) internal returns (bool) {
        _giveToken(amount, recipient);
        emit SwapFailed(traceId, amount, recipient);
        return false;
    }

    function _receiveTrade(
        uint256 amount,
        bytes memory tradeData,
        bytes32 traceId,
        address fallbackRecipient,
        uint16 inputPos
    ) internal returns (bool) {
        address tokenAddressByPayload = abi.decode(tradeData, (address));
        if (tokenAddressByPayload != address(usdc))
            return _refund(traceId, amount, fallbackRecipient);

        //This hack puts the amount in the correct position.
        assembly {
            mstore(add(tradeData, inputPos), amount)
        }

        if (!_tradeDest(tradeData, amount))
            return _refund(traceId, amount, fallbackRecipient);

        emit SwapSuccess(traceId, amount, tradeData);
        return true;
    }

    function _giveToken(uint256 amount, address destination) internal {
        SafeERC20.safeTransfer(IERC20(address(usdc)), destination, amount);
    }

    function _execute(
        string memory, /*sourceChain*/
        string memory, /*sourceAddress*/
        bytes calldata payload
    ) internal override {
        (
            bytes memory data,
            uint256 amount,
            bytes32 traceId,
            address fallbackRecipient,
            uint16 inputPos
        ) = abi.decode(payload, (bytes, uint256, bytes32, address, uint16));
        _receiveTrade(amount, data, traceId, fallbackRecipient, inputPos);
    }
}
