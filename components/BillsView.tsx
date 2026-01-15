
import React, { useState, useMemo } from 'react';
import type { User, Transaction, Currency } from '../types';
import { FROM_CURRENCIES, TO_CURRENCIES, TELECOM_OPERATORS, ELECTRICITY_DISTROS, DATA_PLANS } from '../constants';
import { getExchangeRate } from '../services/conversionService';
import PhoneIcon from './icons/PhoneIcon';
import WifiIcon from './icons/WifiIcon';
import BoltIcon from './icons/BoltIcon';

const PLATFORM_FEE_RATE = 0.015;

interface BillsViewProps {
  user: User;
  handlePayment: (currencyCode: string, netAmount: number, feeAmount: number) => void;
  // Fix: Changed return type from void to string because App.tsx addTransaction returns the transaction ID
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => string;
  handleCashback: (amount: number) => void;
  notify: (title: string, message: string, type?: any) => void;
  dispatchSms?: (message: string) => void;
}

type ServiceType = 'airtime' | 'data' | 'electricity';

const BillsView: React.FC<BillsViewProps> = ({ user, handlePayment, addTransaction, handleCashback, notify, dispatchSms }) => {
  const [service, setService] = useState<ServiceType>('airtime');
  const [formData, setFormData] = useState({
      operator: TELECOM_OPERATORS[0].code,
      phone: '',
      amount: '1000',
      dataPlan: DATA_PLANS[0].id,
      distro: ELECTRICITY_DISTROS[0].code,
      meter: '',
  });
  const [payWith, setPayWith] = useState<Currency>(FROM_CURRENCIES.find(c => c.code === 'PI') || FROM_CURRENCIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };
  
  const paymentAmountNgn = useMemo(() => {
    if (service === 'data') {
        return DATA_PLANS.find(p => p.id === formData.dataPlan)?.price || 0;
    }
    return parseFloat(formData.amount) || 0;
  }, [service, formData.amount, formData.dataPlan]);

  const platformFeeNgn = useMemo(() => paymentAmountNgn * PLATFORM_FEE_RATE, [paymentAmountNgn]);
  const totalCostNgn = useMemo(() => paymentAmountNgn + platformFeeNgn, [paymentAmountNgn, platformFeeNgn]);

  // ENFORCE BONUS LOCK: Calculate spendable balance based on KYC status
  const spendable = useMemo(() => {
    const bal = user.wallet[payWith.code] || 0;
    const isVerified = user.kycStatus === 'verified';
    if (payWith.code === 'PI' && !isVerified) {
        return Math.max(0, bal - (user.bonusPiAmount || 0));
    }
    return bal;
  }, [user.wallet, payWith, user.kycStatus, user.bonusPiAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmountNgn <= 0) {
        setError('Please enter a valid amount.');
        return;
    }
    setIsLoading(true);
    setError('');

    try {
        const ngnCurrency = TO_CURRENCIES.find(c => c.code === 'NGN');
        if (!ngnCurrency) throw new Error('NGN currency configuration not found.');
        
        const rate = await getExchangeRate(payWith, ngnCurrency);
        const cryptoTotalCost = totalCostNgn / rate;
        const cryptoFee = platformFeeNgn / rate;
        const cryptoNetCost = paymentAmountNgn / rate;
        
        if (spendable < cryptoTotalCost) {
            if (payWith.code === 'PI' && user.kycStatus !== 'verified' && (user.wallet['PI'] || 0) >= cryptoTotalCost) {
                throw new Error(`Registration bonus is locked. Verify KYC to unlock.`);
            }
            throw new Error(`Insufficient spendable ${payWith.code} balance.`);
        }
        
        await new Promise(res => setTimeout(res, 1000));
        
        handlePayment(payWith.code, cryptoNetCost, cryptoFee);
        
        const txId = addTransaction({
            type: 'bill_payment',
            status: 'completed',
            amount: paymentAmountNgn,
            currency: 'NGN',
            service: service.charAt(0).toUpperCase() + service.slice(1),
            recipient: service === 'airtime' || service === 'data' ? formData.phone : formData.meter,
            costInCrypto: cryptoTotalCost,
            cryptoUsed: payWith.code,
            fee: cryptoFee,
            feeCurrency: payWith.code
        });
        
        const cashbackAmount = paymentAmountNgn * 0.01;
        handleCashback(cashbackAmount);

        notify("Payment Success", `Your ${service} payment of ₦${paymentAmountNgn.toLocaleString()} was successful.`, "success");
        // Fix: txId is now correctly recognized as a string
        dispatchSms?.(`WoW INVOICE [${txId.substring(0,8).toUpperCase()}]: ${service.toUpperCase()} successful. Recipient: ${service === 'electricity' ? formData.meter : formData.phone}. Paid ₦${totalCostNgn.toLocaleString()} via ${payWith.code}. ₦${cashbackAmount.toFixed(2)} cashback earned.`);
        
        setFormData(prev => ({...prev, amount: '1000', phone: '', meter: ''}));

    } catch (err: any) {
        setError(err.message || 'An error occurred during payment.');
        notify("Payment Failed", err.message || "Unable to complete transaction.", "error");
    } finally {
        setIsLoading(false);
    }
  };

  const renderServiceForm = () => {
    switch(service) {
        case 'airtime': return (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                    <select name="operator" value={formData.operator} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold">
                        {TELECOM_OPERATORS.map(op => <option key={op.code} value={op.code}>{op.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (NGN)</label>
                    <input type="text" name="amount" value={formData.amount} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold" />
                </div>
            </>
        );
        case 'data': return (
             <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                    <select name="operator" value={formData.operator} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold">
                        {TELECOM_OPERATORS.map(op => <option key={op.code} value={op.code}>{op.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Plan</label>
                    <select name="dataPlan" value={formData.dataPlan} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold">
                        {DATA_PLANS.map(plan => <option key={plan.id} value={plan.id}>{`${plan.name} - ₦${plan.price}`}</option>)}
                    </select>
                </div>
            </>
        );
         case 'electricity': return (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distributor</label>
                    <select name="distro" value={formData.distro} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold">
                        {ELECTRICITY_DISTROS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meter Number</label>
                    <input type="text" name="meter" value={formData.meter} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (NGN)</label>
                    <input type="text" name="amount" value={formData.amount} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-bold" />
                </div>
            </>
        );
    }
  }

  const renderServiceButton = (type: ServiceType, icon: React.ReactElement, label: string) => (
      <button onClick={() => setService(type)} className={`flex flex-col items-center justify-center p-3 rounded-lg w-full transition-colors ${service === type ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {/* Fix: Cast icon to React.ReactElement<any> to allow passing className via cloneElement */}
          {React.cloneElement(icon as React.ReactElement<any>, { className: 'h-6 w-6 mb-1'})}
          <span className="text-xs font-semibold">{label}</span>
      </button>
  );

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2">
            {renderServiceButton('airtime', <PhoneIcon />, 'Airtime')}
            {renderServiceButton('data', <WifiIcon />, 'Data')}
            {renderServiceButton('electricity', <BoltIcon />, 'Electricity')}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {renderServiceForm()}

            <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service Price</span>
                    <span className="font-bold">₦{paymentAmountNgn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Conv. Fee (1.5%)</span>
                    <span className="font-bold text-red-500">+₦{platformFeeNgn.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-800">
                    <span>Total Cost</span>
                    <span>₦{totalCostNgn.toLocaleString()}</span>
                </div>
            </div>

            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pay with</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {FROM_CURRENCIES.map(c => {
                        const isPi = c.code === 'PI';
                        const isLocked = isPi && user.kycStatus !== 'verified';
                        const bal = user.wallet[c.code] || 0;
                        const spend = isLocked ? Math.max(0, bal - (user.bonusPiAmount || 0)) : bal;
                        
                        return (
                            <button key={c.code} type="button" onClick={() => setPayWith(c)} className={`p-2 border rounded-lg text-left ${payWith.code === c.code ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}`}>
                                <div className="flex items-center">
                                    {c.icon}
                                    <span className="font-semibold ml-2">{c.code}</span>
                                </div>
                                <span className="text-[10px] text-gray-700 font-bold mt-1 block truncate">
                                    Spend: {spend.toLocaleString(undefined, {maximumFractionDigits: 4})}
                                </span>
                                {isLocked && (
                                    <span className="text-[7px] font-black text-orange-500 uppercase">KYC Lock</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <div className="pt-2">
                 <button
                    type="submit"
                    disabled={isLoading || user.kycStatus !== 'verified'}
                    className="w-full bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition-all duration-300 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                    >
                    {isLoading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : `Instant Pay ₦${totalCostNgn.toLocaleString()}`}
                </button>
            </div>
        </form>
    </div>
  );
};

export default BillsView;
