// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract USDC is ERC20Burnable, AccessControl {
    // Create a new role identifier for the minter role
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor() ERC20("Circle USDC", "USDC") {
        _mint(msg.sender, 1000000000000000000000000);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function setMinterRole(address minter) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _setupRole(MINTER_ROLE, minter);
    }

    function setBurnerRole(address burner) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _setupRole(BURNER_ROLE, burner);
    }

    function mint(address to, uint256 amount) public {
        // Check that the calling account has the minter role
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        require(hasRole(BURNER_ROLE, msg.sender), "Caller is not a burner");
        _burn(from, amount);
    }
}
