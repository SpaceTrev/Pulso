import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatBalance,
  calculateWinChance,
  calculateMultiplier,
  GAME_CONFIG,
  CURRENCY_LABELS,
} from '@pulso/shared';

type Direction = 'UNDER' | 'OVER';
type Currency = 'GC' | 'SC';

interface Balance {
  currency: Currency;
  amount: string;
}

export default function PlayScreen() {
  const { api } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [currency, setCurrency] = useState<Currency>('GC');
  const [direction, setDirection] = useState<Direction>('UNDER');
  const [target, setTarget] = useState(5000); // 50.00
  const [stakeInput, setStakeInput] = useState('1.00');
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<{
    roll: number;
    won: boolean;
    payout: string;
  } | null>(null);

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    if (!api) return;
    try {
      const res = await api.getBalances();
      setBalances(res.balances);
    } catch (err) {
      console.error('Failed to load balances:', err);
    }
  };

  const getBalance = (c: Currency): bigint => {
    const b = balances.find((b) => b.currency === c);
    return b ? BigInt(b.amount) : 0n;
  };

  const winChance = calculateWinChance(target, direction);
  const multiplier = calculateMultiplier(winChance);

  const handlePlay = async () => {
    if (!api) return;

    const stakeUnits = BigInt(Math.floor(parseFloat(stakeInput) * 100));
    if (stakeUnits < BigInt(GAME_CONFIG.minStake)) {
      Alert.alert('Error', 'Minimum stake is 0.10');
      return;
    }
    if (stakeUnits > BigInt(GAME_CONFIG.maxStake)) {
      Alert.alert('Error', 'Maximum stake is 10,000.00');
      return;
    }
    if (stakeUnits > getBalance(currency)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setPlaying(true);
    setLastResult(null);

    try {
      const res = await api.playDice({
        currency,
        stake: stakeUnits.toString(),
        target,
        direction,
      });

      const stake = BigInt(res.play.stake);
      const payout = BigInt(res.play.payout);
      const won = payout > stake;

      setLastResult({
        roll: res.play.diceRoll,
        won,
        payout: formatBalance(payout),
      });

      loadBalances();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to play');
    } finally {
      setPlaying(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Balances */}
      <View style={styles.balanceRow}>
        <TouchableOpacity
          style={[styles.currencyButton, currency === 'GC' && styles.currencyActive]}
          onPress={() => setCurrency('GC')}
        >
          <Text style={styles.currencyEmoji}>🪙</Text>
          <Text style={styles.currencyAmount}>{formatBalance(getBalance('GC'))}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.currencyButton, currency === 'SC' && styles.currencyActive]}
          onPress={() => setCurrency('SC')}
        >
          <Text style={styles.currencyEmoji}>💎</Text>
          <Text style={styles.currencyAmount}>{formatBalance(getBalance('SC'))}</Text>
        </TouchableOpacity>
      </View>

      {/* Direction */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direction</Text>
        <View style={styles.directionRow}>
          <TouchableOpacity
            style={[styles.directionButton, direction === 'UNDER' && styles.directionActive]}
            onPress={() => setDirection('UNDER')}
          >
            <Text style={[styles.directionText, direction === 'UNDER' && styles.directionTextActive]}>
              Roll Under
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.directionButton, direction === 'OVER' && styles.directionActive]}
            onPress={() => setDirection('OVER')}
          >
            <Text style={[styles.directionText, direction === 'OVER' && styles.directionTextActive]}>
              Roll Over
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Target */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target: {(target / 100).toFixed(2)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={100}
          maximumValue={9899}
          step={1}
          value={target}
          onValueChange={setTarget}
          minimumTrackTintColor="#7c3aed"
          maximumTrackTintColor="#e5e7eb"
          thumbTintColor="#7c3aed"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>1.00</Text>
          <Text style={styles.sliderLabel}>98.99</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Win Chance</Text>
          <Text style={styles.statValue}>{winChance.toFixed(2)}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Multiplier</Text>
          <Text style={styles.statValue}>{multiplier.toFixed(4)}x</Text>
        </View>
      </View>

      {/* Stake */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stake ({CURRENCY_LABELS[currency]})</Text>
        <TextInput
          style={styles.stakeInput}
          value={stakeInput}
          onChangeText={setStakeInput}
          keyboardType="decimal-pad"
          placeholder="1.00"
        />
        <View style={styles.quickStakes}>
          {['1', '5', '10', '25'].map((val) => (
            <TouchableOpacity
              key={val}
              style={styles.quickStakeButton}
              onPress={() => setStakeInput(val + '.00')}
            >
              <Text style={styles.quickStakeText}>{val}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Result */}
      {lastResult && (
        <View
          style={[
            styles.resultCard,
            lastResult.won ? styles.resultWin : styles.resultLose,
          ]}
        >
          <Text style={styles.resultRoll}>
            Roll: {(lastResult.roll / 100).toFixed(2)}
          </Text>
          <Text style={styles.resultOutcome}>
            {lastResult.won ? `🎉 Won ${lastResult.payout}!` : '😔 Better luck next time'}
          </Text>
        </View>
      )}

      {/* Play Button */}
      <TouchableOpacity
        style={[styles.playButton, playing && styles.playButtonDisabled]}
        onPress={handlePlay}
        disabled={playing}
      >
        <Text style={styles.playButtonText}>
          {playing ? 'Rolling...' : '🎲 Roll Dice'}
        </Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  currencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  currencyActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
  },
  currencyEmoji: {
    fontSize: 20,
  },
  currencyAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  directionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  directionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  directionActive: {
    backgroundColor: '#7c3aed',
  },
  directionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  directionTextActive: {
    color: '#fff',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  stakeInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickStakes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickStakeButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickStakeText: {
    fontWeight: '600',
    color: '#374151',
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultWin: {
    backgroundColor: '#d1fae5',
  },
  resultLose: {
    backgroundColor: '#fee2e2',
  },
  resultRoll: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultOutcome: {
    fontSize: 16,
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#7c3aed',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  spacer: {
    height: 40,
  },
});
