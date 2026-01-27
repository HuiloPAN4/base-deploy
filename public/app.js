import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import { ABI, BYTECODE } from "./contract.js";

const connectButton = document.getElementById("connectButton");
const deployButton = document.getElementById("deployButton");
const nameInput = document.getElementById("nameInput");
const symbolInput = document.getElementById("symbolInput");
const contractAddressInput = document.getElementById("contractAddressInput");
const contractAddressValue = document.getElementById("contractAddressValue");
const ethBalanceValue = document.getElementById("ethBalanceValue");
const ethBalanceStatus = document.getElementById("ethBalanceStatus");
const balanceHint = document.getElementById("balanceHint");
const refreshButton = document.getElementById("refreshButton");
const mintButton = document.getElementById("mintButton");
const mintToInput = document.getElementById("mintToInput");
const recipientValue = document.getElementById("recipientValue");
const tokenIdInput = document.getElementById("tokenIdInput");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");

const BASE_CHAIN_ID = "0x2105";
const EXPLORER_BASE_URL = "https://basescan.org";
const MIN_GAS_WEI = ethers.parseEther("0.0001");

const BASE_MAINNET_PARAMS = {
  chainId: BASE_CHAIN_ID,
  chainName: "Base",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: [EXPLORER_BASE_URL],
};

const state = {
  connected: false,
  deployedAddress: null,
  walletAddress: null,
};

function setStatus(message) {
  statusEl.textContent = `Status: ${message}`;
}

function log(message) {
  logEl.textContent += `${message}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setInputValue(input, value) {
  input.value = value;
  input.setAttribute("value", value);
  input.placeholder = value;
}

function setContractAddress(address) {
  state.deployedAddress = address;
  setInputValue(contractAddressInput, address);
  if (contractAddressValue) {
    contractAddressValue.textContent = address;
  }
  localStorage.setItem("lastContractAddress", address);
  updateActionState();
}

function setRecipient(address) {
  setInputValue(mintToInput, address);
  if (recipientValue) {
    recipientValue.textContent = address;
  }
  localStorage.setItem("lastRecipient", address);
}

function loadFromStorage() {
  const storedAddress = localStorage.getItem("lastContractAddress");
  if (storedAddress && ethers.isAddress(storedAddress)) {
    setContractAddress(storedAddress);
  }

  const storedRecipient = localStorage.getItem("lastRecipient");
  if (storedRecipient && ethers.isAddress(storedRecipient)) {
    setRecipient(storedRecipient);
  }
}

function updateActionState() {
  const addressValue = state.deployedAddress || contractAddressInput.value.trim();
  const hasValidAddress =
    addressValue && ethers.isAddress(addressValue.trim());
  const enabled = hasValidAddress;

  mintButton.disabled = !enabled;
  refreshButton.disabled = !state.connected;
}

function getTokenMetadata() {
  const name = nameInput.value.trim();
  const symbol = symbolInput.value.trim();

  if (!name) {
    throw new Error("Token name is required.");
  }
  if (!symbol) {
    throw new Error("Token symbol is required.");
  }

  return { name, symbol };
}

function getContractAddress() {
  const value = contractAddressInput.value.trim() || state.deployedAddress;

  if (!value) {
    throw new Error("Contract address is required.");
  }
  if (!ethers.isAddress(value)) {
    throw new Error("Invalid contract address.");
  }

  return value;
}

function getMintDetails() {
  const to = mintToInput.value.trim();
  const tokenIdValue = tokenIdInput.value.trim();

  if (!to) {
    throw new Error("Recipient address is required.");
  }
  if (!ethers.isAddress(to)) {
    throw new Error("Invalid recipient address.");
  }
  if (!tokenIdValue) {
    throw new Error("Token ID is required.");
  }

  let tokenId;
  try {
    tokenId = BigInt(tokenIdValue);
  } catch (error) {
    throw new Error("Token ID must be an integer.");
  }
  if (tokenId < 0n) {
    throw new Error("Token ID must be non-negative.");
  }

  return { to, tokenId };
}

function setBalanceStatus(element, status, label) {
  element.textContent = label;
  element.classList.remove("ok", "low");
  if (status) {
    element.classList.add(status);
  }
}

async function refreshBalances() {
  if (!state.connected) {
    balanceHint.textContent = "Connect wallet to check balances.";
    setBalanceStatus(ethBalanceStatus, null, "—");
    ethBalanceValue.textContent = "—";
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  state.walletAddress = address;

  const ethBalance = await provider.getBalance(address);

  const ethFormatted = ethers.formatEther(ethBalance);

  ethBalanceValue.textContent = `${ethFormatted} ETH`;

  if (ethBalance >= MIN_GAS_WEI) {
    setBalanceStatus(ethBalanceStatus, "ok", "OK");
  } else {
    setBalanceStatus(ethBalanceStatus, "low", "LOW");
  }

  const hints = [];
  if (ethBalance < MIN_GAS_WEI) {
    hints.push("Not enough ETH for gas.");
  }
  balanceHint.textContent =
    hints.length > 0 ? hints.join(" ") : "Balances look sufficient.";
}

async function requireWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected. Install a wallet extension.");
  }
}

async function ensureBaseMainnet() {
  const currentChain = await window.ethereum.request({ method: "eth_chainId" });
  if (currentChain === BASE_CHAIN_ID) {
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }],
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BASE_MAINNET_PARAMS],
      });
    } else {
      throw error;
    }
  }
}

async function connectWallet() {
  setStatus("connecting wallet...");
  await requireWallet();
  await window.ethereum.request({ method: "eth_requestAccounts" });
  await ensureBaseMainnet();

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  state.connected = true;
  state.walletAddress = address;
  deployButton.disabled = false;
  log(`Wallet: ${address}`);
  setStatus("wallet connected");

  setRecipient(address);

  updateActionState();
  await refreshBalances();
}

async function deployContract() {
  setStatus("deploying contract...");
  deployButton.disabled = true;

  if (!state.connected) {
    await connectWallet();
  }

  if (!BYTECODE || BYTECODE === "0x") {
    throw new Error("Bytecode missing. Run npm run compile first.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const factory = new ethers.ContractFactory(ABI, BYTECODE, signer);
  const { name, symbol } = getTokenMetadata();

  log(`Deploying ERC721Mintable: ${name} (${symbol})`);
  log("Sending deployment transaction...");
  const contract = await factory.deploy(name, symbol);
  const tx = contract.deploymentTransaction();
  if (tx?.hash) {
    log(`Deployment tx: ${tx.hash}`);
  }

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const signerAddress = await signer.getAddress();
  setContractAddress(address);
  log(`Deployed to: ${address}`);
  log(`Explorer: ${EXPLORER_BASE_URL}/address/${address}`);
  setRecipient(signerAddress);
  setStatus("deployed");
  deployButton.disabled = false;
  updateActionState();
  await refreshBalances();
}

async function mintToken() {
  setStatus("minting...");
  mintButton.disabled = true;

  if (!state.connected) {
    await connectWallet();
  }

  const contractAddress = getContractAddress();
  const { to, tokenId } = getMintDetails();
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, ABI, signer);

  log(`Minting token ${tokenId.toString()} to ${to}...`);
  const tx = await contract.mint(to, tokenId);
  log(`Mint tx: ${tx.hash}`);
  await tx.wait();
  log("Mint complete.");
  setStatus("minted");
  updateActionState();
}

function handleError(error) {
  console.error(error);
  setStatus("error");
  log(error?.message || String(error));
  deployButton.disabled = false;
  updateActionState();
}

connectButton.addEventListener("click", () =>
  connectWallet().catch(handleError)
);

deployButton.addEventListener("click", () =>
  deployContract().catch(handleError)
);

mintButton.addEventListener("click", () => mintToken().catch(handleError));
refreshButton.addEventListener("click", () =>
  refreshBalances().catch(handleError)
);

setStatus("idle");
loadFromStorage();
updateActionState();
refreshBalances().catch(() => {});
