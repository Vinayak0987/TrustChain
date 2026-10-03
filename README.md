<div align="center">

<h1><img src="./public/logo.svg" width="40" alt="Logo" style="vertical-align: middle; margin-bottom: 8px;"/> TrustChain — Decentralized Trust Economy</h1>

**A premium, web3-powered peer-to-peer micro-lending ecosystem bridging the gap between borrowers and lenders through AI identity verification, on-chain trust scores, and secure smart contracts.**

--- 

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Solidity](https://img.shields.io/badge/Solidity-Smart_Contracts-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Web3-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)](https://ethereum.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## 🌟 Overview

TrustChains is a state-of-the-art decentralized lending platform designed to unify the peer-to-peer financial journey. By connecting Borrowers, Lenders, and Community Governors into a single, cohesive ecosystem, TrustChains removes banking intermediaries and empowers users with real-time on-chain trust scoring, AI-driven identity verification, and immutable smart contract execution.

<br/>

<div align="center">

## 🏗️ System Architecture
![Architecture Diagram](./assets/Architecture_diagram.png)

</div>

---

## 🎭 Role-Based Access

TrustChains provides custom-tailored environments for key participants in the decentralized economy:

| 🧑‍💻 Borrower Portal | 🏦 Lender Dashboard | ⚖️ Community Governance |
| :--- | :--- | :--- |
| • Secure KYC & identity verification<br>• Real-time on-chain Trust Score building<br>• Request decentralized micro-loans<br>• Track EMIs and scheduled repayments | • Portfolio & investment analytics<br>• Filter high-trust borrower requests<br>• Fund loans securely via smart contracts<br>• Track financial returns and active assets | • Vouch for trusted community members<br>• Vote to approve borderline loan requests<br>• Flag and penalize fraudulent actors |

---

## 🧑‍💻 Borrower Experience

### 🔐 Secure Authentication
![Authentication Page](./assets/AuthnticationPage.png)
TrustChains features an advanced authentication system backed by Supabase. During onboarding, borrowers set up their profiles and begin their journey toward building a decentralized financial identity.

---

### 🪪 KYC AI-Powered Face Verification
![Face Verification](./assets/KYC_VERFICATION.png)
A crucial step in establishing trust. Using advanced `face-api.js` models, the system ensures real-time liveness detection and matches the user's physical presence, preventing bot accounts and sybil attacks.

---

### 📄 Document OCR Validation
![Identity Verification](./assets/Identity_verfication.png)
Seamless extraction and validation of Aadhaar and PAN documents using Optical Character Recognition (OCR) via Tesseract.js, ensuring legal compliance without manual intervention.

---

### 🦊 Web3 Wallet Integration
![MetaMask Connection](./assets/MetaMask.png)

A secure bridge to the blockchain. Users connect their MetaMask wallet to cryptographically sign loan agreements, receive funds, and execute repayments directly on the Ethereum network.

---

### 📊 Borrower Command Dashboard
![Main Dashboard](./assets/MainDashBoard.png)
The borrower’s central hub, displaying live on-chain Trust Scores, active loan statuses, pending repayments, and recent community activity in a unified, beautifully designed interface.

---

### 👤 On-Chain Trust Profile
![Profile Page](./assets/Profile_page.png)
A detailed breakdown of a user's Trust Score factors. Borrowers can track their progress across KYC verification points, historical repayment streaks, and the strength of their community endorsements.

---

### 💸 Request Decentralized Loans
![Request Loan](./assets/Request_loan.png)
A streamlined application engine enabling borrowers to request micro-loans. Users specify their required principal and purpose, while the system dynamically determines their eligible interest rate based on their active Trust Tier.

---

### 📅 EMI & Repayment Tracker
![Repayment Tracker](./assets/Repayment_Tracker.png)
A visual scheduling tool for borrowers to track upcoming EMI dates, view their remaining balance, and execute on-time repayments directly to the smart contract to boost their Trust Score.

---

## 🏦 Lender Suite

### 📈 Lender Operations Dashboard
![Lender Dashboard](./assets/Lender_dashboard.png)
A high-level operations panel built for lenders to monitor their active investments, view overall capital deployed, and track generated interest returns across their decentralized portfolio.

---

### 🔍 Browse & Filter Marketplace
![Browse Loans](./assets/Browse_Loan.png)
An intuitive discovery marketplace where lenders can browse active loan requests. The system allows sorting by Trust Score, requested amount, and community backing to ensure safe capital allocation.

---

### 💰 Secure Smart Contract Funding
![Fund Loan](./assets/Fund_loan.png)
The execution interface where lenders review loan agreements, digitally countersign, and seamlessly release funds. The capital is locked and transferred autonomously via the TrustChain Solidity smart contract.

---

## ⚖️ Community Governance

### 🤝 Community Pods & Endorsements
![Community Pods](./assets/My_community.png)
An interactive community network enabling users to form "Trust Pods." Members can vouch for each other, providing social proof that intrinsically boosts the collective Trust Score of the group.

---

### ✅ Decentralized Loan Approval
![Loan Approval](./assets/Loan_approval.png)
A democratic voting system where community members review and approve borderline or high-value loan requests, ensuring that risky loans are vetted by trusted peers before funding.

---

### 🚨 Fraud Prevention Voting
![Fraud Voting](./assets/Fraud_voting.png)
A decentralized security mechanism. The community can flag, review, and vote to penalize suspicious actors or defaulters, permanently lowering their on-chain Trust Score and protecting lenders.

---

### 📜 Immutable Transaction Ledger
![Transaction Log](./assets/Transaction_log.png)
A transparent, immutable history of all platform activity, including loan disbursements, repayments, and governance votes, securely anchored to the blockchain.

---

<br/>

<div align="center">

## 🎥 Live Demonstration

<h3><a href="https://bit.ly/43tKse1">📺 Watch the TrustChains Demo Video Here</a></h3>

<img src="./assets/QrCode.png" alt="Scan to use TrustChains" width="150" />
<br />
**Scan the QR Code to experience TrustChains on your mobile device.**

</div>

---

## 🛠️ Tech Stack & Architecture

### 💻 Frontend
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-000000?style=for-the-badge)](https://docs.ethers.org/)

* **Architecture**: Blazing fast Single Page Application (SPA) built with Vite and React 19.
* **Web3 Integration**: Ethers.js for seamless interaction with Ethereum smart contracts and MetaMask.
* **Design Language**: Modern UI/UX utilizing Tailwind CSS utility classes and custom animations.

---

### ⚙️ Backend, Storage & AI
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Face API](https://img.shields.io/badge/Face_API.js-0080FF?style=for-the-badge&logo=javascript&logoColor=white)](https://github.com/justadudewhohacks/face-api.js/)
[![Tesseract OCR](https://img.shields.io/badge/Tesseract.js-1A2B3D?style=for-the-badge&logo=javascript&logoColor=white)](https://tesseract.projectnaptha.com/)

* **Database & Auth**: Supabase PostgreSQL database for off-chain metadata, user profiles, and secure JWT authentication.
* **Identity Verification**: On-device AI processing using `face-api.js` for liveness detection and `Tesseract.js` for document OCR.

---

### ⛓️ Blockchain & Smart Contracts
[![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)](https://ethereum.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-4E5EE4?style=for-the-badge&logo=openzeppelin&logoColor=white)](https://www.openzeppelin.com/)

* **Smart Contracts**: Secure Solidity contracts utilizing OpenZeppelin libraries for loan origination, fund escrow, and repayment logic.
* **Networks**: Configured for local Ethereum testing (Hardhat Node) with deployment pipelines ready for Sepolia Testnet.
* **Development Environment**: Hardhat for local blockchain testing, contract compilation, and deployment pipelines.

---
<div align="center">
  <sub>Developed with ❤️ for TrustChains. All screenshots are authentic and captured directly from the live platform.</sub>
</div>
