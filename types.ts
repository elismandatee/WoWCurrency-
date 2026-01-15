
import type React from 'react';

export interface Currency {
  code: string;
  name: string;
  icon: React.ReactElement;
  isCrypto: boolean;
  symbol: string;
  address?: string; // For mock deposit addresses
}

export type Region = 'Africa' | 'Europe' | 'Americas' | 'Asia';

export interface VirtualAccount {
  bankName: string;
  accountNumber: string;
  routingInfo?: string; // ABA, IBAN, SWIFT etc.
  accountName: string;
  region: Region;
}

export interface FundingSource {
    id: string;
    name: string;
    description: string;
    icon: React.ReactElement;
    creditsCurrency: string; // The currency code this adds to the wallet
    isCrypto: boolean;
    network?: string; // Default or single network
    networks?: string[]; // Multiple available networks for selection
}

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface KycData {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    region: Region;
    idType: string;
    idNumber: string;
    idDocument: string | null; // Changed from File to string for Base64 storage
    bankName: string;
    accountNumber: string;
    phoneNumber?: string; // Added for profile sync
}

export interface User {
    id: string;
    username: string;
    role: 'admin' | 'user'; // Added for feature separation
    phoneNumber?: string;
    password?: string;
    profilePic?: string; // Added for profile management
    kycStatus: KycStatus;
    kycRejectionReason?: string;
    profile: KycData & { referralCode?: string; virtualAccounts?: VirtualAccount[] } | null;
    wallet: { [key: string]: number }; // e.g., { 'BTC': 0.5, 'ETH': 2.1 }
    lockedAssets: string[]; // List of currency codes that are frozen
    cashbackBalance: number;
    // --- BONUS LOCK TRACKING ---
    totalDepositedUsd: number;
    bonusPiAmount: number; // Usually 10
    // --- SECURITY ---
    biometricEnabled: boolean;
}

// --- NOTIFICATIONS ---
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    timestamp: Date;
    read: boolean;
    targetUserId?: string; // Added to enable notification filtering per user node
}

// --- TRANSACTIONS ---
export type TransactionType = 'conversion' | 'deposit' | 'bill_payment' | 'cashback' | 'referral_bonus' | 'settlement' | 'withdrawal' | 'transfer_send' | 'transfer_receive' | 'payment_request';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
    id: string;
    userId?: string; // Added to track which user the tx belongs to for admin actions
    date: Date;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    currency: string;
    fee?: number;
    feeCurrency?: string;
    // For conversions
    fromAmount?: number;
    fromCurrency?: string;
    toAmount?: number;
    toCurrency?: string;
    // For bill payments / withdrawals / transfers
    service?: string; // e.g., 'Airtime', 'Data', 'Electricity', 'Bank Payout'
    recipient?: string; // Phone number or meter number or Bank Account or Username
    costInCrypto?: number;
    cryptoUsed?: string;
    note?: string;
}

export interface TransferRequest {
    id: string;
    fromUserId: string; // The person requesting the money
    toUserId: string;   // The person asked to pay
    amount: number;
    currency: string;
    status: 'pending' | 'accepted' | 'declined';
    timestamp: Date;
    note?: string;
}

export interface TreasuryBalances {
    [currencyCode: string]: number;
}

export interface GroundingSource {
  uri: string;
  title: string;
}
