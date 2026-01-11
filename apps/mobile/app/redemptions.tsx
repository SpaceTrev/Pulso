import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { formatBalance } from '@pulso/shared';

interface Redemption {
  id: string;
  amountSC: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
}

export default function RedemptionsScreen() {
  const { api } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRedemptions();
  }, []);

  const loadRedemptions = async () => {
    if (!api) return;
    try {
      const res = await api.getMyRedemptions();
      setRedemptions(res.redemptions);
    } catch (err) {
      console.error('Failed to load redemptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRedemptions();
    setRefreshing(false);
  };

  const getStatusStyle = (status: Redemption['status']) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#fef3c7', text: '#b45309' };
      case 'APPROVED':
        return { bg: '#d1fae5', text: '#059669' };
      case 'REJECTED':
        return { bg: '#fee2e2', text: '#dc2626' };
    }
  };

  const renderItem = ({ item }: { item: Redemption }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemAmount}>
            💎 {formatBalance(BigInt(item.amountSC))} SC
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.itemDate}>
          Requested: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.processedAt && (
          <Text style={styles.itemDate}>
            Processed: {new Date(item.processedAt).toLocaleDateString()}
          </Text>
        )}
        {item.adminNotes && (
          <Text style={styles.itemNotes}>Note: {item.adminNotes}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mobile Notice */}
      <View style={styles.notice}>
        <Text style={styles.noticeEmoji}>📱</Text>
        <Text style={styles.noticeText}>
          Redemption requests can only be created on the web. Use this screen to view
          your request status.
        </Text>
      </View>

      {redemptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎁</Text>
          <Text style={styles.emptyText}>No redemptions yet</Text>
          <Text style={styles.emptySubtext}>
            Visit the website to request a redemption
          </Text>
        </View>
      ) : (
        <FlatList
          data={redemptions}
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
  notice: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  noticeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
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
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
