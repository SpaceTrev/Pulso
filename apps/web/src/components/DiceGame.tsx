'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { calculateWinChance, calculateMultiplier, formatBalance, formatPercent, formatMultiplier, MULTIPLIER_PRECISION } from '@pulso/shared';

type Currency = 'GC' | 'SC';
type Direction = 'over' | 'under';

interface GameResult {
  id: string;
  result: number;
  win: boolean;
  payoutAmount: string;
  multiplier: number;
}

export function DiceGame() {
  const { api } = useAuth();
  const [currency, setCurrency] = useState<Currency>('GC');
  const [amount, setAmount] = useState('100'); // in smallest units
  const [target, setTarget] = useState(5000);
  const [direction, setDirection] = useState<Direction>('under');
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const winChance = calculateWinChance(target, direction);
  const multiplier = calculateMultiplier(target, direction);

  const handlePlay = async () => {
    setPlaying(true);
    setError(null);
    setResult(null);

    try {
      const playResult = await api.playDice({
        currency,
        amount,
        target,
        direction,
      });

      setResult({
        id: playResult.id,
        result: playResult.result,
        win: playResult.win,
        payoutAmount: playResult.payoutAmount,
        multiplier: playResult.multiplier,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to play');
    } finally {
      setPlaying(false);
    }
  };

  const displayAmount = Number(amount) / 100;

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4">🎲 Dice</h3>

      {/* Currency Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setCurrency('GC')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            currency === 'GC'
              ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
              : 'bg-gray-100 text-gray-600 border-2 border-transparent'
          }`}
        >
          🪙 Gold Coins
        </button>
        <button
          onClick={() => setCurrency('SC')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            currency === 'SC'
              ? 'bg-green-100 text-green-800 border-2 border-green-400'
              : 'bg-gray-100 text-gray-600 border-2 border-transparent'
          }`}
        >
          💎 Sweepstakes
        </button>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Play Amount
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={displayAmount}
            onChange={(e) => setAmount(String(Math.round(Number(e.target.value) * 100)))}
            min="0.10"
            step="0.10"
            className="input flex-1"
          />
          <button
            onClick={() => setAmount(String(Math.round(Number(amount) / 2)))}
            className="btn btn-secondary"
          >
            ½
          </button>
          <button
            onClick={() => setAmount(String(Number(amount) * 2))}
            className="btn btn-secondary"
          >
            2×
          </button>
        </div>
      </div>

      {/* Direction */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setDirection('under')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            direction === 'under'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Roll Under
        </button>
        <button
          onClick={() => setDirection('over')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            direction === 'over'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Roll Over
        </button>
      </div>

      {/* Target Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target: {(target / 100).toFixed(2)}
        </label>
        <input
          type="range"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          min="100"
          max="9800"
          step="100"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1.00</span>
          <span>98.00</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-500">Win Chance</div>
          <div className="text-xl font-bold">{formatPercent(winChance)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Multiplier</div>
          <div className="text-xl font-bold">{formatMultiplier(multiplier * MULTIPLIER_PRECISION)}</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`p-4 mb-4 rounded-lg ${result.win ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">
              {(result.result / 100).toFixed(2)}
            </div>
            <div className={`text-lg font-medium ${result.win ? 'text-green-800' : 'text-red-800'}`}>
              {result.win ? `Won ${formatBalance(result.payoutAmount)} ${currency}! 🎉` : 'No luck this time'}
            </div>
          </div>
        </div>
      )}

      {/* Play Button */}
      <button
        onClick={handlePlay}
        disabled={playing}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
          currency === 'GC'
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
        } disabled:opacity-50`}
      >
        {playing ? 'Rolling...' : `Roll for ${displayAmount.toFixed(2)} ${currency}`}
      </button>
    </div>
  );
}
