
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>♻</Text>
        </View>

        <Text style={styles.title}>CHAKRAVA</Text>

        <Text style={styles.subtitle}>
          Smart Waste Management
        </Text>

        <Text style={styles.heading}>
          Welcome!
        </Text>

        <Text style={styles.description}>
          Choose how you want to access Chakrava.
        </Text>

        <Pressable
          style={styles.adminButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.adminButtonText}>
            Admin / Staff
          </Text>

          <Text style={styles.buttonDescription}>
            Manage waste collection and operations
          </Text>
        </Pressable>

        <Pressable
          style={styles.citizenButton}
          onPress={() => router.push('/citizen')}
        >
          <Text style={styles.citizenButtonText}>
            Citizen
          </Text>

          <Text style={styles.buttonDescription}>
            Track waste collection vehicles
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          Cleaner Cities. Smarter Future.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F8F3',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  logoText: {
    fontSize: 42,
    color: '#FFFFFF',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 2,
  },

  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
  },

  heading: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 42,
  },

  description: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 28,
    textAlign: 'center',
  },

  adminButton: {
    width: '100%',
    backgroundColor: '#166534',
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
  },

  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  citizenButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1E5D5',
  },

  citizenButtonText: {
    color: '#166534',
    fontSize: 18,
    fontWeight: '700',
  },

  buttonDescription: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 6,
  },

  footer: {
    position: 'absolute',
    bottom: 28,
    color: '#94A3B8',
    fontSize: 12,
  },
});
