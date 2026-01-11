import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function CoinsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🪙</Text>
        <Text style={styles.title}>Coming Soon!</Text>
        <Text style={styles.subtitle}>
          Gold Coin purchase packages will be available here.
        </Text>
        <Text style={styles.disclaimer}>
          Remember: Gold Coins are for entertainment only and have no cash value.
        </Text>
      </View>

      <View style={styles.freeCard}>
        <Text style={styles.freeTitle}>🎁 Free Ways to Get Coins</Text>
        <Text style={styles.freeItem}>• Claim your daily free Sweepstakes Coins</Text>
        <Text style={styles.freeItem}>• Future: Social media giveaways</Text>
        <Text style={styles.freeItem}>• Future: Referral bonuses</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  freeCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  freeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b45309',
    marginBottom: 12,
  },
  freeItem: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 6,
  },
});
