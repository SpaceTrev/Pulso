import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎰 Pulso</Text>
      <Text style={styles.subtitle}>Sweepstakes Casino for Mexico</Text>
      <View style={styles.features}>
        <Text style={styles.featureTitle}>Features</Text>
        <Text style={styles.feature}>✓ Provably Fair Gaming</Text>
        <Text style={styles.feature}>✓ Secure Authentication</Text>
        <Text style={styles.feature}>✓ Real-time Updates</Text>
        <Text style={styles.feature}>✓ Mobile First</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  features: {
    alignItems: 'flex-start',
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  feature: {
    fontSize: 16,
    marginBottom: 10,
  },
});
