# Base Deploy Button Demo (Mainnet)

This repo follows the Base "Deploy on Base" quickstart and adds a small web UI
to deploy the ERC721Mintable contract with MetaMask on Base Mainnet.

## Web deploy button

1. Install dependencies: `npm install`
2. Compile contract for the UI: `npm run compile`
3. Start the local server: `npm run dev`
4. Open `http://localhost:5174` and click "Connect wallet", then "Deploy contract".
5. Paste or confirm the contract address, then "Mint".

## Notes

- Network: Base Mainnet (chain id 8453).
- Minting is free; only gas in ETH is required.
- Do not commit `.env` or private keys.
- Make sure your wallet has Base Mainnet ETH for gas.
