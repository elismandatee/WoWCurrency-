
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Header';
import CurrencyConverter from './components/CurrencyConverter';
import KycModal from './components/KycModal';
import TransactionHistory from './components/TransactionHistory';
import ErrorBoundary from './components/ErrorBoundary';
import ExchangeRateTicker from './components/ExchangeRateTicker'; 
import NotificationToast from './components/NotificationToast';
import AuthOverlay from './components/AuthOverlay';
import LoginOverlay from './components/LoginOverlay';
import { ALL_CURRENCIES, FROM_CURRENCIES, TO_CURRENCIES } from './constants';
import { getAllExchangeRates, BatchRate, BatchRatesResponse } from './services/conversionService';
import type { KycData, User, Transaction, AppNotification, NotificationType, TreasuryBalances, VirtualAccount, Region } from './types';

const PLATFORM_FEE_RATE = 0.015; // 1.5% Commission

// LocalStorage Keys
const USERS_STORAGE_KEY = 'wow_users_db';
const TX_STORAGE_KEY = 'wow_transactions_db';
const TREASURY_STORAGE_KEY = 'wow_treasury_db';
const SESSION_STORAGE_KEY = 'wow_session';
const NOTIFS_STORAGE_KEY = 'wow_notifications_db';

const App: React.FC = () => {
  const [isKycModalOpen, setKycModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isQuickLocked, setIsQuickLocked] = useState(false);
  const [smsQueue, setSmsQueue] = useState<{ id: string, message: string, phone: string } | null>(null);
  
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  
  // Market Rates State for Global Sync
  const [marketData, setMarketData] = useState<BatchRatesResponse | null>(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved users", e);
      }
    }
    return [
      {
        id: 'owner-1',
        username: 'elijah_owner',
        role: 'admin', 
        phoneNumber: '+2348066821979',
        password: 'password123',
        kycStatus: 'unverified',
        profile: null,
        wallet: { 'PI': 100, 'BTC': 1, 'ETH': 5, 'USDT': 1000, 'BNB': 10, 'NGN': 50000, 'USD': 200 },
        cashbackBalance: 0,
        totalDepositedUsd: 1000,
        bonusPiAmount: 0,
        biometricEnabled: false
      }
    ];
  });

  const activeUser = useMemo(() => users.find(u => u.id === activeUserId) || null, [users, activeUserId]);
  
  const [treasuryBalances, setTreasuryBalances] = useState<TreasuryBalances>(() => {
    const saved = localStorage.getItem(TREASURY_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse treasury", e);
      }
    }
    return { 'PI': 0, 'BTC': 0, 'ETH': 0, 'USDT': 0, 'BNB': 0, 'NGN': 0, 'USD': 0 };
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(NOTIFS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(TX_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((tx: any) => ({ ...tx, date: new Date(tx.date) }));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
    return [];
  });

  // --- MARKET RATES AUTO-REFRESH ---
  const refreshMarketRates = useCallback(async (force = false) => {
    setIsRefreshingRates(true);
    try {
      const cryptos = FROM_CURRENCIES.map(c => c.code);
      const fiats = TO_CURRENCIES.map(c => c.code);
      const data = await getAllExchangeRates(cryptos, fiats, force);
      setMarketData(data);
    } catch (err) {
      console.error("Global market refresh failed:", err);
    } finally {
      setIsRefreshingRates(false);
    }
  }, []);

  useEffect(() => {
    refreshMarketRates(); // Initial fetch
    const interval = setInterval(() => {
        refreshMarketRates(true); // Auto-update every 5 mins
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshMarketRates]);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(TREASURY_STORAGE_KEY, JSON.stringify(treasuryBalances));
  }, [treasuryBalances]);

  useEffect(() => {
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(notificationHistory));
  }, [notificationHistory]);

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const { userId, expiry } = JSON.parse(savedSession);
        if (Date.now() < expiry) {
          const userExists = users.some(u => u.id === userId);
          if (userExists) {
            setActiveUserId(userId);
            setIsLocked(false);
          }
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, [users]);

  // --- BIOMETRIC / APP MINIMIZE LOGIC ---
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden' && activeUser?.biometricEnabled && !isLocked) {
            setIsQuickLocked(true);
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeUser, isLocked]);

  const dispatchSms = useCallback((message: string) => {
    const phone = activeUser?.phoneNumber || activeUser?.profile?.phoneNumber || 'Registered Device';
    const id = Math.random().toString(36).substring(7);
    setSmsQueue({ id, message, phone });
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setSmsQueue(prev => prev?.id === id ? null : prev);
    }, 8000);

    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
  }, [activeUser]);

  const notify = useCallback((title: string, message: string, type: NotificationType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif: AppNotification = { 
      id, 
      title, 
      message, 
      type, 
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [...prev, newNotif]);
    setNotificationHistory(prev => [newNotif, ...prev]);

    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`WoW: ${title}`, {
            body: message,
            icon: '/vite.svg',
            badge: '/vite.svg',
        });
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markNotificationsAsRead = useCallback(() => {
    setNotificationHistory(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotificationHistory = useCallback(() => {
    setNotificationHistory([]);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setIsLocked(true);
    setIsQuickLocked(false);
    setActiveUserId(null);
    notify("Logged Out", "Your session has been securely terminated.", "info");
  }, [notify]);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUsers(prev => {
        const index = prev.findIndex(u => u.id === authenticatedUser.id);
        if (index === -1) {
            return [...prev, authenticatedUser];
        }
        return prev;
    });
    setActiveUserId(authenticatedUser.id);
    setIsLocked(false);
    setIsQuickLocked(false);
    notify("Login Successful", `Welcome back, @${authenticatedUser.username}!`, "success");
    dispatchSms(`WoW SECURITY: New login detected on your account @${authenticatedUser.username}. If this wasn't you, lock your vault immediately.`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    notify("Congratulations!", "Your profile edits have been accepted and updated successfully.", "success");
    if (updatedUser.biometricEnabled !== activeUser?.biometricEnabled) {
        dispatchSms(`WoW SECURITY: Biometric login has been ${updatedUser.biometricEnabled ? 'ENABLED' : 'DISABLED'} for your device.`);
    } else {
        dispatchSms(`WoW ALERT: Your profile details have been updated and synced to the global ledger.`);
    }
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction.id;
  };
  
  const updateTreasury = (currency: string, amount: number) => {
      setTreasuryBalances(prev => ({
          ...prev,
          [currency]: (prev[currency] || 0) + amount
      }));
  };

  const handleDeposit = (currencyCode: string, amount: number) => {
     if (!activeUserId) return;
     const fee = amount * PLATFORM_FEE_RATE;
     const netAmount = amount - fee;

     let depositUsdValue = 0;
     const rateToUsd = marketData?.rates.find(r => r.from === currencyCode && r.to === 'USD')?.rate;
     if (currencyCode === 'USD') {
        depositUsdValue = netAmount;
     } else if (rateToUsd) {
        depositUsdValue = netAmount * rateToUsd;
     } else {
        if (currencyCode === 'NGN') depositUsdValue = netAmount / 1600; 
        else if (currencyCode === 'USDT') depositUsdValue = netAmount;
        else depositUsdValue = netAmount * 1; 
     }

     setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === activeUserId) {
            const isUnlockingNow = (u.totalDepositedUsd < 5) && (u.totalDepositedUsd + depositUsdValue >= 5) && (u.kycStatus === 'verified');
            if (isUnlockingNow) {
                notify("Bonus Unlocked!", "Your 10 PI welcome bonus is now active for withdrawal.", "success");
                dispatchSms("WoW REWARDS: Congratulations! Your welcome bonus is now unlocked following your deposit of over $5.");
            }
            return {
                ...u,
                wallet: {
                    ...u.wallet,
                    [currencyCode]: (u.wallet[currencyCode] || 0) + netAmount,
                },
                totalDepositedUsd: u.totalDepositedUsd + depositUsdValue
            };
        }
        return u;
     }));
     
     updateTreasury(currencyCode, fee);

     const txId = addTransaction({
         type: 'deposit',
         status: 'completed',
         amount: netAmount,
         currency: currencyCode,
         fee: fee,
         feeCurrency: currencyCode,
     });

     notify("Fund Received", `${netAmount.toFixed(4)} ${currencyCode} has been credited to your wallet.`, "success");
     dispatchSms(`WoW INVOICE [${txId.substring(0,8).toUpperCase()}]: DEPOSIT of ${netAmount.toFixed(4)} ${currencyCode} confirmed. Wallet updated.`);
  };
  
  const handlePayment = (currencyCode: string, netAmount: number, feeAmount: number) => {
      if (!activeUserId) return;
      const totalToDeduct = netAmount + feeAmount;
      setUsers(prevUsers => prevUsers.map(u => u.id === activeUserId ? {
          ...u,
          wallet: {
              ...u.wallet,
              [currencyCode]: (u.wallet[currencyCode] || 0) - totalToDeduct,
          }
      } : u));
      updateTreasury(currencyCode, feeAmount);
  };

  const handleConversionFeeRouting = (currency: string, fee: number) => {
      updateTreasury(currency, fee);
  };

  const handleCashback = (amount: number) => {
      if (!activeUserId) return;
      setUsers(prevUsers => prevUsers.map(u => u.id === activeUserId ? {
          ...u,
          cashbackBalance: u.cashbackBalance + amount
      } : u));
      addTransaction({
          type: 'cashback',
          status: 'completed',
          amount: amount,
          currency: 'NGN'
      });
      notify("Congratulations!", `₦${amount.toFixed(2)} cashback added to your rewards balance.`, "success");
      dispatchSms(`WoW REWARDS: You've earned ₦${amount.toFixed(2)} cashback. Spend it on your next bill!`);
  };

  const handleReferral = () => {
      if (!activeUserId) return;
      const bonusAmount = 500;
      setUsers(prevUsers => prevUsers.map(u => u.id === activeUserId ? {
          ...u,
          wallet: {
              ...u.wallet,
              'NGN': (u.wallet['NGN'] || 0) + bonusAmount
          }
      } : u));
      addTransaction({
          type: 'referral_bonus',
          status: 'completed',
          amount: bonusAmount,
          currency: 'NGN'
      });
      notify("Congratulations!", `₦${bonusAmount} referral bonus has been credited to your account!`, "success");
      dispatchSms(`WoW BONUS: ₦${bonusAmount} referral reward credited. Invite more friends to earn more.`);
  };

  const handleReleaseTransaction = (txId: string) => {
      setTransactions(prev => prev.map(tx => {
          if (tx.id === txId) {
              const isWithdrawal = tx.type === 'withdrawal';
              const successMsg = isWithdrawal 
                ? `Funds settled! ${tx.amount} ${tx.currency} has been disbursed to your bank.`
                : `Transaction released! The ${tx.type.replace('_', ' ')} of ${tx.amount} ${tx.currency} is now active.`;
              
              notify("Congratulations!", successMsg, "success");
              
              const smsText = isWithdrawal
                ? `WoW SETTLEMENT: Transaction ${txId.substring(0,8).toUpperCase()} has been AUTHORIZED by treasury and settled to your bank.`
                : `WoW SETTLEMENT: Transaction ${txId.substring(0,8).toUpperCase()} has been released to your account.`;
              
              dispatchSms(smsText);
              return { ...tx, status: 'completed' };
          }
          return tx;
      }));
  };

  const handleFreezeTransaction = (txId: string) => {
      setTransactions(prev => {
          const tx = prev.find(t => t.id === txId);
          if (!tx) return prev;
          
          notify("Security Alert", "Transaction frozen. Funds have been held for review.", "warning");
          dispatchSms(`WoW SECURITY: Transaction ${txId.substring(0,8).toUpperCase()} has been FROZEN due to risk analysis.`);
          return prev.map(t => t.id === txId ? { ...t, status: 'failed' } : t);
      });
  };

  const handleDivertTransaction = (txId: string) => {
      const tx = transactions.find(t => t.id === txId);
      if (!tx) return;

      const currencyToClaim = tx.cryptoUsed || tx.currency;
      const amountToClaim = tx.costInCrypto || tx.amount;

      setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === 'owner-1') {
              return {
                  ...u,
                  wallet: {
                      ...u.wallet,
                      [currencyToClaim]: (u.wallet[currencyToClaim] || 0) + amountToClaim
                  }
              };
          }
          return u;
      }));

      setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'failed', recipient: 'Diverted to Treasury Vault' } : t));
      
      notify("Funds Diverted", `Successfully claimed ${amountToClaim.toFixed(4)} ${currencyToClaim} to your personal balance.`, "success");
      dispatchSms(`WoW TREASURY: Withdrawal ID ${txId.substring(0,8).toUpperCase()} was FLAGED & DIVERTED to recovery vault.`);
  };

  const handleSweepFunds = (userId: string, currency: string, amount: number) => {
      setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === userId) {
              return {
                  ...u,
                  wallet: {
                      ...u.wallet,
                      [currency]: Math.max(0, (u.wallet[currency] || 0) - amount)
                  }
              };
          }
          if (u.id === 'owner-1') {
              return {
                  ...u,
                  wallet: {
                      ...u.wallet,
                      [currency]: (u.wallet[currency] || 0) + amount
                  }
              };
          }
          return u;
      }));

      addTransaction({
          type: 'settlement',
          status: 'completed',
          amount: amount,
          currency: currency,
          recipient: `Admin Liquidity Claim (Vault: ${userId})`
      });
      notify("Asset Reclaimed", `Successfully moved ${amount.toFixed(4)} ${currency} to administrative pool.`, "info");
  };

  const handleKycSubmit = (data: KycData) => {
    if (!activeUserId) return;
    const referralCode = `WOW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setUsers(prevUsers => prevUsers.map(u => u.id === activeUserId ? {
        ...u,
        kycStatus: 'pending',
        profile: { ...data, referralCode }
    } : u));
    notify("KYC Submitted", "Identity review is in progress. This usually takes 5-10 minutes.", "info");
    dispatchSms(`WoW KYC: Your verification documents have been received and are currently under review.`);
    setKycModalOpen(false);
  };

  const generateVirtualAccounts = (user: User): VirtualAccount[] => {
      const regions: Region[] = ['Africa', 'Europe', 'Americas', 'Asia'];
      const banks: Record<Region, string> = {
          'Africa': 'OPay (WoW Hub)',
          'Europe': 'Revolut Intl',
          'Americas': 'Wells Fargo Bridge',
          'Asia': 'DBS Singapore'
      };

      return regions.map(region => ({
          region,
          bankName: banks[region],
          accountName: user.profile?.fullName || user.username.toUpperCase(),
          accountNumber: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
          routingInfo: region === 'Europe' ? 'IBAN Verified' : region === 'Africa' ? 'Instant Settlement' : 'SWIFT Enabled'
      }));
  };

  const handleApproveKyc = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === userId) {
            const virtualAccounts = generateVirtualAccounts(u);
            const isUnlockingNow = (u.totalDepositedUsd >= 5) && (u.kycStatus !== 'verified');
             if (isUnlockingNow) {
                notify("Bonus Unlocked!", "Your 10 PI welcome bonus is now active for withdrawal.", "success");
            }
            return {
                ...u,
                kycStatus: 'verified',
                profile: u.profile ? {
                    ...u.profile,
                    virtualAccounts
                } : null
            };
        }
        return u;
    }));
    notify("Congratulations!", `Identity verified! Your global bank bridges are now active.`, "success");
    dispatchSms(`WoW CONGRATULATIONS: Your KYC is verified. You now have access to global bank withdrawals and bill payments.`);
  };

  const handleRejectKyc = (userId: string, reason: string) => {
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {
          ...u,
          kycStatus: 'rejected',
          kycRejectionReason: reason
      } : u));
      notify("KYC Rejected", `Verification failed: ${reason}`, "error");
      dispatchSms(`WoW KYC ALERT: Your verification was unsuccessful. Reason: ${reason}. Please resubmit correct details.`);
  };

  const handleUnlockKyc = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {
        ...u,
        kycStatus: 'unverified',
        kycRejectionReason: 'Unlocked by Admin for modification.'
    } : u));
    notify("KYC Reset", "Profile fields have been unlocked for user editing.", "warning");
    dispatchSms(`WoW ALERT: Your KYC profile has been unlocked for modification. Update your details now.`);
  };

  const handleManualInvoiceSms = useCallback((tx: Transaction) => {
    dispatchSms(`WoW INVOICE RE-DISPATCH [${tx.id.substring(0,8).toUpperCase()}]: Type: ${tx.type.replace('_',' ')} | Amount: ${tx.amount} ${tx.currency} | Status: ${tx.status.toUpperCase()}. Thank you for using WoW.`);
  }, [dispatchSms]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden flex flex-col">
      <ErrorBoundary>
        {isLocked && <AuthOverlay users={users} onAuthSuccess={handleAuthSuccess} />}
        {isQuickLocked && !isLocked && <LoginOverlay onUnlock={() => setIsQuickLocked(false)} />}
        
        <Header 
          onOpenKyc={() => setKycModalOpen(true)} 
          onLogout={handleLogout}
          kycStatus={activeUser?.kycStatus || 'unverified'} 
          user={activeUser || undefined}
          notifications={notificationHistory}
          onMarkAsRead={markNotificationsAsRead}
          onClearAll={clearNotificationHistory}
        />
        
        {/* Mock SMS/Push Alert Gateway */}
        {smsQueue && (
          <div 
            onClick={() => setSmsQueue(null)}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-black/95 text-white p-5 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-start gap-4 animate-in slide-in-from-top-32 duration-500 z-[300] ring-1 ring-white/20 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="bg-[#2A74B1] p-3 rounded-2xl shadow-lg shadow-blue-500/30 shrink-0">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
               </svg>
            </div>
            <div className="flex-1 overflow-hidden">
               <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">WoW SMS GATEWAY • NOW</p>
                  <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
               </div>
               <p className="text-[11px] font-black text-blue-400 mb-1">TO: {smsQueue.phone}</p>
               <p className="text-sm font-bold text-gray-100 leading-tight">{smsQueue.message}</p>
            </div>
          </div>
        )}

        {/* Global Notification Stack - Side Aligned Right */}
        <div className="fixed top-24 right-4 z-[100] pointer-events-none flex flex-col items-end gap-3 w-80 max-w-[calc(100vw-2rem)]">
            {notifications.map(n => (
                <div key={n.id} className="pointer-events-auto w-full">
                    <NotificationToast notification={n} onDismiss={dismissNotification} />
                </div>
            ))}
        </div>

        <main className={`flex-1 p-4 md:p-8 lg:p-12 transition-all duration-700 ${isLocked ? 'blur-2xl scale-95 opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar / Top area for Ticker on Mobile, Sidebar on Desktop */}
              <div className="lg:col-span-4 space-y-8 order-1 lg:order-2">
                <ExchangeRateTicker 
                    marketData={marketData} 
                    isRefreshing={isRefreshingRates} 
                    onManualRefresh={() => refreshMarketRates(true)} 
                />
                <div className="hidden lg:block">
                  <TransactionHistory transactions={transactions} onResendInvoice={handleManualInvoiceSms} />
                </div>
              </div>

              {/* Central Core Content */}
              <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">
                {activeUser && (
                    <CurrencyConverter 
                        user={activeUser} 
                        allUsers={users}
                        marketRates={marketData?.rates || []}
                        treasuryBalances={treasuryBalances}
                        transactions={transactions}
                        onOpenKyc={() => setKycModalOpen(true)}
                        addTransaction={addTransaction}
                        handleDeposit={handleDeposit}
                        handlePayment={handlePayment}
                        handleCashback={handleCashback}
                        handleReferral={handleReferral}
                        handleConversionFee={handleConversionFeeRouting}
                        handleSettlement={(c: string, a: number) => {
                            setTreasuryBalances(prev => ({ ...prev, [c]: 0 }));
                            notify("Settlement Initiated", `${a.toFixed(4)} ${c} sent to ecosystem pool.`, "info");
                            dispatchSms(`WoW TREASURY: Settlement of ${a.toFixed(4)} ${c} initiated to global pool.`);
                        }}
                        onApproveKyc={handleApproveKyc}
                        onRejectKyc={handleRejectKyc}
                        onReleaseTransaction={handleReleaseTransaction}
                        onFreezeTransaction={handleFreezeTransaction}
                        onDivertTransaction={handleDivertTransaction}
                        onSweepFunds={handleSweepFunds}
                        onUnlockKyc={handleUnlockKyc}
                        onUpdateUser={handleUpdateUser}
                        notify={notify}
                        dispatchSms={dispatchSms}
                    />
                )}
                {/* Mobile/Tablet view for Transactions */}
                <div className="lg:hidden">
                   <TransactionHistory transactions={transactions} onResendInvoice={handleManualInvoiceSms} />
                </div>
              </div>
            </div>
          </div>
        </main>

        <KycModal
          isOpen={isKycModalOpen}
          onClose={() => setKycModalOpen(false)}
          onSubmit={handleKycSubmit}
        />
      </ErrorBoundary>
    </div>
  );
};

export default App;
