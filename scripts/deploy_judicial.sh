#!/bin/bash
# =============================================================================
# Deploy Judicial Token Smart Contract to Ethereum Network
# =============================================================================

set -e

NETWORK="${1:-sepolia}"
CONTRACT_PATH="contracts/JudicialToken.sol"
MIGRATION_PATH="contracts/migrations/2_deploy_contracts.js"

echo "⚖️ Deploying Judicial Token to ${NETWORK}..."
echo "============================================================================="

# Check prerequisites
if ! command -v npx &> /dev/null; then
    echo "❌ Hardhat not found. Installing..."
    npm install -g hardhat
fi

# Create Hardhat project if not exists
if [ ! -f "hardhat.config.js" ]; then
    echo "📦 Initializing Hardhat project..."
    npx hardhat init --force
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install @nomicfoundation/hardhat-ethers ethers

# Setup environment
if [ ! -f ".env" ]; then
    echo "🔐 Creating .env file..."
    cat > .env << EOF
INFURA_API_KEY=${INFURA_API_KEY:-""}
ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY:-""}
PRIVATE_KEY=${PRIVATE_KEY:-0xac0974bec39db647ce7a5e3c8b0d26e6a3b8d8b8129b4c9f6cfa61bca0d1}
EOF
fi

# Compile contract
echo "🔨 Compiling JudicialToken.sol..."
npx hardhat compile

# Deploy
echo "🚀 Deploying to ${NETWORK}..."
npx hardhat run "$MIGRATION_PATH" --network "$NETWORK"

# Verify on Etherscan (if not local)
if [ "$NETWORK" != "localhost" ]; then
    echo "🔍 Verifying on Etherscan..."
    CONTRACT_ADDRESS=$(grep -A1 "JudicialToken deployed at:" /tmp/deploy.log | tail -1)
    npx hardhat verify --network "$NETWORK" "$CONTRACT_ADDRESS"
fi

echo ""
echo "✅ JUDICIAL TOKEN DEPLOYMENT COMPLETE"
echo "============================================================================="
echo "📋 Next steps:"
echo "   1. Set JUDICIAL_CONTRACT_ADDRESS in your .env"
echo "   2. Update backend/services/judicial_service.py with contract address"
echo "   3. Authorize judges: npx hardhat console --network $NETWORK"
echo "      > const jt = await JudicialToken.attach('$CONTRACT_ADDRESS')"
echo "      > await jt.authorizeJudge('0x...')"
echo ""
