// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "forge-std/Script.sol";
import "../src/CrackPayCore.sol";
import "../src/ContactBook.sol";
import "../src/GroupManager.sol";
import "../src/PaymentProcessor.sol";
import "../src/RequestManager.sol";

contract DeployScript is Script {
    
    CrackPayCore public crackPayCore;
    ContactBook public contactBook;
    GroupManager public groupManager;
    PaymentProcessor public paymentProcessor;
    RequestManager public requestManager;
    
    function setUp() public {}

    function run() public {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy CrackPayCore (main contract)
        crackPayCore = new CrackPayCore();
        console.log("CrackPayCore deployed at:", address(crackPayCore));
        
        // Deploy ContactBook
        contactBook = new ContactBook();
        console.log("ContactBook deployed at:", address(contactBook));
        
        // Deploy GroupManager
        groupManager = new GroupManager();
        console.log("GroupManager deployed at:", address(groupManager));
        
        // Deploy PaymentProcessor (requires GroupManager address)
        paymentProcessor = new PaymentProcessor(address(groupManager));
        console.log("PaymentProcessor deployed at:", address(paymentProcessor));
        
        // Deploy RequestManager (requires GroupManager and PaymentProcessor addresses)
        requestManager = new RequestManager(address(groupManager), address(paymentProcessor));
        console.log("RequestManager deployed at:", address(requestManager));
        
        // Initialize PaymentProcessor with GroupManager address
        groupManager.setPaymentProcessor(address(paymentProcessor));
        console.log("PaymentProcessor set in GroupManager");
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n========== Deployment Summary ==========");
        console.log("CrackPayCore:", address(crackPayCore));
        console.log("ContactBook:", address(contactBook));
        console.log("GroupManager:", address(groupManager));
        console.log("PaymentProcessor:", address(paymentProcessor));
        console.log("RequestManager:", address(requestManager));
        console.log("=========================================\n");
    }
}