import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from './constants';
import './App.css';

function App() {
  // --- STATE MANAGEMENT ---
  const [account, setAccount] = useState("");
  const [contractBalance, setContractBalance] = useState("0");
  const [fundAmount, setFundAmount] = useState("0.01");
  const [loading, setLoading] = useState(false);

  // Inspector States
  const [ownerAddress, setOwnerAddress] = useState("");
  const [funderIndex, setFunderIndex] = useState("");
  const [foundFunder, setFoundFunder] = useState("");
  const [lookupAddress, setLookupAddress] = useState("");
  const [lookupResult, setLookupResult] = useState("0");

  // --- CORE ETHERS HELPERS ---
  const getProvider = () => {
    if (!window.ethereum) throw new Error("MetaMask not found!");
    return new ethers.BrowserProvider(window.ethereum);
  };

  const getContract = async (withSigner = false) => {
    const provider = getProvider();
    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  };

  // --- LOGIC FUNCTIONS ---
  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (err) {
      console.error("Connection failed", err);
    }
  };

  const updateBalance = async () => {
    try {
      const provider = getProvider();
      const balance = await provider.getBalance(CONTRACT_ADDRESS);
      setContractBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Balance fetch failed", err);
    }
  };

  const fund = async () => {
    if (!account) return alert("Please connect wallet first!");
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.fund({ value: ethers.parseEther(fundAmount) });
      await tx.wait(1);
      alert("Funding successful!");
      updateBalance();
    } catch (err) {
      console.error(err);
      alert("Transaction failed.");
    }
    setLoading(false);
  };

  const withdraw = async () => {
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.withdraw();
      await tx.wait(1);
      alert("Withdrawal complete!");
      updateBalance();
    } catch (err) {
      alert("Only the owner can withdraw!");
    }
    setLoading(false);
  };

  // --- GETTER FUNCTIONS ---
  const fetchOwner = async () => {
    const contract = await getContract();
    const owner = await contract.getOwner();
    setOwnerAddress(owner);
  };

  const fetchFunderByIndex = async () => {
    if (funderIndex === "") return;
    try {
      const contract = await getContract();
      const address = await contract.getFunder(funderIndex);
      setFoundFunder(address);
    } catch (e) {
      setFoundFunder("Index out of bounds");
    }
  };

  const fetchAmountByAddress = async () => {
    if (!ethers.isAddress(lookupAddress)) return alert("Invalid Address");
    const contract = await getContract();
    const amount = await contract.getAddressToAmountFunded(lookupAddress);
    setLookupResult(ethers.formatEther(amount));
  };

  useEffect(() => {
    updateBalance();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accs) => setAccount(accs[0]));
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, [account]);

  // --- UI RENDER ---
  return (
    <div className="App">
      <header>
        <h1>FundMe 2026</h1>
        <button className="btn-connect" onClick={connectWallet}>
          {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
        </button>
      </header>

      <main>
        {/* Main Funding Card */}
        <div className="card">
          <p className="pool-label">Contract Pool Balance</p>
          <h2 className="pool-value">{contractBalance} ETH</h2>
          <div className="input-group">
            <input 
              type="number" 
              step="0.01" 
              value={fundAmount} 
              onChange={(e) => setFundAmount(e.target.value)} 
            />
            <button className="btn-fund" onClick={fund} disabled={loading}>
              {loading ? "Processing..." : "Fund Me"}
            </button>
            <button className="btn-connect" onClick={connectWallet} disabled={loading}>
              connect wallet
            </button>
          </div>
        </div>

        {/* Inspector Card */}
        <div className="card inspector">
          <h3>🔍 Contract Inspector</h3>
          
          <div className="getter-row">
            <button onClick={fetchOwner}>Get Contract Owner</button>
            <p className="result-text">{ownerAddress || "0x..."}</p>
          </div>

          <div className="getter-row">
            <div className="input-group">
              <input type="number" placeholder="Index (e.g. 0)" onChange={(e) => setFunderIndex(e.target.value)} />
              <button onClick={fetchFunderByIndex}>Check Funder</button>
            </div>
            <p className="result-text">{foundFunder}</p>
          </div>

          <div className="getter-row">
            <div className="input-group">
              <input type="text" placeholder="Wallet Address" onChange={(e) => setLookupAddress(e.target.value)} />
              <button onClick={fetchAmountByAddress}>Check Amount</button>
            </div>
            <p className="result-text">{lookupResult} ETH funded</p>
          </div>
        </div>

        {/* Admin Section */}
        <div className="admin-section">
          <button className="btn-withdraw" onClick={withdraw} disabled={loading}>
            {loading ? "Withdrawing..." : "Emergency Withdraw All"}
          </button>
          <p className="note">Only the owner can execute withdrawal.</p>
        </div>
      </main>
    </div>
  );
}

export default App;