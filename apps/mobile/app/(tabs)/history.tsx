import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { formatBalance, CURRENCY_LABELS } from '@pulso/shared';

interface GamePlay {
  id: string;
  gameType: string;
  currency: 'GC' | 'SC';
  stake: string;
  multiplierTenK: number;
  payout: string;
  diceTarget: number | null;
  diceRoll: number | null;
  diceDirection: string | null;
  createdAt: string;
}

export default function HistoryScreen() {
  const { api } = useAuth();
  const [history, setHistory] = useState<GamePlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!api) return;
    try {
      const res = await api.getGameHistory(1, 50);
      setHistory(res.plays);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const isWin = (play: GamePlay) => BigInt(play.payout) > BigInt(play.stake);

  const renderItem = ({ item }: { item: GamePlay }) => {
    const won = isWin(item);
    const stake = BigInt(item.stake);
    const payout = BigInt(item.payout);
    const profit = payout - stake;

    return (
      <View style={styles.item}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemGame}>🎲 Dice</Text>
          <Text style={styles.itemDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.itemDetails}>
            {item.diceRoll !== null && item.diceTarget !== null && (
              <>
                Roll: {(item.diceRoll / 100).toFixed(2)} |{' '}
                {item.diceDirection === 'UNDER' ? '<' : '>'}{' '}
                {(item.diceTarget / 100).toFixed(2)}
              </>
            )}
          </Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemStake}>
            {formatBalance(stake)} {item.currency === 'GC' ? '🪙' : '💎'}
          </Text>
          <View style={[styles.resultBadge, won ? styles.winBadge : styles.loseBadge]}>
            <Text style={[styles.resultText, won ? styles.winText : styles.loseText]}>
              {won ? `+${formatBalance(profit)}` : 'Loss'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📜</Text>
          <Text style={styles.emptyText}>No plays yet</Text>
          <Text style={styles.emptySubtext}>Start playing to see your history</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flex: 1,
  },
  itemGame: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemStake: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  winBadge: {
    backgroundColor: '#d1fae5',
  },
  loseBadge: {
    backgroundColor: '#fee2e2',
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  winText: {
    color: '#059669',
  },
  loseText: {
    color: '#dc2626',
  },
});
