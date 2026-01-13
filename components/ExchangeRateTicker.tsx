
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FROM_CURRENCIES, TO_CURRENCIES } from '../constants';
import type { Currency, GroundingSource } from '../types';
import type { BatchRatesResponse } from '../services/conversionService';
import ArrowPathIcon from './icons/ArrowPathIcon';
import GlobeIcon from './icons/GlobeIcon';

interface Rate {
    from: Currency;
    to: Currency;
    rate: number;
    change?: 'up' | 'down' | 'same';
}

interface ExchangeRateTickerProps {
    marketData: BatchRatesResponse | null;
    isRefreshing: boolean;
    onManualRefresh: () => void;
}

const RateChangeIndicator: React.FC<{ change?: Rate['change'] }> = ({ change }) => {
    if (change === 'up') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        );
    }
    if (change === 'down') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    }
    return null;
};

const RateCardSkeleton: React.FC = () => (
    <div className="flex-shrink-0 w-40 bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
    </div>
);

const ExchangeRateTicker: React.FC<ExchangeRateTickerProps> = ({ marketData, isRefreshing, onManualRefresh }) => {
    const [rates, setRates] = useState<Rate[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [showSources, setShowSources] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [pullStartY, setPullStartY] = useState<number | null>(null);

    const PULL_THRESHOLD = 70;

    useEffect(() => {
        if (!marketData) return;

        const newRatesData: Rate[] = marketData.rates.map(item => {
            const fromCur = FROM_CURRENCIES.find(c => c.code === item.from);
            const toCur = TO_CURRENCIES.find(c => c.code === item.to);
            if (!fromCur || !toCur) return null;
            return { from: fromCur, to: toCur, rate: item.rate };
        }).filter((r): r is Rate => r !== null);
        
        setRates(prevRates => {
            if (prevRates.length === 0) return newRatesData;
            const oldRatesMap = new Map<string, number>(prevRates.map(r => [`${r.from.code}-${r.to.code}`, r.rate]));
            return newRatesData.map(newRate => {
                const oldRate = oldRatesMap.get(`${newRate.from.code}-${newRate.to.code}`);
                let change: Rate['change'] = 'same';
                if (oldRate !== undefined) {
                    if (newRate.rate > oldRate) change = 'up';
                    if (newRate.rate < oldRate) change = 'down';
                }
                return { ...newRate, change };
            });
        });
        setLastUpdated(new Date());
    }, [marketData]);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (isRefreshing) return;
        setPullStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (pullStartY === null || isRefreshing) return;
        const currentY = e.touches[0].clientY;
        const distance = currentY - pullStartY;
        if (distance > 0) {
            const dampenedDistance = Math.pow(distance, 0.85);
            setPullDistance(Math.min(dampenedDistance, PULL_THRESHOLD + 30));
        }
    };

    const handleTouchEnd = () => {
        setPullStartY(null);
        if (pullDistance > PULL_THRESHOLD) {
            onManualRefresh();
        } else {
            setPullDistance(0);
        }
    };
    
    useEffect(() => {
        if (!isRefreshing) setPullDistance(0);
    }, [isRefreshing]);

    const pullTransformY = isRefreshing ? 40 : pullDistance;
    const transitionClass = pullStartY === null ? 'transition-all duration-300 ease-out' : '';

    return (
        <div
            className="bg-white rounded-2xl shadow-lg relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div 
                className={`absolute top-0 left-0 right-0 h-10 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${pullDistance > 10 || isRefreshing ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="flex items-center gap-2">
                    <ArrowPathIcon 
                        className={`h-4 w-4 text-[#2A74B1] ${isRefreshing ? 'animate-spin' : ''}`}
                        style={{ transform: !isRefreshing ? `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)` : 'none' }} 
                    />
                    <span className="text-[10px] font-black text-[#2A74B1] uppercase tracking-widest">
                        {isRefreshing ? 'Re-syncing...' : pullDistance > PULL_THRESHOLD ? 'Release to update' : 'Pull to refresh'}
                    </span>
                </div>
            </div>

            <div
                style={{ transform: `translateY(${pullTransformY}px)` }}
                className={`relative p-4 ${transitionClass}`}
            >
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-sm ${marketData?.isFallback ? 'bg-orange-400 shadow-orange-200' : 'bg-green-500 shadow-green-200'}`} />
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-tighter">
                            {marketData?.isFallback ? 'Stable Mode' : 'Live Market'}
                        </h3>
                        <button 
                            onClick={onManualRefresh}
                            disabled={isRefreshing}
                            className={`p-1 text-gray-300 hover:text-[#2A74B1] transition-colors rounded-md hover:bg-gray-50 ${isRefreshing ? 'animate-spin' : ''}`}
                            title="Refresh Rates"
                        >
                            <ArrowPathIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {lastUpdated && (
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                            {isRefreshing ? 'Syncing...' : `Ref: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                    )}
                </div>

                <div className={`flex space-x-3 overflow-x-auto pb-2 -mb-2 scrollbar-hide transition-opacity duration-300 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
                    {!marketData && rates.length === 0 ? (
                        <>
                            <RateCardSkeleton />
                            <RateCardSkeleton />
                            <RateCardSkeleton />
                        </>
                    ) : (
                        rates.map(rate => {
                            const changeColor = rate.change === 'up' ? 'text-green-600' : rate.change === 'down' ? 'text-red-500' : 'text-gray-800';
                            const flashClass = rate.change === 'up' ? 'bg-green-50/50' : rate.change === 'down' ? 'bg-red-50/50' : 'bg-gray-50';

                            return (
                                <div 
                                    key={`${rate.from.code}-${rate.to.code}`} 
                                    className={`flex-shrink-0 w-40 border border-gray-100 rounded-xl p-3 transition-all duration-500 ${flashClass} ${isRefreshing ? 'scale-[0.98]' : 'scale-100'}`}
                                >
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">{rate.from.code}/{rate.to.code}</p>
                                    <div className={`flex items-center text-lg font-black truncate ${changeColor}`}>
                                        <span className="text-xs mr-0.5 opacity-50">{rate.to.symbol}</span>
                                        {rate.rate.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                        <RateChangeIndicator change={rate.change} />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {marketData && marketData.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button 
                            onClick={() => setShowSources(!showSources)}
                            className="flex items-center gap-2 text-[10px] font-black text-[#2A74B1] uppercase tracking-widest hover:opacity-70 transition-opacity"
                        >
                            <GlobeIcon className="w-3 h-3" />
                            <span>Market Sources ({marketData.sources.length})</span>
                            <svg className={`w-3 h-3 transition-transform ${showSources ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showSources && (
                            <ul className="mt-2 space-y-1">
                                {marketData.sources.map((source, idx) => (
                                    <li key={idx}>
                                        <a 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-[9px] text-gray-400 hover:text-[#2A74B1] transition-colors truncate block"
                                            title={source.title}
                                        >
                                            {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExchangeRateTicker;
