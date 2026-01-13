import React, { useState } from 'react';
import type { User } from '../types';
import GiftIcon from './icons/GiftIcon';
import UserPlusIcon from './icons/UserPlusIcon';

interface RewardsViewProps {
    user: User;
    handleReferral: () => void;
}

const RewardsView: React.FC<RewardsViewProps> = ({ user, handleReferral }) => {
    const [referralCode, setReferralCode] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isApplied, setIsApplied] = useState(false);

    const handleCopy = () => {
        if (!user.profile?.referralCode) return;
        navigator.clipboard.writeText(user.profile.referralCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleApplyCode = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically validate the code against a backend
        if(referralCode.trim() !== '') {
            handleReferral();
            setIsApplied(true);
            setReferralCode('');
             setTimeout(() => setIsApplied(false), 3000);
        }
    };

    return (
        <div className="space-y-6">
            {/* Cashback Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center mb-4">
                    <GiftIcon className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-xl font-bold text-gray-800 ml-3">Cashback Rewards</h3>
                </div>
                <p className="text-sm text-gray-500 mb-1">Your current balance:</p>
                <p className="text-4xl font-bold text-gray-900">
                    ₦{user.cashbackBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-2">Earn 1% cashback on all bill payments. Your cashback balance can be used for future transactions.</p>
            </div>

            {/* Refer and Earn Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center mb-4">
                    <UserPlusIcon className="w-8 h-8 text-purple-500" />
                    <h3 className="text-xl font-bold text-gray-800 ml-3">Refer & Earn</h3>
                </div>
                
                {user.profile?.referralCode ? (
                    <>
                        <p className="text-sm text-gray-600 mb-2">Share your code with friends. When they sign up and complete their first transaction, you both earn ₦500!</p>
                        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                            <input
                                type="text"
                                readOnly
                                value={user.profile.referralCode}
                                className="w-full bg-transparent font-mono text-gray-700 focus:outline-none"
                            />
                            <button onClick={handleCopy} className="bg-green-600 text-white font-semibold px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors">
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">Complete your KYC to get your referral code.</p>
                )}
                
                <div className="mt-6">
                    <form onSubmit={handleApplyCode} className="space-y-2">
                         <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">Have a referral code?</label>
                         <div className="flex items-center gap-2">
                             <input
                                id="referralCode"
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                placeholder="Enter code"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                            <button type="submit" className="bg-gray-800 text-white font-semibold px-4 py-2 rounded-md hover:bg-black transition-colors">
                                Apply
                            </button>
                         </div>
                         {isApplied && <p className="text-sm text-green-600 mt-1">Bonus of ₦500 applied successfully!</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RewardsView;
