import quotesData from "@/assets/quotes.json";
import BackgroundWrapper from "@/src/components/BackgroundWrapper";
import { useAuth } from "@/src/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface Quote {
  _id: string;
  content: string;
  author: string;
  tags: string[];
}

export default function DailyMotivationScreen() {
  const { user } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchDate, setLastFetchDate] = useState<string>("");
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const fetchDailyQuote = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const today = new Date().toDateString();
      const cacheKey = 'daily_quote_cache';
      
      // Check if we have a cached quote for today
      if (!forceRefresh) {
        try {
          const cachedData = await AsyncStorage.getItem(cacheKey);
          if (cachedData) {
            const { date, quote: cachedQuote } = JSON.parse(cachedData);
            if (date === today && cachedQuote) {
              setQuote(cachedQuote);
              setLastFetchDate(today);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log('Cache read error:', error);
        }
      }
      
      // Get a random quote from local data
      const randomIndex = Math.floor(Math.random() * quotesData.length);
      const selectedQuote = quotesData[randomIndex];
      
      const formattedQuote: Quote = {
        _id: `local-${randomIndex}-${Date.now()}`,
        content: selectedQuote.quote,
        author: selectedQuote.author,
        tags: ['motivation', 'inspiration']
      };
      
      setQuote(formattedQuote);
      setLastFetchDate(today);
      
      // Cache the quote for today
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
          date: today,
          quote: formattedQuote
        }));
      } catch (error) {
        console.log('Cache write error:', error);
      }
      
    } catch (error) {
      console.error('Error getting daily quote:', error);
      // Fallback to a default quote if something goes wrong
      setQuote({
        _id: 'fallback',
        content: 'Start where you are. Use what you have. Do what you can.',
        author: 'Arthur Ashe',
        tags: ['motivation']
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toDateString();
    // Only fetch if we haven't fetched today
    if (lastFetchDate !== today) {
      fetchDailyQuote();
    }
  }, [lastFetchDate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon"; 
    return "Good Evening";
  };

  return (
    <BackgroundWrapper>
      <ScrollView style={{ flex: 1, paddingTop: headerHeight - 25 }}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {getGreeting()}{user?.displayName ? `, ${user.displayName}` : ""}
        </Text>
        <Text style={styles.subtitle}>Your Daily Motivation</Text>
      </View>

      <View style={styles.quoteCard}>
        <TouchableOpacity 
          style={styles.refreshIconButton} 
          onPress={() => fetchDailyQuote(true)}
          disabled={loading}
        >
          <Ionicons name="refresh" size={18} color="#2EA0FF" />
        </TouchableOpacity>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2EA0FF" />
            <Text style={styles.loadingText}>Loading your daily inspiration...</Text>
          </View>
        ) : quote ? (
          <>
            <Ionicons name="chatbubble-outline" size={24} color="#2EA0FF" style={styles.quoteIcon} />
            <Text style={styles.quoteText}>{quote.content}</Text>
            <Text style={styles.authorText}>— {quote.author}</Text>
          </>
        ) : (
          <Text style={styles.errorText}>No quote available</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.goToWorkoutsButton}
        onPress={href => router.push('/workouts')}
        disabled={loading}
      >
        <Ionicons name="barbell-outline" size={24} color="#000000ff" />
        <Text style={styles.goToWorkoutsText}>Log a New Workout</Text>
      </TouchableOpacity>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Today&apos;s Focus</Text>
        <View style={styles.focusCards}>
          <View style={styles.focusCard}>
            <Ionicons name="fitness" size={24} color="#2EA0FF" />
            <Text style={styles.focusTitle}>Workout</Text>
            <Text style={styles.focusSubtitle}>Stay consistent</Text>
          </View>
          <View style={styles.focusCard}>
            <Ionicons name="nutrition" size={24} color="#FF6B6B" />
            <Text style={styles.focusTitle}>Nutrition</Text>
            <Text style={styles.focusSubtitle}>Fuel your body</Text>
          </View>
          <View style={styles.focusCard}>
            <Ionicons name="water" size={24} color="#4ECDC4" />
            <Text style={styles.focusTitle}>Hydration</Text>
            <Text style={styles.focusSubtitle}>Stay hydrated</Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  goToWorkoutsButton: {
    backgroundColor: "#2EA0FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  goToWorkoutsText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  //container: {
  //  flex: 1,
    // Transparent to show blurred background
  ////},
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
  quoteCard: {
    backgroundColor: "rgba(17, 17, 17, 0.85)", // Semi-transparent for better readability
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // Subtle border
    minHeight: 150,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },
  quoteIcon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 17,
    color: "#fff",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 16,
    fontStyle: "italic",
  },
  authorText: {
    fontSize: 14,
    color: "#2EA0FF",
    textAlign: "center",
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
  },
  errorText: {
    color: "#888",
    textAlign: "center",
    fontSize: 14,
  },
  refreshIconButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    borderWidth: 1,
    borderColor: "#333",
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  focusCards: {
    flexDirection: "row",
    gap: 12,
  },
  focusCard: {
    flex: 1,
    backgroundColor: "rgba(17, 17, 17, 0.75)", // Semi-transparent
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  focusTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  focusSubtitle: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
});
