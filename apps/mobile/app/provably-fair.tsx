import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { verify } from '@pulso/provably-fair';

interface Session {
  id: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  revealed: boolean;
  serverSeed: string | null;
}

export default function ProvablyFairScreen() {
  const { api } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [clientSeed, setClientSeed] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Verification
  const [verifyServerSeed, setVerifyServerSeed] = useState('');
  const [verifyClientSeed, setVerifyClientSeed] = useState('');
  const [verifyNonce, setVerifyNonce] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ roll: number; hash: string } | null>(null);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    if (!api) return;
    setLoading(true);
    try {
      const res = await api.getSession();
      setSession(res.session);
      setClientSeed(res.session.clientSeed);
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClientSeed = async () => {
    if (!api) return;
    setUpdating(true);
    try {
      await api.setClientSeed(clientSeed);
      Alert.alert('Success', 'Client seed updated');
      loadSession();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleRotate = async () => {
    if (!api) return;
    setUpdating(true);
    try {
      await api.rotateSession();
      Alert.alert('Success', 'Session rotated. Previous server seed is now revealed.');
      loadSession();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to rotate');
    } finally {
      setUpdating(false);
    }
  };

  const handleVerify = () => {
    try {
      const result = verify(verifyServerSeed, verifyClientSeed, parseInt(verifyNonce, 10));
      setVerifyResult(result);
    } catch (err) {
      Alert.alert('Error', 'Verification failed. Check your inputs.');
      setVerifyResult(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Explanation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔐 How It Works</Text>
        <Text style={styles.cardText}>
          1. Before any play, we commit to a server seed by showing its SHA256 hash.
        </Text>
        <Text style={styles.cardText}>
          2. You can set your own client seed to influence the outcome.
        </Text>
        <Text style={styles.cardText}>
          3. After rotating your session, we reveal the old server seed.
        </Text>
        <Text style={styles.cardText}>
          4. You can verify any past play using the revealed seed.
        </Text>
      </View>

      {/* Current Session */}
      {session && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Session</Text>

          <Text style={styles.label}>Server Seed Hash</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} selectable>
              {session.serverSeedHash}
            </Text>
          </View>

          <Text style={styles.label}>Your Client Seed</Text>
          <TextInput
            style={styles.input}
            value={clientSeed}
            onChangeText={setClientSeed}
          />
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleUpdateClientSeed}
            disabled={updating}
          >
            <Text style={styles.secondaryButtonText}>Update Client Seed</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Current Nonce</Text>
          <Text style={styles.nonceText}>{session.nonce}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRotate}
            disabled={updating}
          >
            <Text style={styles.primaryButtonText}>
              Rotate Session (Reveals Server Seed)
            </Text>
          </TouchableOpacity>

          {session.revealed && session.serverSeed && (
            <>
              <Text style={styles.label}>Revealed Server Seed</Text>
              <View style={[styles.codeBox, styles.revealedBox]}>
                <Text style={styles.codeText} selectable>
                  {session.serverSeed}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Verifier */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔍 Verify a Play</Text>

        <Text style={styles.label}>Server Seed</Text>
        <TextInput
          style={styles.input}
          value={verifyServerSeed}
          onChangeText={setVerifyServerSeed}
          placeholder="Revealed server seed"
        />

        <Text style={styles.label}>Client Seed</Text>
        <TextInput
          style={styles.input}
          value={verifyClientSeed}
          onChangeText={setVerifyClientSeed}
          placeholder="Your client seed"
        />

        <Text style={styles.label}>Nonce</Text>
        <TextInput
          style={styles.input}
          value={verifyNonce}
          onChangeText={setVerifyNonce}
          placeholder="0"
          keyboardType="number-pad"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleVerify}>
          <Text style={styles.primaryButtonText}>Verify</Text>
        </TouchableOpacity>

        {verifyResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultRoll}>
              Roll: {(verifyResult.roll / 100).toFixed(2)}
            </Text>
            <Text style={styles.resultHash} selectable>
              Hash: {verifyResult.hash}
            </Text>
          </View>
        )}
      </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },
  codeBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  revealedBox: {
    backgroundColor: '#d1fae5',
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#374151',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  nonceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  resultRoll: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  resultHash: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#065f46',
  },
  spacer: {
    height: 40,
  },
});
