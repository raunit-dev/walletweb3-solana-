import React, { useState, useEffect } from "react";
import { mnemonicToSeed, generateMnemonic } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import nacl from "tweetnacl";
// import { Eye, EyeOff } from "lucide-react";

const SOLANA_NETWORK = "https://solana-mainnet.g.alchemy.com/v2/EuBWMQhL3488mN1Got-s7v9yeHXGLRj_";

export function Solana() {
    const [mnemonic, setMnemonic] = useState("");
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [mnemonicAcknowledged, setMnemonicAcknowledged] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [publicKeys, setPublicKeys] = useState([]);
    const [balances, setBalances] = useState({});
    const [walletOption, setWalletOption] = useState(null);
    const [loading, setLoading] = useState(false);
    const connection = new Connection(SOLANA_NETWORK, "confirmed");

    const handleCreateWallet = () => {
        const newMnemonic = generateMnemonic();
        setMnemonic(newMnemonic);
        setShowMnemonic(true);
        setMnemonicAcknowledged(false);
    };

    const handleImportWallet = (importedMnemonic) => {
        setMnemonic(importedMnemonic);
    };

    const deriveKeypair = async (index) => {
        if (!mnemonic) return null;

        const seed = await mnemonicToSeed(mnemonic);
        const path = `m/44'/501'/${index}'/0'`;
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
        const keypair = Keypair.fromSecretKey(secret);
        return keypair;
    };

    const addWallet = async () => {
        setLoading(true);
        try {
            const keypair = await deriveKeypair(currentIndex);
            if (keypair) {
                setPublicKeys([...publicKeys, keypair.publicKey]);
                setCurrentIndex(currentIndex + 1);
            }
        } catch (error) {
            console.error("Error adding wallet:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchBalances = async () => {
            const newBalances = {};
            for (const publicKey of publicKeys) {
                try {
                    const balance = await connection.getBalance(new PublicKey(publicKey));
                    newBalances[publicKey.toBase58()] = balance / LAMPORTS_PER_SOL;
                } catch (error) {
                    console.error("Error fetching balance:", error);
                    newBalances[publicKey.toBase58()] = "Error fetching balance";
                }
            }
            setBalances(newBalances);
        };

        if (publicKeys.length > 0) {
            fetchBalances();
        }
    }, [publicKeys, connection]);

    return (
        <div className="max-w-lg mx-auto p-4 bg-gray-50 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-center mb-6">Solana Wallet</h2>
            
            {!walletOption ? (
                <div className="flex flex-col space-y-4">
                    <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                        onClick={() => setWalletOption("create")}
                    >
                        Create New Wallet
                    </button>
                    <button 
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
                        onClick={() => setWalletOption("import")}
                    >
                        Import Wallet
                    </button>
                </div>
            ) : walletOption === "create" ? (
                <div className="space-y-4">
                    <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full"
                        onClick={handleCreateWallet}
                    >
                        Generate Mnemonic
                    </button>
                    
                    {mnemonic && !mnemonicAcknowledged && (
                        <div className="mt-4 p-4 border border-red-500 bg-red-50 rounded">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-red-700">⚠️ Important Security Warning</h3>
                                <button 
                                    className="p-1 bg-gray-200 rounded-full"
                                    onClick={() => setShowMnemonic(!showMnemonic)}
                                >
                                    {showMnemonic ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <p className="mb-2 text-red-700">
                                Please write down your recovery phrase and keep it in a safe place. Anyone with this phrase can access your funds.
                            </p>
                            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
                                {showMnemonic ? (
                                    <p className="font-mono break-all">{mnemonic}</p>
                                ) : (
                                    <p className="text-gray-500">Click the eye icon to reveal your recovery phrase</p>
                                )}
                            </div>
                            <div className="mt-4">
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        onChange={() => setMnemonicAcknowledged(true)}
                                        className="h-4 w-4"
                                    />
                                    <span>I have written down my recovery phrase</span>
                                </label>
                            </div>
                        </div>
                    )}
                    
                    {mnemonic && mnemonicAcknowledged && (
                        <div className="mt-4">
                            <button 
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full"
                                onClick={addWallet}
                                disabled={loading}
                            >
                                {loading ? "Creating Wallet..." : "Create Wallet"}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Enter Your Recovery Phrase</label>
                        <div className="flex items-center">
                            <input
                                type={showMnemonic ? "text" : "password"}
                                className="w-full p-2 border rounded"
                                placeholder="Enter 12 or 24 word mnemonic"
                                onChange={(e) => handleImportWallet(e.target.value)}
                            />
                            <button 
                                className="ml-2 p-1 bg-gray-200 rounded-full"
                                onClick={() => setShowMnemonic(!showMnemonic)}
                            >
                                {showMnemonic ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    
                    {mnemonic && (
                        <button 
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full"
                            onClick={addWallet}
                            disabled={loading}
                        >
                            {loading ? "Importing Wallet..." : "Import Wallet"}
                        </button>
                    )}
                </div>
            )}

            {publicKeys.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Your Wallets</h3>
                    <div className="space-y-3">
                        {publicKeys.map((publicKey, index) => (
                            <div key={publicKey.toBase58()} className="p-3 bg-white border rounded-lg shadow-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">Wallet {index + 1}</span>
                                    <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                        {balances[publicKey.toBase58()] ? 
                                            `${balances[publicKey.toBase58()].toFixed(4)} SOL` : 
                                            "Loading..."}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Address:</p>
                                    <p className="font-mono text-sm break-all">{publicKey.toBase58()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {walletOption && (
                <button 
                    className="mt-6 text-blue-600 hover:text-blue-800 text-sm"
                    onClick={() => {
                        setWalletOption(null);
                        setMnemonic("");
                        setShowMnemonic(false);
                        setMnemonicAcknowledged(false);
                    }}
                >
                    ← Back to options
                </button>
            )}
        </div>
    );
}