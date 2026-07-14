import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>HISTORICAL CLIENT · 1.0.0</Text>
      <Text style={styles.title}>API Time Machine</Text>
      <Text style={styles.body}>
        This shipped React Native release uses strict runtime enum validation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f3f0e8",
  },
  eyebrow: {
    color: "#855d35",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    color: "#191714",
    fontSize: 38,
    fontWeight: "700",
    marginBottom: 14,
  },
  body: {
    color: "#4a443d",
    fontSize: 18,
    lineHeight: 27,
  },
});
