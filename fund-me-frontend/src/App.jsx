import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from './constants';

function App() {
  // --- STATE MANAGEMENT ---
  const [account, setAccount] = useState("");
  const [contractBalance, setContractBalance] = useState("0");
  const [fundAmount, setFundAmount] = useState("0.05");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const [ownerAddress, setOwnerAddress] = useState("");
  const [funderIndex, setFunderIndex] = useState("");
  const [foundFunder, setFoundFunder] = useState("");
  const [lookupAddress, setLookupAddress] = useState("");
  const [lookupAmount, setLookupAmount] = useState("0");

  // --- CORE LOGIC (SAFE VERSION) ---
  const getContract = async (withSigner = false) => {
    if (!window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask");
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (err) { console.error(err); }
  };

  const updateBalance = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(CONTRACT_ADDRESS);
      setContractBalance(ethers.formatEther(balance));
    } catch (err) { console.error(err); }
  };

  const fund = async () => {
    if (!account) return connectWallet();
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.fund({ value: ethers.parseEther(fundAmount) });
      setTxHash(tx.hash); // Immediate notification
      await tx.wait(1);
      updateBalance();
    } catch (err) { alert("Transaction failed."); }
    setLoading(false);
  };

  const withdraw = async () => {
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.withdraw();
      await tx.wait(1);
      updateBalance();
    } catch (err) { alert("Only the owner can withdraw!"); }
    setLoading(false);
  };

  useEffect(() => {
    updateBalance();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accs) => setAccount(accs[0]));
    }
  }, [account]);

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8">
      
      {/* HEADER */}
      <nav className="flex justify-between items-center max-w-7xl mx-auto mb-12">
        <h1 className="font-serif text-2xl md:text-3xl">Funding Smart Contract</h1>
        <button 
          onClick={connectWallet} 
          className="btn-magic-gradient text-xs md:text-sm px-6 py-2"
        >
          {account ? `${account.slice(0, 6)}...` : "Connect"}
        </button>
      </nav>

      <main className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP SECTION: Balance and Funding */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Balance Card */}
          <div className="magic-card text-center flex flex-col justify-center py-12">
            <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Contract Balance</p>
            <h2 className="font-serif text-6xl md:text-7xl my-4">{contractBalance} <span className="text-xl text-slate-500">ETH</span></h2>
            <button onClick={withdraw} className="text-red-400 text-[10px] font-bold uppercase tracking-widest hover:underline">
              Withdraw All
            </button>
          </div>

          {/* Fund Card */}
          <div className="magic-card p-8 md:p-12 flex flex-col justify-center space-y-6">
            <h3 className="font-serif text-3xl">Support</h3>
            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-white/5 border border-white/10 rounded-2xl sm:rounded-full">
              <input 
                type="number" 
                value={fundAmount} 
                onChange={(e) => setFundAmount(e.target.value)}
                className="bg-transparent px-6 py-3 outline-none flex-grow text-xl font-medium" 
              />
              <button onClick={fund} disabled={loading} className="bg-white text-black px-8 py-3 rounded-xl sm:rounded-full font-bold">
                {loading ? "..." : "Fund Now"}
              </button>
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION: Inspector Tools */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="magic-card p-6 space-y-4">
            <h4 className="font-serif text-xl">Amount Lookup</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Address" 
                onChange={(e) => setLookupAddress(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex-grow text-xs outline-none" 
              />
              <button onClick={async () => {
                const c = await getContract();
                const amt = await c.getAddressToAmountFunded(lookupAddress);
                setLookupAmount(ethers.formatEther(amt));
              }} className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold">Check</button>
            </div>
            <p className="text-sm text-magic-purple">Total: {lookupAmount} ETH</p>
          </div>

          <div className="magic-card p-6 space-y-4">
            <h4 className="font-serif text-xl">Index Search</h4>
            <div className="flex gap-2">
              <input type="number" onChange={(e) => setFunderIndex(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-20 outline-none" />
              <button onClick={async () => {
                const c = await getContract();
                try { setFoundFunder(await c.getFunder(funderIndex)); } catch(e) { setFoundFunder("Empty"); }
              }} className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold flex-grow">Search</button>
            </div>
            <p className="text-[10px] font-mono text-slate-500 truncate">{foundFunder || "---"}</p>
          </div>

          <div className="magic-card p-6 flex flex-col justify-between items-start gap-4">
            <h4 className="font-serif text-xl">Authority</h4>
            <button onClick={async () => {
              const c = await getContract();
              setOwnerAddress(await c.getOwner());
            }} className="text-xs text-magic-purple font-bold hover:underline">Get Owner Address ↓</button>
            <p className="text-[10px] font-mono text-slate-500 truncate w-full">{ownerAddress || "---"}</p>
          </div>
        </section>
      </main>

      {/* NOTIFICATION */}
      {txHash && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-80 magic-card p-4 flex items-center gap-4 border-magic-purple/40">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <div className="flex-grow">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Transaction Sent</p>
            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-xs text-magic-purple underline">
              View on Etherscan
            </a>
          </div>
          <button onClick={() => setTxHash("")} className="text-slate-500 hover:text-white">×</button>
        </div>
      )}
    </div>
  );
}

export default App;