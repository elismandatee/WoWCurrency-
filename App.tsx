
// Fix: Integrated OPay Settlement Service for official "Legal Functionality" and added Peer-to-Peer Transfer/Request logic.
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
import SwitchAccountModal from './components/SwitchAccountModal';
import { ALL_CURRENCIES, FROM_CURRENCIES, TO_CURRENCIES } from './constants';
import { getAllExchangeRates, BatchRatesResponse } from './services/conversionService';
import { sendSms } from './services/smsService';
import { initiateSettlement, createVirtualAccount } from './services/opayService';
// Import Firebase initialization to satisfy Gradle requirement fragments
import { onFirebaseConnectionChange } from './services/firebase'; 
import type { User, Transaction, AppNotification, NotificationType, TreasuryBalances, TransferRequest } from './types';

// Constants for commission and storage
const PLATFORM_FEE_RATE = 0.015; // 1.5% Commission
const USERS_STORAGE_KEY = 'wow_users_db';
const TX_STORAGE_KEY = 'wow_transactions_db';
const TREASURY_STORAGE_KEY = 'wow_treasury_db';
const SESSION_STORAGE_KEY = 'wow_session';
const NOTIFS_STORAGE_KEY = 'wow_notifications_db';
const REQUESTS_STORAGE_KEY = 'wow_transfer_requests_db';
const SCHEMA_VERSION_KEY = 'wow_schema_v';
const CURRENT_SCHEMA_VERSION = 13; // Incremented for visual updates

const App: React.FC = () => {
  // UI State
  const [isKycModalOpen, setKycModalOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  
  // Auth & Connection State
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  
  // Market Rates State
  const [marketData, setMarketData] = useState<BatchRatesResponse | null>(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  // ECOSYSTEM MIGRATION PROTOCOL
  const migrateUserData = useCallback((userData: any[]): User[] => {
    return userData.map(u => {
      const walletTemplate: Record<string, number> = { 'PI': 0, 'BTC': 0, 'ETH': 0, 'USDT': 0, 'BNB': 0, 'NGN': 0, 'USD': 0 };
      const currentWallet = u.wallet || {};
      const patched: User = {
        ...u,
        role: u.role || 'user',
        kycStatus: u.kycStatus || 'unverified',
        wallet: { ...walletTemplate, ...currentWallet },
        lockedAssets: Array.isArray(u.lockedAssets) ? u.lockedAssets : [],
        cashbackBalance: typeof u.cashbackBalance === 'number' ? u.cashbackBalance : 0,
        totalDepositedUsd: typeof u.totalDepositedUsd === 'number' ? u.totalDepositedUsd : 0,
        bonusPiAmount: typeof u.bonusPiAmount === 'number' ? u.bonusPiAmount : 10,
        biometricEnabled: typeof u.biometricEnabled === 'boolean' ? u.biometricEnabled : false,
      };
      if (patched.wallet['PI'] === 0 && patched.role !== 'admin' && !u.id.includes('owner')) {
          patched.wallet['PI'] = 10;
      }
      return patched;
    });
  }, []);

  // User Management State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    let userList: User[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        userList = migrateUserData(parsed);
      } catch (e) {
        console.error("Ledger Recovery Error:", e);
      }
    }
    const hasAdmin = userList.some((u: User) => u.phoneNumber === '08066821979');
    if (!hasAdmin) {
      userList.push({
        id: 'owner-node',
        username: 'elijah_owner',
        role: 'admin', 
        phoneNumber: '08066821979',
        password: 'password123',
        kycStatus: 'verified',
        profile: {
          fullName: 'Ogbonna Elijah Elem',
          dateOfBirth: '1990-01-01',
          nationality: 'Nigerian',
          region: 'Africa',
          idType: 'admin-master',
          idNumber: 'MASTER-ID-08066821979',
          idDocument: null,
          bankName: 'OPay Digital',
          accountNumber: '8066821979',
          phoneNumber: '08066821979'
        },
        wallet: { 'PI': 100, 'NGN': 500000, 'USD': 5000, 'BTC': 1, 'ETH': 5, 'USDT': 1000, 'BNB': 10 },
        lockedAssets: [],
        cashbackBalance: 0,
        totalDepositedUsd: 5000,
        bonusPiAmount: 0,
        biometricEnabled: false
      });
    }
    return userList;
  });

  const activeUser = useMemo(() => users.find(u => u.id === activeUserId) || null, [users, activeUserId]);
  
  // Treasury & Notifications State
  const [treasuryBalances, setTreasuryBalances] = useState<TreasuryBalances>(() => {
    const saved = localStorage.getItem(TREASURY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { 'PI': 0, 'BTC': 0, 'ETH': 0, 'USDT': 0, 'BNB': 0, 'NGN': 0, 'USD': 0 };
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(NOTIFS_STORAGE_KEY);
    return saved ? JSON.parse(saved).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })) : [];
  });
  const userNotificationHistory = useMemo(() => notificationHistory.filter(n => n.targetUserId === activeUserId), [notificationHistory, activeUserId]);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(TX_STORAGE_KEY);
    return saved ? JSON.parse(saved).map((tx: any) => ({ ...tx, date: new Date(tx.date) })) : [];
  });
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(() => {
    const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
    return saved ? JSON.parse(saved).map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })) : [];
  });

  // Sync state to local storage
  useEffect(() => { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(TREASURY_STORAGE_KEY, JSON.stringify(treasuryBalances)); }, [treasuryBalances]);
  useEffect(() => { localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(notificationHistory)); }, [notificationHistory]);
  useEffect(() => { localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(transferRequests)); }, [transferRequests]);

  // Session & Connection Recovery
  useEffect(() => {
    const session = localStorage.getItem(SESSION_STORAGE_KEY);
    if (session) {
      try {
        const { userId, expiry } = JSON.parse(session);
        if (Date.now() < expiry && users.some(u => u.id === userId)) {
          setActiveUserId(userId);
          const recoveredUser = users.find(u => u.id === userId);
          if (recoveredUser) setIsLocked(recoveredUser.biometricEnabled);
        }
      } catch (e) {}
    }
  }, [users]);

  // Firebase Realtime Connection Listener
  useEffect(() => {
    return onFirebaseConnectionChange((connected) => {
      setIsFirebaseConnected(connected);
    });
  }, []);

  // Market Rates Fetching
  const fetchRates = useCallback(async (force = false) => {
    setIsRefreshingRates(true);
    try {
      const data = await getAllExchangeRates(FROM_CURRENCIES.map(c => c.code), TO_CURRENCIES.map(c => c.code), force);
      setMarketData(data);
    } catch (e) {} finally {
      setIsRefreshingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(() => fetchRates(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  // Handlers
  const notify = useCallback((title: string, message: string, type: NotificationType = 'info', targetUserId?: string) => {
    const id = Math.random().toString(36).substring(7);
    const destinationId = targetUserId || activeUserId || '';
    const notif: AppNotification = { id, title, message, type, timestamp: new Date(), read: false, targetUserId: destinationId };
    if (destinationId === activeUserId) setNotifications(prev => [notif, ...prev]);
    setNotificationHistory(prev => [notif, ...prev.slice(0, 99)]);
  }, [activeUserId]);

  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'date'>) => {
    const id = crypto.randomUUID();
    const newTx: Transaction = { ...txData, id, date: new Date() };
    setTransactions(prev => [newTx, ...prev]);
    return id;
  }, []);

  const dispatchSms = useCallback(async (message: string, overridePhone?: string) => {
    const target = overridePhone || activeUser?.phoneNumber;
    if (target) await sendSms(target, message);
  }, [activeUser]);

  const handleDeposit = useCallback((currency: string, amount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== activeUserId) return u;
      const newWallet = { ...u.wallet };
      newWallet[currency] = (newWallet[currency] || 0) + amount;
      let totalDep = u.totalDepositedUsd;
      if (currency === 'USD') totalDep += amount;
      if (currency === 'NGN') totalDep += amount / 1600;
      return { ...u, wallet: newWallet, totalDepositedUsd: totalDep };
    }));
    addTransaction({ type: 'deposit', status: 'completed', amount, currency, userId: activeUserId || undefined });
    notify("Deposit Successful", `Successfully credited ${amount} ${currency} to your wallet.`, 'success');
  }, [activeUserId, addTransaction, notify]);

  const handlePayment = useCallback((currency: string, netAmount: number, feeAmount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== activeUserId) return u;
      const newWallet = { ...u.wallet };
      newWallet[currency] = (newWallet[currency] || 0) - (netAmount + feeAmount);
      return { ...u, wallet: newWallet };
    }));
    setTreasuryBalances(prev => ({ ...prev, [currency]: (prev[currency] || 0) + feeAmount }));
  }, [activeUserId]);

  const handleCompleteConversion = useCallback((fromCurr: string, fromAmt: number, toCurr: string, toAmt: number, fee: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== activeUserId) return u;
      const newWallet = { ...u.wallet };
      newWallet[fromCurr] = (newWallet[fromCurr] || 0) - (fromAmt + fee);
      newWallet[toCurr] = (newWallet[toCurr] || 0) + toAmt;
      return { ...u, wallet: newWallet };
    }));
    setTreasuryBalances(prev => ({ ...prev, [fromCurr]: (prev[fromCurr] || 0) + fee }));
  }, [activeUserId]);

  const handleCashback = useCallback((amount: number) => {
    setUsers(prev => prev.map(u => u.id === activeUserId ? { ...u, cashbackBalance: u.cashbackBalance + amount } : u));
  }, [activeUserId]);

  const handleReferral = useCallback(() => {
    setUsers(prev => prev.map(u => {
      if (u.id !== activeUserId) return u;
      const newWallet = { ...u.wallet };
      newWallet['NGN'] = (newWallet['NGN'] || 0) + 500;
      return { ...u, wallet: newWallet };
    }));
    addTransaction({ type: 'referral_bonus', status: 'completed', amount: 500, currency: 'NGN', userId: activeUserId || undefined });
    notify("Referral Applied", "Congratulations! ₦500 bonus added to your NGN wallet.", 'success');
  }, [activeUserId, addTransaction, notify]);

  const handleSettlement = useCallback(async (currency: string, amount: number) => {
    const ngnEquiv = currency === 'NGN' ? amount : (amount * 1600);
    notify("Dispatching Funds", `Initiating OPay settlement protocol for ${amount} ${currency}...`, 'info');
    const result = await initiateSettlement(ngnEquiv);
    if (result.success) {
      setTreasuryBalances(prev => ({ ...prev, [currency]: Math.max(0, (prev[currency] || 0) - amount) }));
      addTransaction({ type: 'settlement', status: 'completed', amount, currency, recipient: 'Ogbonna Elijah Elem (OPay 8066821979)', service: 'OPay Legal Gateway' });
      notify("Settlement Dispatched", `Dispatched ${amount} ${currency} to master treasury.`, 'success');
    } else {
      notify("Settlement Failed", `OPay Protocol Error: ${result.error}`, 'error');
    }
  }, [addTransaction, notify]);

  const handleDirectTransfer = useCallback((toUserId: string, amount: number, currency: string, note?: string) => {
    const toUser = users.find(u => u.id === toUserId);
    if (!activeUser || !toUser) return;
    const isVerified = activeUser.kycStatus === 'verified';
    let spendable = activeUser.wallet[currency] || 0;
    if (currency === 'PI' && !isVerified) spendable = Math.max(0, spendable - (activeUser.bonusPiAmount || 0));
    if (spendable < amount) {
        notify("Transfer Failed", "Insufficient spendable balance.", "error");
        return;
    }
    setUsers(prev => prev.map(u => {
        if (u.id === activeUserId) {
            const newWallet = { ...u.wallet };
            newWallet[currency] = (newWallet[currency] || 0) - amount;
            return { ...u, wallet: newWallet };
        }
        if (u.id === toUserId) {
            const newWallet = { ...u.wallet };
            newWallet[currency] = (newWallet[currency] || 0) + amount;
            return { ...u, wallet: newWallet };
        }
        return u;
    }));
    addTransaction({ type: 'transfer_send', status: 'completed', amount, currency, userId: activeUserId!, recipient: toUser.username, note });
    addTransaction({ type: 'transfer_receive', status: 'completed', amount, currency, userId: toUserId, recipient: activeUser.username, note });
    notify("Transfer Success", `Sent ${amount} ${currency} to @${toUser.username}.`, "success");
    notify("Funds Received", `@${activeUser.username} sent you ${amount} ${currency}.`, "success", toUserId);
  }, [activeUserId, activeUser, users, addTransaction, notify]);

  const handleCreateTransferRequest = useCallback((toUserId: string, amount: number, currency: string, note?: string) => {
    const toUser = users.find(u => u.id === toUserId);
    if (!activeUser || !toUser) return;
    const request: TransferRequest = { id: crypto.randomUUID(), fromUserId: activeUserId!, toUserId, amount, currency, status: 'pending', timestamp: new Date(), note };
    setTransferRequests(prev => [request, ...prev]);
    notify("Request Broadcasted", `Syncing ${amount} ${currency} request with @${toUser.username}.`, "info");
    notify("Payment Request", `@${activeUser.username} is requesting ${amount} ${currency}.`, "info", toUserId);
  }, [activeUserId, activeUser, users, notify]);

  const handleAcceptTransferRequest = useCallback((requestId: string) => {
    const request = transferRequests.find(r => r.id === requestId);
    if (!request || !activeUser) return;
    const isVerified = activeUser.kycStatus === 'verified';
    let spendable = activeUser.wallet[request.currency] || 0;
    if (request.currency === 'PI' && !isVerified) spendable = Math.max(0, spendable - (activeUser.bonusPiAmount || 0));
    if (spendable < request.amount) {
        notify("Payment Failed", `Insufficient ${request.currency} to pay this request.`, "error");
        return;
    }
    setUsers(prev => prev.map(u => {
        if (u.id === activeUserId) {
            const newWallet = { ...u.wallet };
            newWallet[request.currency] = (newWallet[request.currency] || 0) - request.amount;
            return { ...u, wallet: newWallet };
        }
        if (u.id === request.fromUserId) {
            const newWallet = { ...u.wallet };
            newWallet[request.currency] = (newWallet[request.currency] || 0) + request.amount;
            return { ...u, wallet: newWallet };
        }
        return u;
    }));
    setTransferRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));
    addTransaction({ type: 'transfer_send', status: 'completed', amount: request.amount, currency: request.currency, userId: activeUserId!, recipient: users.find(u => u.id === request.fromUserId)?.username || 'Unknown', note: `Paid Request: ${request.note}` });
    notify("Payment Success", `You paid the request of ${request.amount} ${request.currency}.`, "success");
    notify("Request Paid", `@${activeUser.username} has paid your request.`, "success", request.fromUserId);
  }, [activeUserId, activeUser, transferRequests, users, addTransaction, notify]);

  const handleDeclineTransferRequest = useCallback((requestId: string) => {
    setTransferRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'declined' } : r));
    notify("Request Aborted", "You have declined the request.", "info");
  }, [notify]);

  const handleAuthSuccess = (user: User) => {
    setUsers(prev => {
        const index = prev.findIndex(u => u.id === user.id);
        if (index !== -1) {
            const next = [...prev];
            next[index] = user;
            return next;
        }
        return [...prev, user];
    });
    setActiveUserId(user.id);
    setIsLocked(user.biometricEnabled);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: user.id, expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) }));
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setActiveUserId(null);
    setNotifications([]);
  };

  const approveKyc = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    notify("Identity Sync", `Provisioning real bank accounts for @${targetUser.username}...`, 'info');
    const opayResponse = await createVirtualAccount(targetUser.profile?.fullName || targetUser.username, targetUser.phoneNumber || '');
    if (opayResponse.success) {
        setUsers(prev => prev.map(u => {
            if (u.id === userId) {
                const updatedProfile = u.profile ? { ...u.profile, virtualAccounts: opayResponse.accounts } : null;
                return { ...u, kycStatus: 'verified', profile: updatedProfile };
            }
            return u;
        }));
        notify("KYC & Accounts Live", `Identity verified. Global OPay accounts generated.`, 'success');
    }
  };

  if (!activeUserId) return <AuthOverlay users={users} onAuthSuccess={handleAuthSuccess} />;
  if (isLocked) return <LoginOverlay onUnlock={() => setIsLocked(false)} />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 font-sans pb-20">
        <Header 
          onOpenKyc={() => setKycModalOpen(true)}
          onLogout={handleLogout}
          onSwitchAccount={() => setIsSwitchModalOpen(true)}
          kycStatus={activeUser?.kycStatus || 'unverified'}
          user={activeUser || undefined}
          notifications={userNotificationHistory}
          onMarkAsRead={() => setNotificationHistory(prev => prev.map(n => n.targetUserId === activeUserId ? { ...n, read: true } : n))}
          onClearAll={() => setNotificationHistory(prev => prev.filter(n => n.targetUserId !== activeUserId))}
          isFirebaseConnected={isFirebaseConnected}
        />
        
        <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          <ExchangeRateTicker marketData={marketData} isRefreshing={isRefreshingRates} onManualRefresh={() => fetchRates(true)} />
          <CurrencyConverter 
            user={activeUser!} 
            allUsers={users} 
            marketRates={marketData?.rates || []}
            treasuryBalances={treasuryBalances} 
            transactions={transactions}
            transferRequests={transferRequests}
            onOpenKyc={() => setKycModalOpen(true)} 
            addTransaction={addTransaction}
            handleDeposit={handleDeposit} 
            handlePayment={handlePayment}
            handleCompleteConversion={handleCompleteConversion} 
            handleCashback={handleCashback}
            handleReferral={handleReferral} 
            handleSettlement={handleSettlement}
            handleDirectTransfer={handleDirectTransfer}
            handleCreateTransferRequest={handleCreateTransferRequest}
            handleAcceptTransferRequest={handleAcceptTransferRequest}
            handleDeclineTransferRequest={handleDeclineTransferRequest}
            onApproveKyc={approveKyc} onRejectKyc={(uid, r) => setUsers(prev => prev.map(u => u.id === uid ? { ...u, kycStatus: 'rejected', kycRejectionReason: r } : u))}
            onReleaseTransaction={(txId) => setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status: 'completed' } : tx))} 
            onFreezeTransaction={(txId) => setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status: 'pending' } : tx))}
            onDivertTransaction={(txId) => setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status: 'completed' } : tx))} 
            onSweepFunds={(uid, c, a) => {
              setUsers(prev => prev.map(u => { if (u.id !== uid) return u; const w = {...u.wallet}; w[c] = Math.max(0, (w[c] || 0) - a); return {...u, wallet: w}; }));
              setTreasuryBalances(prev => ({ ...prev, [c]: (prev[c] || 0) + a }));
            }}
            onUnfreezeAsset={(uid, c) => setUsers(prev => prev.map(u => u.id === uid ? { ...u, lockedAssets: u.lockedAssets.filter(a => a !== c) } : u))} 
            onUnlockKyc={(uid) => setUsers(prev => prev.map(u => u.id === uid ? { ...u, kycStatus: 'unverified' } : u))}
            onUpdateUser={(updated) => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))} 
            notify={notify} 
            dispatchSms={dispatchSms}
          />
          <TransactionHistory transactions={transactions.filter(t => t.userId === activeUserId || activeUser?.role === 'admin')} />
        </main>

        <KycModal 
          isOpen={isKycModalOpen} 
          onClose={() => setKycModalOpen(false)}
          users={users}
          currentUserId={activeUserId!}
          onSubmit={(data) => {
            setUsers(prev => prev.map(u => u.id === activeUserId ? { ...u, kycStatus: 'pending', profile: { ...data, virtualAccounts: [] } } : u));
            setKycModalOpen(false);
          }}
        />

        <SwitchAccountModal 
          isOpen={isSwitchModalOpen} onClose={() => setIsSwitchModalOpen(false)}
          users={users} activeUserId={activeUserId}
          onSwitchAccount={(id) => { setActiveUserId(id); setIsSwitchModalOpen(false); }}
          onAddAccount={() => { setActiveUserId(null); setIsSwitchModalOpen(false); }}
        />

        <div className="fixed bottom-6 right-6 flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)] pointer-events-none z-[250]">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto">
              <NotificationToast notification={n} onDismiss={(id) => setNotifications(prev => prev.filter(x => x.id !== id))} />
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
