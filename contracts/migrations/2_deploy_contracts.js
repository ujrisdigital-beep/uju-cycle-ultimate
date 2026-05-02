const JudicialToken = artifacts.require("JudicialToken");

module.exports = function(deployer, network, accounts) {
  const owner = accounts[0];
  
  console.log("Deploying JudicialToken to", network);
  console.log("Owner address:", owner);
  
  // Deploy with owner as first authorized judge
  return deployer.deploy(JudicialToken, { from: owner })
    .then((instance) => {
      console.log("✅ JudicialToken deployed at:", instance.address);
      
      // Authorize additional judges (in production, these would be court addresses)
      if (network !== "mainnet") {
        // For testnets, authorize first 3 accounts
        return Promise.all([
          instance.authorizeJudge(accounts[1], { from: owner }),
          instance.authorizeJudge(accounts[2], { from: owner }),
          instance.authorizeJudge(accounts[3], { from: owner }),
        ]).then(() => {
          console.log("✅ Additional judges authorized");
          return instance;
        });
      }
    })
    .then((instance) => {
      // Verify deployment
      return instance.owner();
    })
    .then((ownerAddr) => {
      console.log("✅ Contract verified. Owner:", ownerAddr);
      console.log("\n📋 Next steps:");
      console.log("   1. Verify on Etherscan: npx hardhat verify --network", network, "<ADDRESS>");
      console.log("   2. Register judges via authorizeJudge()");
      console.log("   3. Integrate with backend: /opt/uju/legal/judicial_service.py");
    });
};
