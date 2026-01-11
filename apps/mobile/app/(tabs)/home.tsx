import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { formatBalance, CURRENCY_LABELS } from '@pulso/shared';

interface Balance {
  currency: 'GC' | 'SC';
  amount: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, api } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastClaim, setLastClaim] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!api) return;
    try {
      const [balanceRes, claimRes] = await Promise.all([
        api.getBalances(),
        api.getDailyClaimStatus(),
      ]);
      setBalances(balanceRes.balances);
      setLastClaim(claimRes.lastClaim);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleClaim = async () => {
    if (!api) return;
    setClaiming(true);
    try {
      await api.claimDaily();
      Alert.alert('Success! 🎉', 'You received your daily Sweepstakes Coins!');
      loadData();
    } catch (err: any) {
      Alert.alert('Cannot Claim', err.message || 'Please try again later');
    } finally {
      setClaiming(false);
    }
  };

  const canClaim = () => {
    if (!lastClaim) return true;
    const last = new Date(lastClaim);
    const now = new Date();
    const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
    return hoursSince >= 24;
  };

  const getTimeUntilClaim = () => {
    if (!lastClaim) return null;
    const last = new Date(lastClaim);
    const next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = next.getTime() - now.getTime();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getBalance = (currency: 'GC' | 'SC'): bigint => {
    const b = balances.find((b) => b.currency === currency);
    return b ? BigInt(b.amount) : 0n;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {user?.email?.split('@')[0] || 'Player'}! 👋
        </Text>
      </View>

      {/* Balances */}
      <View style={styles.balanceContainer}>
        <View style={[styles.balanceCard, { backgroundColor: '#fef3c7' }]}>
          <Text style={styles.balanceEmoji}>🪙</Text>
          <Text style={styles.balanceLabel}>{CURRENCY_LABELS.GC}</Text>
          <Text style={styles.balanceAmount}>{formatBalance(getBalance('GC'))}</Text>
        </View>
        <View style={[styles.balanceCard, { backgroundColor: '#d1fae5' }]}>
          <Text style={styles.balanceEmoji}>💎</Text>
          <Text style={styles.balanceLabel}>{CURRENCY_LABELS.SC}</Text>
          <Text style={styles.balanceAmount}>{formatBalance(getBalance('SC'))}</Text>
        </View>
      </View>

      {/* Daily Claim */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Reward</Text>
        {canClaim() ? (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={handleClaim}
            disabled={claiming}
          >
            <Text style={styles.claimButtonText}>
              {claiming ? 'Claiming...' : '🎁 Claim Free SC'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.claimTimer}>
            <Text style={styles.claimTimerText}>Next claim in: {getTimeUntilClaim()}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/play')}>
            <Text style={styles.actionEmoji}>🎲</Text>
            <Text style={styles.actionLabel}>Play Dice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/coins')}>
            <Text style={styles.actionEmoji}>🪙</Text>
            <Text style={styles.actionLabel}>Get Coins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/provably-fair')}>
            <Text style={styles.actionEmoji}>🔐</Text>
            <Text style={styles.actionLabel}>Verify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/redemptions')}>
            <Text style={styles.actionEmoji}>🎁</Text>
            <Text style={styles.actionLabel}>Rewards</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  claimButton: {
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  claimTimer: {
    backgroundColor: '#e5e7eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimTimerText: {
    color: '#666',
    fontSize: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
