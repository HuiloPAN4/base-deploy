# Base Deploy Button Demo

This repo follows the Base "Deploy on Base" quickstart and adds a small web UI
to deploy the ERC721Mintable contract with MetaMask on Base Sepolia.

## Quickstart (Foundry)

1. Create a project directory (already done):
   `mkdir my-base-project && cd my-base-project`
2. Install Foundry (bash shell):
   `curl -L https://foundry.paradigm.xyz | bash`
   `foundryup`
3. Initialize Foundry (already scaffolded here):
   `forge init`
4. Create `.env` from `.env.example` and add RPC URLs.
5. Load environment variables:
   - Bash: `source .env`
   - PowerShell:
     `Get-Content .env | ForEach-Object { if ($_ -match '^(\\w+)=(.*)$') { $name = $matches[1]; $value = $matches[2].Trim('\"'); Set-Item -Path "Env:$name" -Value $value } }`
6. Import a deployer key:
   `cast wallet import deployer --interactive`
7. Deploy to Base Sepolia:
   `forge create ./src/ERC721Mintable.sol:ERC721Mintable --rpc-url $BASE_SEPOLIA_RPC_URL --account deployer --constructor-args "BASED" "BASED" --broadcast`
8. Verify:
   `cast call $COUNTER_CONTRACT_ADDRESS "name()(string)" --rpc-url $BASE_SEPOLIA_RPC_URL`

## Web deploy button

1. Install dependencies: `npm install`
2. Compile contract for the UI: `npm run compile`
3. Start the local server: `npm run dev`
4. Open `http://localhost:5173` and click "Connect wallet", then "Deploy contract".
5. Paste or confirm the contract address, click "Approve 0.1 USDC", then "Mint".

## Faucets (Base Sepolia)

- Get test ETH: https://www.alchemy.com/faucets/base-sepolia
- Get test USDC: https://faucet.circle.com/

## Approve USDC (CLI)

The contract charges 0.1 USDC on mint. Approve once per wallet:

`cast send 0x036CbD53842c5426634e7929541eC2318f3dCF7e "approve(address,uint256)" $COUNTER_CONTRACT_ADDRESS 100000 --rpc-url $BASE_SEPOLIA_RPC_URL --account deployer`

## Notes

- Network: Base Sepolia (chain id 84532).
- Minting charges 0.1 USDC on Base Sepolia (0x036CbD53842c5426634e7929541eC2318f3dCF7e).
- Do not commit `.env` or private keys.
- Make sure your wallet has Base Sepolia ETH for gas.
