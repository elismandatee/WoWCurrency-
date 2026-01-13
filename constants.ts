
import React from 'react';
import type { Currency, FundingSource } from './types';
import PiIcon from './components/icons/PiIcon';
import BtcIcon from './components/icons/BtcIcon';
import EthIcon from './components/icons/EthIcon';
import UsdtIcon from './components/icons/UsdtIcon';
import NgnIcon from './components/icons/NgnIcon';
import UsdIcon from './components/icons/UsdIcon';
import BnbIcon from './components/icons/BnbIcon';
import BanknotesIcon from './components/icons/BanknotesIcon';
import GlobeIcon from './components/icons/GlobeIcon';

export const FROM_CURRENCIES: Currency[] = [
  {
    code: 'PI',
    name: 'Pi Network',
    icon: React.createElement(PiIcon, { className: 'w-6 h-6' }),
    isCrypto: true,
    symbol: 'π',
    address: 'pi_3QJ8m1e1s9aG5a1c3eR7n9mK2v6zC8jF4p'
  },
  {
    code: 'BTC',
    name: 'Bitcoin',
    icon: React.createElement(BtcIcon, { className: 'w-6 h-6' }),
    isCrypto: true,
    symbol: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    icon: React.createElement(EthIcon, { className: 'w-6 h-6' }),
    isCrypto: true,
    symbol: 'ETH',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
  },
  {
    code: 'USDT',
    name: 'Tether',
    icon: React.createElement(UsdtIcon, { className: 'w-6 h-6' }),
    isCrypto: true,
    symbol: 'USDT',
    address: 'TKh3EstyrsFaZr2dVeZjEzUiFiEDJ4DwQM'
  },
  {
    code: 'BNB',
    name: 'Binance Coin',
    icon: React.createElement(BnbIcon, { className: 'w-6 h-6' }),
    isCrypto: true,
    symbol: 'BNB',
    address: 'bnb136ns6lfw4s5gabc5hpijn9gpfme2f3g4h4csf3'
  },
];

export const TO_CURRENCIES: Currency[] = [
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    icon: React.createElement(NgnIcon, { className: 'w-6 h-6' }),
    isCrypto: false,
    symbol: '₦',
  },
  {
    code: 'USD',
    name: 'US Dollar',
    icon: React.createElement(UsdIcon, { className: 'w-6 h-6' }),
    isCrypto: false,
    symbol: '$',
  },
  {
    code: 'EUR',
    name: 'Euro',
    icon: React.createElement(UsdIcon, { className: 'w-6 h-6 text-blue-600' }), 
    isCrypto: false,
    symbol: '€',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    icon: React.createElement(UsdIcon, { className: 'w-6 h-6 text-purple-600' }),
    isCrypto: false,
    symbol: '£',
  },
];

export const FUNDING_SOURCES: FundingSource[] = [
    {
        id: 'pi_app',
        name: 'Pi Network (PI)',
        description: 'Direct Mainnet Transfer',
        creditsCurrency: 'PI',
        isCrypto: true,
        networks: ['Mainnet', 'Testnet'],
        icon: React.createElement(PiIcon, { className: 'w-6 h-6' })
    },
    {
        id: 'btc_generic',
        name: 'Bitcoin (BTC)',
        description: 'Original Crypto Gold',
        creditsCurrency: 'BTC',
        isCrypto: true,
        networks: ['Legacy', 'SegWit', 'Native SegWit (bech32)', 'Lightning'],
        icon: React.createElement(BtcIcon, { className: 'w-6 h-6' })
    },
    {
        id: 'eth_generic',
        name: 'Ethereum (ETH)',
        description: 'DeFi & Smart Contracts',
        creditsCurrency: 'ETH',
        isCrypto: true,
        networks: ['Mainnet', 'Arbitrum One', 'Optimism', 'Base', 'Polygon PoS'],
        icon: React.createElement(EthIcon, { className: 'w-6 h-6' })
    },
    {
        id: 'usdt_generic',
        name: 'Tether (USDT)',
        description: 'The Most Trusted Stablecoin',
        creditsCurrency: 'USDT',
        isCrypto: true,
        networks: ['TRC20', 'ERC20', 'BEP20 (BSC)', 'Polygon', 'Solana'],
        icon: React.createElement(UsdtIcon, { className: 'w-6 h-6' })
    },
    {
        id: 'bnb_generic',
        name: 'BNB (Binance)',
        description: 'Binance Ecosystem Fuel',
        creditsCurrency: 'BNB',
        isCrypto: true,
        networks: ['BEP20 (Smart Chain)', 'BEP2 (Beacon Chain)', 'opBNB'],
        icon: React.createElement(BnbIcon, { className: 'w-6 h-6' })
    },
    {
        id: 'bank_ng',
        name: 'Nigerian Bank Transfer',
        description: 'Settled via OPay/Kuda',
        creditsCurrency: 'NGN',
        isCrypto: false,
        icon: React.createElement(NgnIcon, { className: 'w-6 h-6' })
    },
    {
        id: 'paypal',
        name: 'PayPal Checkout',
        description: 'Global Digital Payment',
        creditsCurrency: 'USD',
        isCrypto: false,
        icon: React.createElement(UsdIcon, { className: 'w-6 h-6' })
    },
    {
        id: 'visa_mastercard',
        name: 'Visa/Mastercard',
        description: 'Stripe Gateway',
        creditsCurrency: 'USD',
        isCrypto: false,
        icon: React.createElement(BanknotesIcon, { className: 'w-6 h-6 text-blue-600' })
    },
    {
        id: 'wire_intl',
        name: 'International Wire',
        description: 'SWIFT/SEPA Transfer',
        creditsCurrency: 'USD',
        isCrypto: false,
        icon: React.createElement(GlobeIcon, { className: 'w-6 h-6 text-orange-600' })
    }
];

export const ALL_CURRENCIES: Currency[] = [...FROM_CURRENCIES, ...TO_CURRENCIES];
export const DEPOSITABLE_CURRENCIES: Currency[] = ALL_CURRENCIES;

export const TELECOM_OPERATORS = [
    { code: 'mtn', name: 'MTN' },
    { code: 'glo', name: 'Glo' },
    { code: 'airtel', name: 'Airtel' },
    { code: '9mobile', name: '9mobile' },
];

export const ELECTRICITY_DISTROS = [
    { code: 'ikeja', name: 'Ikeja Electric (IKEDC)' },
    { code: 'eko', name: 'Eko Electric (EKEDC)' },
    { code: 'abuja', name: 'Abuja Electric (AEDC)' },
    { code: 'kano', name: 'Kano Electric (KEDCO)' },
    { code: 'enugu', name: 'Enugu Electric (EEDC)' },
];

export const DATA_PLANS = [
    { id: '1', name: '1.5 GB - 30 Days', price: 1000 },
    { id: '2', name: '4.5 GB - 30 Days', price: 2000 },
    { id: '3', name: '10 GB - 30 Days', price: 3500 },
    { id: '4', name: 'Weekly 750 MB - 7 Days', price: 500 },
];
