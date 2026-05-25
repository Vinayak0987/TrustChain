# TrustChain - Web3 Decentralized Lending Platform

TrustChain is a peer-to-peer micro-lending Decentralized Application (dApp) built for the Hackathon. It bridges local communities through a community-governed Trust Score, allowing users to lend and borrow transparently with zero traditional bank dependencies.

## 🛠️ Technology Stack
*   **Frontend:** React 19, Vite, Javascript, Vanilla CSS (Antigravity Design System)
*   **Blockchain Integration:** Ethers.js v6, Hardhat, Web3Context
*   **Smart Contracts:** Solidity (`TrustChain.sol`)
*   **Wallet Authentication:** MetaMask

---

## 🚀 How to Run the Project from Scratch

To launch the entire platform, you must spin up three components locally: The Blockchain, The Smart Contract, and The Visual Frontend. Open your `trustchain-react` directory and follow these exact steps:

### Terminal 1: Spin up the Local Blockchain
This command launches a local isolated Ethereum network and provides you with 20 pre-funded test accounts containing 10,000 fake ETH each. 
*(Leave this terminal window completely open and running in the background).*
```bash
npx hardhat node
```

### Terminal 2: Deploy the Smart Contract
Open a second terminal window. You need to deploy our core financial logic (`TrustChain.sol`) to the blockchain you just started. This custom deployment script automatically updates your React frontend with the live contract address!
```bash
node scripts/deploy.js
```

### Terminal 3: Start the React App
In the same second terminal window, spin up the local web deployment server.
```bash
npm run dev -- --port 4321
```
Your application is now fully alive! Open your browser to **http://localhost:4321**

---

## 🦊 Setting up MetaMask for Demoing

Before you test the UI, you must configure your MetaMask wallet to interact with your local development Blockchain.

**1. Point MetaMask to Localhost**
* Open MetaMask -> Click the **Network Dropdown** (top left/right).
* Click **Add Network** -> **Add a network manually**.
* **Network Name:** Localhost 8545
* **New RPC URL:** `http://127.0.0.1:8545`
* **Chain ID:** `31337`
* **Currency Symbol:** `ETH`
* **Save** and Switch to this network.

**2. Import the Hackathon Actors (Accounts)**
Look at Terminal 1 where `npx hardhat node` is running. You will see Account #0 and Account #1.
* In MetaMask, click **Add account or hardware wallet** -> **Import Account**.
* Copy the **Private Key** for `Account #0` from the terminal and paste it in. (This is identical to your **Borrower**)
* Repeat the process to import `Account #1` (This is your **Lender**).

---

## 🎬 How to Perform the Live Pitch Demo

### Part 1: The Borrower Flow
1. Open MetaMask and ensure **Account #0** is selected.
2. Go to `http://localhost:4321` and click **Get a Loan**.
3. Click **Connect MetaMask** (A popup asks for signature permission).
4. *(Behind the scenes, TrustChain auto-registers your unique address on the Blockchain and initializes your Trust Score!)*
5. Navigate the identity wizard to the Dashboard.
6. Click **Request Loan**, enter your amount/purpose, and click **Sign & Submit with Web3**.
7. MetaMask will pop up: Click **Confirm** to permanently write the loan request to the block ledger.

### Part 2: The Lender Flow
1. Open the MetaMask extension bubble and switch your active account dropdown to **Account #1**.
2. Go to the web app sidebar and click **Logout** (or refresh to back out to the Landing Page).
3. Click **Connect MetaMask** to log in as the newly injected Lender account.
4. Go to **Lend** to view the browse page. Our polling engine dynamically hits the Blockchain and renders the exact loan Account #0 just submitted!
5. Click **Fund with Web3** next to the loan.
6. MetaMask pops up: Click **Confirm**. The ETH instantly moves from Lender #1 to Borrower #0 inside the Smart Contract!

---

## 🔄 Resetting the App for Next Judge/Demo
If you want to physically disconnect to start from absolute scratch (as if presenting to a new judge):
1. Open MetaMask. Click the **Connected** status bubble or the Three Dots next to your account name.
2. Click **Connected sites** -> Find `localhost:4321` and click **Disconnect**.
3. Refresh your React Web App. The app no longer knows who you are, allowing you to show the beautiful "Connect Web3 Wallet" popup flow all over again!
